-- Apply after schema.sql to constrain an existing deployment to one hotel.
-- This intentionally fails if multiple property records exist; consolidate data
-- explicitly before retrying. No hotel or accounting data is deleted by this script.
create unique index if not exists properties_single_hotel_idx
  on public.properties ((true));
