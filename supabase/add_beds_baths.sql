-- Run this in your Supabase SQL editor
alter table public.properties add column if not exists bedrooms numeric default 0;
alter table public.properties add column if not exists bathrooms numeric default 0;
