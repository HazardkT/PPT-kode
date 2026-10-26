-- Apply this after schema.sql when the base schema is already installed.
-- Restrict invoice lines to the active room revenue account (4101).
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

drop trigger if exists invoice_items_room_revenue_guard on public.invoice_items;
create trigger invoice_items_room_revenue_guard
before insert or update of revenue_account_id, property_id on public.invoice_items
for each row execute function public.guard_room_revenue_account();
