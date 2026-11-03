-- Apply after schema.sql to add invoice cancellation with refund/reversal journals.
create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  payment_id uuid not null,
  invoice_id uuid not null,
  refund_number text not null,
  refunded_at date not null default current_date,
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'virtual_account', 'other')),
  amount numeric(14, 2) not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, refund_number),
  unique (payment_id, invoice_id),
  foreign key (property_id, payment_id) references public.payments(property_id, id),
  foreign key (property_id, invoice_id) references public.invoices(property_id, id)
);

alter table public.journal_entries
  drop constraint if exists journal_entries_check;
alter table public.journal_entries
  add column if not exists source_refund_id uuid,
  add column if not exists reversal_of_invoice_id uuid;

create unique index if not exists journal_entries_source_refund_uidx
  on public.journal_entries(source_refund_id) where source_refund_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_source_refund_fk') then
    alter table public.journal_entries add constraint journal_entries_source_refund_fk
      foreign key (property_id, source_refund_id) references public.payment_refunds(property_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'journal_entries_reversal_invoice_fk') then
    alter table public.journal_entries add constraint journal_entries_reversal_invoice_fk
      foreign key (property_id, reversal_of_invoice_id) references public.invoices(property_id, id);
  end if;
end;
$$;

alter table public.payment_refunds enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_refunds' and policyname = 'Members read refunds') then
    create policy "Members read refunds" on public.payment_refunds
    for select to authenticated using (public.is_property_member(property_id));
  end if;
end;
$$;
grant select on public.payment_refunds to authenticated;

create or replace function public.void_invoice(p_invoice_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices%rowtype;
  target_property public.properties%rowtype;
  target_payment record;
  target_refund_id uuid;
  target_journal_id uuid;
  target_refund_number text;
  reversal_journal_id uuid;
  invoice_subtotal numeric(14, 2);
  invoice_tax numeric(14, 2);
  invoice_total numeric(14, 2);
begin
  if length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Cancellation reason must contain at least 5 characters';
  end if;

  select * into target_invoice from public.invoices where id = p_invoice_id for update;
  if not found or not public.is_property_member(target_invoice.property_id) then
    raise exception 'Invoice not found or access denied';
  end if;
  if target_invoice.status <> 'issued' then
    raise exception 'Only issued invoices can be cancelled';
  end if;

  select coalesce(sum(subtotal), 0), coalesce(sum(tax_amount), 0)
  into invoice_subtotal, invoice_tax
  from public.invoice_items where invoice_id = p_invoice_id;
  invoice_total := invoice_subtotal + invoice_tax;
  if invoice_total <= 0 then raise exception 'Invoice has no posted value to reverse'; end if;

  select * into target_property from public.properties where id = target_invoice.property_id;
  if target_property.receivables_account_id is null then
    raise exception 'Configure a receivables account before cancelling invoices';
  end if;
  if target_property.cash_account_id is null and exists (
    select 1 from public.payment_allocations where invoice_id = p_invoice_id
  ) then
    raise exception 'Configure a cash account before refunding payments';
  end if;

  insert into public.journal_entries(
    property_id, entry_number, entry_date, description, reversal_of_invoice_id, status
  ) values (
    target_invoice.property_id,
    'JE-VOID-' || target_invoice.invoice_number,
    current_date,
    'Pembatalan ' || target_invoice.invoice_number || ' · ' || trim(p_reason),
    target_invoice.id,
    'posted'
  ) returning id into reversal_journal_id;

  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
  select target_invoice.property_id, reversal_journal_id, revenue_account_id,
    'Pembalik pendapatan · ' || target_invoice.invoice_number, sum(subtotal)
  from public.invoice_items
  where invoice_id = p_invoice_id and subtotal > 0
  group by revenue_account_id;
  if invoice_tax > 0 then
    if target_property.tax_payable_account_id is null then
      raise exception 'Configure a tax payable account before cancelling taxable invoices';
    end if;
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
    values (target_invoice.property_id, reversal_journal_id, target_property.tax_payable_account_id,
      'Pembalik pajak keluaran · ' || target_invoice.invoice_number, invoice_tax);
  end if;
  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
  values (target_invoice.property_id, reversal_journal_id, target_property.receivables_account_id,
    'Pembalik piutang · ' || target_invoice.invoice_number, invoice_total);

  for target_payment in
    select p.id as payment_id, p.method, pa.amount
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id and p.property_id = pa.property_id
    where pa.invoice_id = p_invoice_id and pa.property_id = target_invoice.property_id
    order by p.received_at, p.receipt_number
  loop
    target_refund_number := 'RFND-' || to_char(current_date, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.payment_refunds(
      property_id, payment_id, invoice_id, refund_number, refunded_at, method, amount, reason
    ) values (
      target_invoice.property_id, target_payment.payment_id, target_invoice.id,
      target_refund_number, current_date, target_payment.method, target_payment.amount, trim(p_reason)
    ) returning id into target_refund_id;

    insert into public.journal_entries(
      property_id, entry_number, entry_date, description, source_refund_id, status
    ) values (
      target_invoice.property_id, 'JE-' || target_refund_number, current_date,
      'Refund ' || target_refund_number || ' · ' || target_invoice.invoice_number,
      target_refund_id, 'posted'
    ) returning id into target_journal_id;
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
    values (target_invoice.property_id, target_journal_id, target_property.receivables_account_id,
      'Pembalik penerimaan · ' || target_invoice.invoice_number, target_payment.amount);
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
    values (target_invoice.property_id, target_journal_id, target_property.cash_account_id,
      'Dana dikembalikan · ' || target_invoice.invoice_number, target_payment.amount);
  end loop;

  update public.invoices set status = 'void' where id = p_invoice_id;
  return target_invoice.id;
end;
$$;

revoke all on function public.void_invoice(uuid, text) from public;
grant execute on function public.void_invoice(uuid, text) to authenticated;
