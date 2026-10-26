-- Hospitality revenue and accounts receivable schema for Supabase.
-- Apply once in the Supabase SQL Editor. Authentication is provided by Supabase Auth.
create extension if not exists pgcrypto;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  currency char(3) not null default 'IDR',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now()
);

-- A deployment represents one hotel; property_id remains the tenant key for RLS.
create unique index properties_single_hotel_idx on public.properties ((true));

create table public.property_members (
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'accountant' check (role in ('owner', 'manager', 'accountant', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (property_id, id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  legal_name text not null,
  tax_id text,
  billing_email text,
  billing_address text,
  created_at timestamptz not null default now(),
  unique (property_id, id)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_id uuid not null,
  company_id uuid,
  confirmation_code text not null,
  check_in date not null,
  check_out date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, confirmation_code),
  foreign key (property_id, guest_id) references public.guests(property_id, id),
  foreign key (property_id, company_id) references public.companies(property_id, id),
  check (check_out > check_in)
);

create table public.folios (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid,
  guest_id uuid not null,
  company_id uuid,
  folio_number text not null,
  status text not null default 'open' check (status in ('open', 'closed', 'invoiced', 'void')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (property_id, id),
  unique (property_id, folio_number),
  unique (reservation_id),
  foreign key (property_id, reservation_id) references public.reservations(property_id, id),
  foreign key (property_id, guest_id) references public.guests(property_id, id),
  foreign key (property_id, company_id) references public.companies(property_id, id)
);

create table public.folio_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  folio_id uuid not null,
  service_date date not null default current_date,
  category text not null check (category in ('room', 'food_beverage', 'spa', 'transport', 'other')),
  description text not null,
  quantity numeric(12, 3) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  tax_rate numeric(6, 5) not null default 0 check (tax_rate between 0 and 1),
  created_at timestamptz not null default now(),
  unique (property_id, id),
  foreign key (property_id, folio_id) references public.folios(property_id, id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, code)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  folio_id uuid,
  guest_id uuid,
  company_id uuid,
  invoice_number text not null,
  issued_at date not null default current_date,
  due_at date not null default (current_date + 14),
  currency char(3) not null default 'IDR',
  status text not null default 'draft' check (status in ('draft', 'issued', 'void')),
  bill_to_name text not null,
  bill_to_email text,
  bill_to_address text,
  notes text,
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, invoice_number),
  unique (folio_id),
  foreign key (property_id, folio_id) references public.folios(property_id, id),
  foreign key (property_id, guest_id) references public.guests(property_id, id),
  foreign key (property_id, company_id) references public.companies(property_id, id),
  check ((guest_id is not null)::integer + (company_id is not null)::integer = 1),
  check (due_at >= issued_at)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  invoice_id uuid not null,
  folio_item_id uuid,
  revenue_account_id uuid not null,
  description text not null,
  quantity numeric(12, 3) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  tax_rate numeric(6, 5) not null default 0 check (tax_rate between 0 and 1),
  subtotal numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  tax_amount numeric(14, 2) generated always as (round(quantity * unit_price * tax_rate, 2)) stored,
  foreign key (property_id, invoice_id) references public.invoices(property_id, id) on delete cascade,
  foreign key (property_id, folio_item_id) references public.folio_items(property_id, id),
  foreign key (property_id, revenue_account_id) references public.accounts(property_id, id),
  unique (folio_item_id)
);

create or replace function public.guard_room_revenue_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = new.revenue_account_id
      and property_id = new.property_id
      and code = '4101'
      and account_type = 'revenue'
      and is_active
  ) then
    raise exception 'Invoice items must use active room revenue account 4101';
  end if;
  return new;
end;
$$;

create trigger invoice_items_room_revenue_guard
before insert or update of revenue_account_id, property_id on public.invoice_items
for each row execute function public.guard_room_revenue_account();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  receipt_number text not null,
  received_at date not null default current_date,
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'virtual_account', 'other')),
  amount numeric(14, 2) not null check (amount > 0),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, receipt_number)
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  payment_id uuid not null,
  invoice_id uuid not null,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  foreign key (property_id, payment_id) references public.payments(property_id, id) on delete cascade,
  foreign key (property_id, invoice_id) references public.invoices(property_id, id),
  unique (payment_id, invoice_id)
);

create table public.payment_refunds (
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

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  entry_number text not null,
  entry_date date not null default current_date,
  description text not null,
  source_invoice_id uuid,
  source_payment_id uuid,
  source_refund_id uuid,
  reversal_of_invoice_id uuid,
  status text not null default 'draft' check (status in ('draft', 'posted', 'void')),
  audit_checksum text,
  created_at timestamptz not null default now(),
  unique (property_id, id),
  unique (property_id, entry_number),
  unique (source_invoice_id),
  unique (source_payment_id),
  unique (source_refund_id),
  foreign key (property_id, source_invoice_id) references public.invoices(property_id, id),
  foreign key (property_id, source_payment_id) references public.payments(property_id, id),
  foreign key (property_id, source_refund_id) references public.payment_refunds(property_id, id),
  foreign key (property_id, reversal_of_invoice_id) references public.invoices(property_id, id)
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  journal_entry_id uuid not null,
  account_id uuid not null,
  description text,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  foreign key (property_id, journal_entry_id) references public.journal_entries(property_id, id) on delete cascade,
  foreign key (property_id, account_id) references public.accounts(property_id, id),
  check ((debit = 0) <> (credit = 0))
);

alter table public.properties
  add column receivables_account_id uuid,
  add column cash_account_id uuid,
  add column tax_payable_account_id uuid,
  add constraint properties_receivables_account_fk foreign key (id, receivables_account_id) references public.accounts(property_id, id),
  add constraint properties_cash_account_fk foreign key (id, cash_account_id) references public.accounts(property_id, id),
  add constraint properties_tax_account_fk foreign key (id, tax_payable_account_id) references public.accounts(property_id, id);

create index reservations_property_dates_idx on public.reservations(property_id, check_in, check_out);
create index folios_property_status_idx on public.folios(property_id, status);
create index invoices_property_due_idx on public.invoices(property_id, due_at) where status = 'issued';
create index invoice_items_invoice_idx on public.invoice_items(property_id, invoice_id);
create index payments_property_date_idx on public.payments(property_id, received_at desc);
create index allocations_invoice_idx on public.payment_allocations(property_id, invoice_id);
create index journal_lines_entry_idx on public.journal_lines(property_id, journal_entry_id);

create or replace function public.is_property_member(target_property uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.property_members
    where property_id = target_property and user_id = auth.uid()
  );
$$;

create or replace function public.has_property_role(target_property uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.property_members
    where property_id = target_property
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.journal_entry_checksum(target_entry uuid)
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select encode(digest(convert_to(
    jsonb_build_object(
      'id', entry.id,
      'property_id', entry.property_id,
      'entry_number', entry.entry_number,
      'entry_date', entry.entry_date,
      'description', entry.description,
      'created_at', entry.created_at,
      'status', 'posted',
      'source_invoice_id', entry.source_invoice_id,
      'source_payment_id', entry.source_payment_id,
      'source_refund_id', entry.source_refund_id,
      'reversal_of_invoice_id', entry.reversal_of_invoice_id,
      'lines', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', line.id,
          'property_id', line.property_id,
          'account_id', line.account_id,
          'description', line.description,
          'debit', line.debit,
          'credit', line.credit
        ) order by line.account_id, line.id)
        from public.journal_lines line
        where line.journal_entry_id = entry.id
      ), '[]'::jsonb)
    )::text,
    'UTF8'
  ), 'sha256'), 'hex')
  from public.journal_entries entry
  where entry.id = target_entry;
$$;

create or replace function public.guard_journal_entry_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'posted' then
    raise exception 'Posted journal entries are immutable';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger journal_entries_immutable
before update or delete on public.journal_entries
for each row execute function public.guard_journal_entry_immutable();

create or replace function public.guard_journal_line_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entry_status text;
begin
  if tg_op <> 'INSERT' then
    select status into entry_status
    from public.journal_entries
    where id = old.journal_entry_id
    for update;
    if entry_status = 'posted' then
      raise exception 'Lines of posted journal entries are immutable';
    end if;
  end if;
  if tg_op <> 'DELETE' then
    select status into entry_status
    from public.journal_entries
    where id = new.journal_entry_id
    for update;
    if entry_status = 'posted' then
      raise exception 'Lines of posted journal entries are immutable';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger journal_lines_immutable
before insert or update or delete on public.journal_lines
for each row execute function public.guard_journal_line_immutable();

create or replace function public.stamp_journal_entry_checksum()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status <> 'posted' and new.status = 'posted' then
    new.audit_checksum := public.journal_entry_checksum(new.id);
  end if;
  return new;
end;
$$;

create trigger journal_entries_checksum
before update of status on public.journal_entries
for each row execute function public.stamp_journal_entry_checksum();

create or replace function public.verify_journal_entry_checksum(target_entry uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_property_member(entry.property_id)
    and entry.status = 'posted'
    and entry.audit_checksum = public.journal_entry_checksum(entry.id)
  from public.journal_entries entry
  where entry.id = target_entry;
$$;

create or replace function public.guard_payment_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_total numeric(14, 2);
  payment_used numeric(14, 2);
  invoice_total numeric(14, 2);
  invoice_paid numeric(14, 2);
  invoice_status text;
begin
  select amount into payment_total from public.payments
  where id = new.payment_id and property_id = new.property_id for update;
  if not found then raise exception 'Payment not found for this property'; end if;

  select coalesce(sum(amount), 0) into payment_used from public.payment_allocations
  where payment_id = new.payment_id and id <> new.id;
  if payment_used + new.amount > payment_total then
    raise exception 'Allocation exceeds payment amount';
  end if;

  select status into invoice_status from public.invoices
  where id = new.invoice_id and property_id = new.property_id for update;
  if not found or invoice_status <> 'issued' then
    raise exception 'Only issued invoices can receive allocations';
  end if;

  select coalesce(sum(subtotal + tax_amount), 0) into invoice_total
  from public.invoice_items where invoice_id = new.invoice_id;

  select coalesce(sum(amount), 0) into invoice_paid from public.payment_allocations
  where invoice_id = new.invoice_id and id <> new.id;
  if invoice_paid + new.amount > invoice_total then
    raise exception 'Allocation exceeds invoice balance';
  end if;
  return new;
end;
$$;

create trigger payment_allocation_guard
before insert or update on public.payment_allocations
for each row execute function public.guard_payment_allocation();

create or replace function public.issue_invoice(p_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices%rowtype;
  target_property public.properties%rowtype;
  target_journal_id uuid;
  invoice_subtotal numeric(14, 2);
  invoice_tax numeric(14, 2);
begin
  select * into target_invoice from public.invoices where id = p_invoice_id for update;
  if not found or not public.is_property_member(target_invoice.property_id) then
    raise exception 'Invoice not found or access denied';
  end if;
  if not public.has_property_role(target_invoice.property_id, array['owner', 'manager', 'accountant']) then
    raise exception 'Insufficient role to issue invoices';
  end if;
  if target_invoice.status <> 'draft' then raise exception 'Only draft invoices can be issued'; end if;

  select coalesce(sum(subtotal), 0), coalesce(sum(tax_amount), 0)
  into invoice_subtotal, invoice_tax
  from public.invoice_items where invoice_id = p_invoice_id;
  if invoice_subtotal + invoice_tax <= 0 then raise exception 'Invoice requires at least one non-zero line'; end if;

  select * into target_property from public.properties where id = target_invoice.property_id;
  if target_property.receivables_account_id is null then
    raise exception 'Configure a receivables account before issuing invoices';
  end if;
  if invoice_tax > 0 and target_property.tax_payable_account_id is null then
    raise exception 'Configure a tax payable account before issuing taxable invoices';
  end if;

  update public.invoices set status = 'issued' where id = p_invoice_id;
  insert into public.journal_entries(property_id, entry_number, entry_date, description, source_invoice_id, status)
  values (target_invoice.property_id, 'JE-' || target_invoice.invoice_number, target_invoice.issued_at,
    'Pendapatan ' || target_invoice.invoice_number, target_invoice.id, 'draft')
  returning id into target_journal_id;

  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
  values (target_invoice.property_id, target_journal_id, target_property.receivables_account_id,
    'Piutang usaha ' || target_invoice.invoice_number, invoice_subtotal + invoice_tax);
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
  update public.journal_entries set status = 'posted' where id = target_journal_id;
  return target_invoice.id;
end;
$$;

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
  if not public.has_property_role(target_invoice.property_id, array['owner', 'manager', 'accountant']) then
    raise exception 'Insufficient role to issue invoices';
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
    target_invoice.id, target_payment_id, 'draft')
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
  update public.journal_entries set status = 'posted' where id = target_journal_id;
  return target_payment_id;
end;
$$;

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
  if not public.has_property_role(target_invoice.property_id, array['owner', 'manager']) then
    raise exception 'Only an owner or manager can cancel invoices';
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
    'draft'
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
  update public.journal_entries set status = 'posted' where id = reversal_journal_id;

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
      target_refund_id, 'draft'
    ) returning id into target_journal_id;
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
    values (target_invoice.property_id, target_journal_id, target_property.receivables_account_id,
      'Pembalik penerimaan · ' || target_invoice.invoice_number, target_payment.amount);
    insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
    values (target_invoice.property_id, target_journal_id, target_property.cash_account_id,
      'Dana dikembalikan · ' || target_invoice.invoice_number, target_payment.amount);
    update public.journal_entries set status = 'posted' where id = target_journal_id;
  end loop;

  update public.invoices set status = 'void' where id = p_invoice_id;
  return target_invoice.id;
end;
$$;

create or replace function public.receive_payment(
  p_property_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_received_at date default current_date,
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
  invoice_total numeric(14, 2);
  invoice_paid numeric(14, 2);
begin
  if not public.is_property_member(p_property_id) then raise exception 'Access denied'; end if;
  if not public.has_property_role(p_property_id, array['owner', 'manager', 'accountant']) then
    raise exception 'Insufficient role to record payments';
  end if;
  select * into target_invoice from public.invoices
  where id = p_invoice_id and property_id = p_property_id for update;
  if not found or target_invoice.status <> 'issued' then raise exception 'Only issued invoices can receive payment'; end if;
  if p_amount <= 0 then raise exception 'Payment amount must be positive'; end if;

  select coalesce(sum(subtotal + tax_amount), 0) into invoice_total
  from public.invoice_items where invoice_id = p_invoice_id;
  select coalesce(sum(amount), 0) into invoice_paid
  from public.payment_allocations where invoice_id = p_invoice_id;
  if invoice_paid + p_amount > invoice_total then raise exception 'Payment exceeds invoice balance'; end if;

  select * into target_property from public.properties where id = p_property_id;
  if target_property.cash_account_id is null or target_property.receivables_account_id is null then
    raise exception 'Configure cash and receivables accounts before recording payments';
  end if;
  target_receipt_number := 'RCPT-' || to_char(p_received_at, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.payments(property_id, receipt_number, received_at, method, amount, reference)
  values (p_property_id, target_receipt_number, p_received_at, p_method, p_amount, p_reference)
  returning id into target_payment_id;
  insert into public.payment_allocations(property_id, payment_id, invoice_id, amount)
  values (p_property_id, target_payment_id, p_invoice_id, p_amount);

  insert into public.journal_entries(property_id, entry_number, entry_date, description, source_payment_id, status)
  values (p_property_id, 'JE-' || target_receipt_number, p_received_at,
    'Penerimaan ' || target_receipt_number || ' untuk ' || target_invoice.invoice_number, target_payment_id, 'draft')
  returning id into target_journal_id;
  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, debit)
  values (p_property_id, target_journal_id, target_property.cash_account_id, 'Kas diterima', p_amount);
  insert into public.journal_lines(property_id, journal_entry_id, account_id, description, credit)
  values (p_property_id, target_journal_id, target_property.receivables_account_id,
    'Pelunasan ' || target_invoice.invoice_number, p_amount);
  update public.journal_entries set status = 'posted' where id = target_journal_id;
  return target_payment_id;
end;
$$;

create or replace function public.guard_posted_journal_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  debit_total numeric(14, 2);
  credit_total numeric(14, 2);
begin
  if new.status = 'posted' then
    select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into debit_total, credit_total
    from public.journal_lines where journal_entry_id = new.id;
    if debit_total <= 0 or debit_total <> credit_total then
      raise exception 'Posted journal entry must have equal, non-zero debits and credits';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger posted_journal_must_balance
after insert or update on public.journal_entries
deferrable initially deferred
for each row execute function public.guard_posted_journal_balance();

revoke all on function public.issue_invoice(uuid) from public;
revoke all on function public.issue_paid_invoice(uuid, text, text) from public;
revoke all on function public.void_invoice(uuid, text) from public;
revoke all on function public.receive_payment(uuid, uuid, numeric, text, date, text) from public;
grant execute on function public.issue_invoice(uuid) to authenticated;
grant execute on function public.issue_paid_invoice(uuid, text, text) to authenticated;
grant execute on function public.void_invoice(uuid, text) to authenticated;
grant execute on function public.receive_payment(uuid, uuid, numeric, text, date, text) to authenticated;

create or replace view public.invoice_balances
with (security_invoker = true)
as
select
  i.id,
  i.property_id,
  i.invoice_number,
  i.folio_id,
  i.guest_id,
  i.company_id,
  i.bill_to_name,
  i.bill_to_email,
  i.issued_at,
  i.due_at,
  i.currency,
  i.status as lifecycle_status,
  coalesce(sum(distinct_total.total_amount), 0)::numeric(14, 2) as total_amount,
  coalesce(sum(distinct_paid.paid_amount), 0)::numeric(14, 2) as paid_amount,
  greatest(coalesce(sum(distinct_total.total_amount), 0) - coalesce(sum(distinct_paid.paid_amount), 0), 0)::numeric(14, 2) as balance_due
from public.invoices i
left join lateral (
  select sum(subtotal + tax_amount) as total_amount
  from public.invoice_items where invoice_id = i.id
) distinct_total on true
left join lateral (
  select sum(amount) as paid_amount
  from public.payment_allocations where invoice_id = i.id
) distinct_paid on true
group by i.id;

create or replace view public.receivables_aging
with (security_invoker = true)
as
select
  property_id,
  count(*) filter (where balance_due > 0) as open_invoice_count,
  sum(balance_due) filter (where balance_due > 0) as total_outstanding,
  sum(balance_due) filter (where balance_due > 0 and due_at >= current_date) as current_amount,
  sum(balance_due) filter (where balance_due > 0 and due_at < current_date and due_at >= current_date - 30) as overdue_1_30,
  sum(balance_due) filter (where balance_due > 0 and due_at < current_date - 30 and due_at >= current_date - 60) as overdue_31_60,
  sum(balance_due) filter (where balance_due > 0 and due_at < current_date - 60) as overdue_over_60
from public.invoice_balances
where lifecycle_status = 'issued'
group by property_id;

alter table public.properties enable row level security;
alter table public.property_members enable row level security;
alter table public.guests enable row level security;
alter table public.companies enable row level security;
alter table public.reservations enable row level security;
alter table public.folios enable row level security;
alter table public.folio_items enable row level security;
alter table public.accounts enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;

create policy "Members can read their properties" on public.properties
for select to authenticated using (public.is_property_member(id));
create policy "Members can read property membership" on public.property_members
for select to authenticated using (public.is_property_member(property_id));

create policy "Members read guests" on public.guests
for select to authenticated using (public.is_property_member(property_id));
create policy "Accounting roles manage guests" on public.guests
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']))
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']));
create policy "Members read companies" on public.companies
for select to authenticated using (public.is_property_member(property_id));
create policy "Accounting roles manage companies" on public.companies
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']))
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']));
create policy "Members read reservations" on public.reservations
for select to authenticated using (public.is_property_member(property_id));
create policy "Accounting roles manage reservations" on public.reservations
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']))
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']));
create policy "Members read folios" on public.folios
for select to authenticated using (public.is_property_member(property_id));
create policy "Accounting roles manage folios" on public.folios
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']))
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']));
create policy "Members read folio items" on public.folio_items
for select to authenticated using (public.is_property_member(property_id));
create policy "Accounting roles manage folio items" on public.folio_items
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']))
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']));
create policy "Members read accounts" on public.accounts
for select to authenticated using (public.is_property_member(property_id));
create policy "Managers manage accounts" on public.accounts
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager']))
with check (public.has_property_role(property_id, array['owner', 'manager']));
create policy "Members read invoices" on public.invoices
for select to authenticated using (public.is_property_member(property_id));
create policy "Members create draft invoices" on public.invoices
for insert to authenticated with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
create policy "Members edit draft invoices" on public.invoices
for update to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft')
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
create policy "Members delete draft invoices" on public.invoices
for delete to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
create policy "Members read invoice items" on public.invoice_items
for select to authenticated using (public.is_property_member(property_id));
create policy "Members add draft invoice items" on public.invoice_items
for insert to authenticated with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and exists (
  select 1 from public.invoices where id = invoice_id and status = 'draft'
));
create policy "Members edit draft invoice items" on public.invoice_items
for update to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and exists (
  select 1 from public.invoices where id = invoice_id and status = 'draft'
)) with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and exists (
  select 1 from public.invoices where id = invoice_id and status = 'draft'
));
create policy "Members delete draft invoice items" on public.invoice_items
for delete to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and exists (
  select 1 from public.invoices where id = invoice_id and status = 'draft'
));
create policy "Members read payments" on public.payments
for select to authenticated using (public.is_property_member(property_id));
create policy "Members read allocations" on public.payment_allocations
for select to authenticated using (public.is_property_member(property_id));
create policy "Members read refunds" on public.payment_refunds
for select to authenticated using (public.is_property_member(property_id));
create policy "Members read journal entries" on public.journal_entries
for select to authenticated using (public.is_property_member(property_id));
create policy "Members read journal lines" on public.journal_lines
for select to authenticated using (public.is_property_member(property_id));

grant select on public.invoice_balances, public.receivables_aging to authenticated;
revoke all on function public.journal_entry_checksum(uuid) from public;
revoke all on function public.verify_journal_entry_checksum(uuid) from public;
grant execute on function public.verify_journal_entry_checksum(uuid) to authenticated;
grant select on public.properties, public.property_members to authenticated;
grant select, insert, update, delete on public.guests, public.companies, public.reservations,
  public.folios, public.folio_items, public.accounts to authenticated;
grant select, insert, update, delete on public.invoices, public.invoice_items to authenticated;
grant select on public.payments, public.payment_allocations, public.payment_refunds,
  public.journal_entries, public.journal_lines to authenticated;
