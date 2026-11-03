-- Apply once to an existing deployment after taking a database backup.
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

alter table public.journal_entries add column if not exists audit_checksum text;

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

update public.journal_entries
set audit_checksum = public.journal_entry_checksum(id)
where status = 'posted';

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
    select status into entry_status from public.journal_entries
    where id = old.journal_entry_id for update;
    if entry_status = 'posted' then raise exception 'Lines of posted journal entries are immutable'; end if;
  end if;
  if tg_op <> 'DELETE' then
    select status into entry_status from public.journal_entries
    where id = new.journal_entry_id for update;
    if entry_status = 'posted' then raise exception 'Lines of posted journal entries are immutable'; end if;
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

create or replace function public.prepare_journal_entry_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' then new.status := 'draft'; end if;
  return new;
end;
$$;

create trigger journal_entries_prepare_insert
before insert on public.journal_entries
for each row execute function public.prepare_journal_entry_insert();

create or replace function public.post_journal_after_lines()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.journal_entries
  set status = 'posted'
  where id = new.journal_entry_id and status = 'draft';
  return new;
end;
$$;

create constraint trigger journal_entries_post_after_lines
after insert on public.journal_lines
deferrable initially deferred
for each row execute function public.post_journal_after_lines();

create or replace function public.guard_invoice_status_by_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    if old.status = 'draft' and new.status = 'issued'
      and public.has_property_role(new.property_id, array['owner', 'manager', 'accountant']) then
      return new;
    end if;
    if old.status = 'issued' and new.status = 'void'
      and public.has_property_role(new.property_id, array['owner', 'manager']) then
      return new;
    end if;
    raise exception 'Insufficient role or invalid invoice status transition';
  end if;
  return new;
end;
$$;

create trigger invoices_status_role_guard
before update of status on public.invoices
for each row execute function public.guard_invoice_status_by_role();

create or replace function public.guard_payment_insert_by_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_property_role(new.property_id, array['owner', 'manager', 'accountant']) then
    raise exception 'Insufficient role to record payments';
  end if;
  return new;
end;
$$;

create trigger payments_role_guard
before insert on public.payments
for each row execute function public.guard_payment_insert_by_role();

drop policy if exists "Property members manage guests" on public.guests;
drop policy if exists "Property members manage companies" on public.companies;
drop policy if exists "Property members manage reservations" on public.reservations;
drop policy if exists "Property members manage folios" on public.folios;
drop policy if exists "Property members manage folio items" on public.folio_items;
drop policy if exists "Property members manage accounts" on public.accounts;
drop policy if exists "Members create draft invoices" on public.invoices;
drop policy if exists "Members edit draft invoices" on public.invoices;
drop policy if exists "Members delete draft invoices" on public.invoices;
drop policy if exists "Members add draft invoice items" on public.invoice_items;
drop policy if exists "Members edit draft invoice items" on public.invoice_items;
drop policy if exists "Members delete draft invoice items" on public.invoice_items;

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

create policy "Members create draft invoices" on public.invoices
for insert to authenticated with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
create policy "Members edit draft invoices" on public.invoices
for update to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft')
with check (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
create policy "Members delete draft invoices" on public.invoices
for delete to authenticated using (public.has_property_role(property_id, array['owner', 'manager', 'accountant']) and status = 'draft');
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

revoke all on function public.journal_entry_checksum(uuid) from public;
revoke all on function public.verify_journal_entry_checksum(uuid) from public;
grant execute on function public.verify_journal_entry_checksum(uuid) to authenticated;
