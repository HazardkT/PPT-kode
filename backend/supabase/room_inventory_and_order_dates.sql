-- Apply once to an existing deployment after taking a database backup.
alter table public.invoices
  alter column due_at drop not null,
  add column if not exists check_in date,
  add column if not exists nights integer,
  add column if not exists room_type text,
  add column if not exists paid_on_issue boolean not null default false;

update public.invoices invoice
set check_in = coalesce(invoice.check_in, invoice.issued_at),
    nights = coalesce(invoice.nights, (
      select greatest(ceil(line.quantity)::integer, 1)
      from public.invoice_items line
      where line.property_id = invoice.property_id and line.invoice_id = invoice.id
      order by line.id
      limit 1
    )),
    room_type = coalesce(invoice.room_type, (
      select split_part(line.description, ' · ', 1)
      from public.invoice_items line
      where line.property_id = invoice.property_id and line.invoice_id = invoice.id
      order by line.id
      limit 1
    ))
where invoice.check_in is null
   or invoice.nights is null
   or invoice.room_type is null;

create table if not exists public.property_room_inventory (
  property_id uuid not null references public.properties(id) on delete cascade,
  room_type text not null check (room_type in ('Standard Room', 'Superior Room', 'Deluxe Room', 'Suite Room', 'Presidential Suite')),
  capacity integer not null check (capacity >= 0),
  primary key (property_id, room_type)
);

insert into public.property_room_inventory(property_id, room_type, capacity)
select property_row.id, inventory.room_type, inventory.capacity
from public.properties property_row
cross join (values
  ('Standard Room', 15),
  ('Superior Room', 10),
  ('Deluxe Room', 6),
  ('Suite Room', 3),
  ('Presidential Suite', 1)
) as inventory(room_type, capacity)
on conflict (property_id, room_type) do update set capacity = excluded.capacity;

create or replace function public.initialize_property_room_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.property_room_inventory(property_id, room_type, capacity) values
    (new.id, 'Standard Room', 15),
    (new.id, 'Superior Room', 10),
    (new.id, 'Deluxe Room', 6),
    (new.id, 'Suite Room', 3),
    (new.id, 'Presidential Suite', 1)
  on conflict (property_id, room_type) do nothing;
  return new;
end;
$$;

drop trigger if exists properties_initialize_room_inventory on public.properties;
create trigger properties_initialize_room_inventory
after insert on public.properties
for each row execute function public.initialize_property_room_inventory();

create or replace function public.guard_room_availability_on_issue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  room_capacity integer;
  reserved_rooms integer;
begin
  if old.status <> 'draft' or new.status <> 'issued' then return new; end if;
  if new.check_in is null or new.nights is null or new.nights < 1 or new.room_type is null then
    raise exception 'A valid room type, check-in date, and number of nights are required';
  end if;
  if new.check_in < current_date then raise exception 'Check-in date cannot be in the past'; end if;

  select capacity into room_capacity
  from public.property_room_inventory
  where property_id = new.property_id and room_type = new.room_type
  for update;
  if not found then raise exception 'Room inventory is not configured for %', new.room_type; end if;

  select count(*) into reserved_rooms
  from public.invoices existing
  where existing.property_id = new.property_id
    and existing.room_type = new.room_type
    and existing.status = 'issued'
    and existing.id <> new.id
    and existing.check_in < new.check_in + new.nights
    and new.check_in < existing.check_in + existing.nights;

  if reserved_rooms >= room_capacity then
    raise exception 'No % rooms are available for the selected dates', new.room_type;
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_check_room_availability on public.invoices;
create trigger invoices_check_room_availability
before update of status on public.invoices
for each row execute function public.guard_room_availability_on_issue();
create index if not exists invoices_room_occupancy_idx on public.invoices(property_id, room_type, check_in)
  where status = 'issued';

alter table public.property_room_inventory enable row level security;
drop policy if exists "Members read room inventory" on public.property_room_inventory;
create policy "Members read room inventory" on public.property_room_inventory
for select to authenticated using (public.is_property_member(property_id));
drop policy if exists "Managers manage room inventory" on public.property_room_inventory;
create policy "Managers manage room inventory" on public.property_room_inventory
for all to authenticated using (public.has_property_role(property_id, array['owner', 'manager']))
with check (public.has_property_role(property_id, array['owner', 'manager']));
grant select, insert, update, delete on public.property_room_inventory to authenticated;

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
  greatest(coalesce(sum(distinct_total.total_amount), 0) - coalesce(sum(distinct_paid.paid_amount), 0), 0)::numeric(14, 2) as balance_due,
  i.check_in,
  i.nights,
  i.room_type,
  i.paid_on_issue
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

grant select on public.invoice_balances to authenticated;
