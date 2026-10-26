-- Run after schema.sql. Replace the owner email with an existing Supabase Auth user.
do $$
declare
  owner_id uuid;
  v_property_id uuid;
begin
  select id into owner_id from auth.users where email = 'palma@hotel.com' limit 1;
  if owner_id is null then
    raise exception 'Create the owner in Supabase Auth and update the email in this seed first';
  end if;

  insert into public.properties(name, code, currency, timezone)
  values ('Palma Resort', 'PALMA-BALI', 'IDR', 'Asia/Jakarta')
  on conflict (code) do update set name = excluded.name
  returning id into v_property_id;

  insert into public.property_members(property_id, user_id, role)
  values (v_property_id, owner_id, 'owner')
  on conflict (property_id, user_id) do update set role = excluded.role;

  insert into public.accounts(property_id, code, name, account_type) values
    (v_property_id, '1101', 'Kas dan Bank', 'asset'),
    (v_property_id, '1201', 'Piutang Usaha', 'asset'),
    (v_property_id, '2101', 'Pajak Keluaran', 'liability'),
    (v_property_id, '4101', 'Pendapatan Kamar', 'revenue')
  on conflict (property_id, code) do nothing;

  update public.properties
    set receivables_account_id = (select id from public.accounts a where a.property_id = v_property_id and a.code = '1201'),
      cash_account_id = (select id from public.accounts a where a.property_id = v_property_id and a.code = '1101'),
      tax_payable_account_id = (select id from public.accounts a where a.property_id = v_property_id and a.code = '2101')
    where id = v_property_id;
end;
$$;
