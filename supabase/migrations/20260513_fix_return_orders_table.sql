create table if not exists public.return_orders (
    id text primary key,
    user_id uuid references auth.users (id) on delete cascade,
    order_number text,
    date timestamptz default now(),
    supply_order_id text,
    supply_order_number text,
    driver_id text,
    driver_name text,
    client_id text,
    client_name text,
    items jsonb not null default '[]'::jsonb,
    total_ventes numeric not null default 0,
    total_expenses numeric not null default 0,
    total_rc numeric not null default 0,
    amount_paid numeric not null default 0,
    note text,
    payment_cash numeric not null default 0,
    payment_cheque numeric not null default 0,
    payment_mygaz numeric not null default 0,
    payment_debt numeric not null default 0,
    payment_total numeric not null default 0,
    is_paid boolean not null default false,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.return_orders
    add column if not exists user_id uuid references auth.users (id) on delete cascade,
    add column if not exists order_number text,
    add column if not exists date timestamptz default now(),
    add column if not exists supply_order_id text,
    add column if not exists supply_order_number text,
    add column if not exists driver_id text,
    add column if not exists driver_name text,
    add column if not exists client_id text,
    add column if not exists client_name text,
    add column if not exists items jsonb not null default '[]'::jsonb,
    add column if not exists total_ventes numeric not null default 0,
    add column if not exists total_expenses numeric not null default 0,
    add column if not exists total_rc numeric not null default 0,
    add column if not exists amount_paid numeric not null default 0,
    add column if not exists note text,
    add column if not exists payment_cash numeric not null default 0,
    add column if not exists payment_cheque numeric not null default 0,
    add column if not exists payment_mygaz numeric not null default 0,
    add column if not exists payment_debt numeric not null default 0,
    add column if not exists payment_total numeric not null default 0,
    add column if not exists is_paid boolean not null default false,
    add column if not exists paid_at timestamptz,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

alter table public.return_orders
    alter column user_id set default auth.uid(),
    alter column items set default '[]'::jsonb,
    alter column total_ventes set default 0,
    alter column total_expenses set default 0,
    alter column total_rc set default 0,
    alter column amount_paid set default 0,
    alter column payment_cash set default 0,
    alter column payment_cheque set default 0,
    alter column payment_mygaz set default 0,
    alter column payment_debt set default 0,
    alter column payment_total set default 0,
    alter column is_paid set default false,
    alter column created_at set default now(),
    alter column updated_at set default now();

create index if not exists return_orders_user_id_idx
    on public.return_orders (user_id);

create index if not exists return_orders_date_idx
    on public.return_orders (date desc);

alter table public.return_orders enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'return_orders'
          and policyname = 'return_orders_select_own'
    ) then
        create policy "return_orders_select_own"
            on public.return_orders
            for select
            using (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'return_orders'
          and policyname = 'return_orders_insert_own'
    ) then
        create policy "return_orders_insert_own"
            on public.return_orders
            for insert
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'return_orders'
          and policyname = 'return_orders_update_own'
    ) then
        create policy "return_orders_update_own"
            on public.return_orders
            for update
            using (auth.uid() = user_id)
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'return_orders'
          and policyname = 'return_orders_delete_own'
    ) then
        create policy "return_orders_delete_own"
            on public.return_orders
            for delete
            using (auth.uid() = user_id);
    end if;
end
$$;
