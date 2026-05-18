create table if not exists public.work_methods (
    id uuid primary key default gen_random_uuid(),
    driver_id text not null,
    aide_livreur text,
    sector_id text not null,
    product_ids jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.work_methods enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.work_methods for select using (true);
create policy "Enable insert for authenticated users only" on public.work_methods for insert with check (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.work_methods for delete using (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.work_methods for update using (auth.role() = 'authenticated');