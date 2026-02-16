-- Create auction_categories table
create table if not exists public.auction_categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  base_price numeric not null check (base_price >= 0),
  timer integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create teams table
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  captain text,
  budget numeric not null check (budget >= 0),
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.auction_categories enable row level security;
alter table public.teams enable row level security;

-- Create policies (Adjust based on your auth needs)
-- Allow read access to everyone
create policy "Enable read access for all users" on public.auction_categories for select using (true);
create policy "Enable read access for all users" on public.teams for select using (true);

-- Allow insert/update/delete only for authenticated users (or specific admin role if you have one)
-- For now, enabling for authenticated users for simplicity
create policy "Enable insert for authenticated users only" on public.auction_categories for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.auction_categories for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.auction_categories for delete using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users only" on public.teams for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.teams for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.teams for delete using (auth.role() = 'authenticated');
