-- Apply after schema.sql for an existing Supabase deployment.
-- A paid-at-issue journal entry references both its invoice and its receipt.
alter table public.journal_entries
  drop constraint if exists journal_entries_check;

create or replace function public.issue_paid_invoice(
  p_invoice_id uuid,
  p_method text,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices%rowtype;
  target_property public.properties%rowtype;
  target_payment_id uuid;
  target_receipt_number text;
  target_journal_id uuid;
  invoice_subtotal numeric(14, 2);
  invoice_tax numeric(14, 2);
  invoice_total numeric(14, 2);
begin
  select * into target_invoice from public.invoices where id = p_invoice_id for update;
  if not found or not public.is_property_member(target_invoice.property_id) then
    raise exception 'Invoice not found or access denied';
  end if;
  if target_invoice.status <> 'draft' then raise exception 'Only draft invoices can be issued'; end if;

  select coalesce(sum(subtotal), 0), coalesce(sum(tax_amount), 0)
  into invoice_subtotal, invoice_tax
  from public.invoice_items where invoice_id = p_invoice_id;
  invoice_total := invoice_subtotal + invoice_tax;
  if invoice_total <= 0 then raise exception 'Invoice requires at least one non-zero line'; end if;

  select * into target_property from public.properties where id = target_invoice.property_id;
  if target_property.cash_account_id is null then
    raise exception 'Configure a cash account before issuing a paid invoice';
  end if;
  if invoice_tax > 0 and target_property.tax_payable_account_id is null then
    raise exception 'Configure a tax payable account before issuing taxable invoices';
  end if;

  update public.invoices set status = 'issued' where id = p_invoice_id;
  target_receipt_number := 'RCPT-' || to_char(current_date, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.payments(property_id, receipt_number, received_at, method, amount, reference)
  values (target_invoice.property_id, target_receipt_number, current_date, p_method, invoice_total, p_reference)
  returning id into target_payment_id;
  insert into public.payment_allocations(property_id, payment_id, invoice_id, amount)
  values (target_invoice.property_id, target_payment_id, target_invoice.id, invoice_total);

  insert into public.journal_entries(property_id, entry_number, entry_date, description, source_invoice_id, source_payment_id, status)
  values (target_invoice.property_id, 'JE-' || target_receipt_number, current_date,
    'Faktur lunas ' || target_invoice.invoice_number || ' · ' || target_receipt_number,
    target_invoice.id, target_payment_id, 'posted')
  returning id into target_journal_id;
  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
  values (target_invoice.property_id, target_journal_id, target_property.cash_account_id,
    'Kas diterima · ' || target_invoice.invoice_number, invoice_total);
  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
  select target_invoice.property_id, target_journal_id, revenue_account_id, min(description), sum(subtotal)
  from public.invoice_items
  where invoice_id = p_invoice_id and subtotal > 0
  group by revenue_account_id;
  if invoice_tax > 0 then
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
    values (target_invoice.property_id, target_journal_id, target_property.tax_payable_account_id,
      'Pajak keluaran ' || target_invoice.invoice_number, invoice_tax);
  end if;
  if target_invoice.folio_id is not null then
    update public.folios set status = 'invoiced', closed_at = coalesce(closed_at, now()) where id = target_invoice.folio_id;
  end if;
  return target_payment_id;
end;
$$;

revoke all on function public.issue_paid_invoice(uuid, text, text) from public;
grant execute on function public.issue_paid_invoice(uuid, text, text) to authenticated;
