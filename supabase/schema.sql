-- Run this in your Supabase SQL editor to set up the database

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('landlord', 'tenant')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Properties (owned by landlords)
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  created_at timestamptz default now()
);
alter table public.properties enable row level security;
create policy "Landlords manage own properties" on public.properties
  using (auth.uid() = landlord_id);

-- Inspections
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id),
  tenant_id uuid references public.profiles(id),
  tenant_email text,
  tenant_name text,
  type text not null check (type in ('move_in', 'move_out')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  signature_data_url text,
  submitted_at timestamptz,
  notes text,
  created_at timestamptz default now()
);
alter table public.inspections enable row level security;
create policy "Landlords manage own inspections" on public.inspections
  for all using (auth.uid() = landlord_id);
create policy "Tenants view assigned inspections" on public.inspections
  for select using (auth.uid() = tenant_id or tenant_email = (select email from public.profiles where id = auth.uid()));
create policy "Tenants update assigned inspections" on public.inspections
  for update using (auth.uid() = tenant_id or tenant_email = (select email from public.profiles where id = auth.uid()));
-- Allow unauthenticated reads for public inspection links (tenant flow without login)
create policy "Public inspection link access" on public.inspections
  for select using (true);

-- Inspection rooms
create table public.inspection_rooms (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  name text not null,
  sort_order int default 0
);
alter table public.inspection_rooms enable row level security;
create policy "Room access follows inspection" on public.inspection_rooms
  for all using (
    exists (select 1 from public.inspections where id = inspection_id)
  );

-- Inspection items (within rooms)
create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.inspection_rooms(id) on delete cascade,
  name text not null,
  condition text check (condition in ('excellent', 'good', 'fair', 'poor', 'na')),
  notes text,
  sort_order int default 0
);
alter table public.inspection_items enable row level security;
create policy "Item access open" on public.inspection_items for all using (true);

-- Photos per item
create table public.inspection_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inspection_items(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);
alter table public.inspection_photos enable row level security;
create policy "Photo access open" on public.inspection_photos for all using (true);

-- Storage bucket for inspection photos
insert into storage.buckets (id, name, public) values ('inspection-photos', 'inspection-photos', true);
create policy "Anyone can upload inspection photos" on storage.objects
  for insert with check (bucket_id = 'inspection-photos');
create policy "Anyone can read inspection photos" on storage.objects
  for select using (bucket_id = 'inspection-photos');

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'tenant')
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
