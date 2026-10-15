-- DIYGH Store — Supabase schema (run once; every statement is idempotent)
-- Supabase → SQL Editor → paste → Run.
--
-- Grants give the anon/authenticated roles access to the tables; RLS is what
-- actually protects them (public read, public review insert, admin-only writes).

-- 1. Tables ---------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  sku text not null,
  price numeric not null check (price >= 0),
  category text not null default 'Components',
  short_description text not null default '',
  description text not null default '',
  specs jsonb not null default '[]',
  kit_contents jsonb not null default '[]',
  images jsonb not null default '[]',
  image_url text,
  stock_status text not null default 'In Stock',
  featured boolean not null default false,
  rating numeric not null default 4.5,
  created_date date not null default current_date,
  updated_at timestamptz not null default now(),
  variants jsonb not null default '[]',
  inventory_qty numeric not null default 0,
  seo_title text,
  seo_description text,
  slug text,
  published_at timestamptz,
  unpublished_at timestamptz
);

create table if not exists public.reviews (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_date date not null default current_date
);
create index if not exists reviews_product_id_idx on public.reviews (product_id);

create table if not exists public.settings (
  id integer primary key check (id = 1),
  tagline text not null,
  announcement text not null,
  updated_at timestamptz not null default now()
);

-- New tables for enhanced features
create table if not exists public.carts (
  customer_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  coupon_code text,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_email text,
  items jsonb not null,
  total numeric not null,
  whatsapp_message text,
  status text not null default 'pending',
  created_date date default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percentage','fixed','free_shipping')),
  value numeric not null default 0,
  min_order numeric not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Grants (required — without these PostgREST returns 42501) -------------
grant usage on schema public to anon, authenticated, service_role;
grant all on public.products to anon, authenticated, service_role;
grant all on public.reviews  to anon, authenticated, service_role;
grant all on public.settings to anon, authenticated, service_role;
grant all on public.carts to authenticated, service_role;
grant all on public.orders to authenticated, service_role;
grant all on public.wishlist to authenticated, service_role;
grant all on public.coupons to authenticated, service_role;

-- 3. Row Level Security ----------------------------------------------------
alter table public.products enable row level security;
alter table public.reviews  enable row level security;
alter table public.settings enable row level security;
alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "public read products"   on public.products;
drop policy if exists "admin write products"   on public.products;
drop policy if exists "public read reviews"    on public.reviews;
drop policy if exists "anyone post reviews"    on public.reviews;
drop policy if exists "admin moderate reviews" on public.reviews;
drop policy if exists "public read settings"   on public.settings;
drop policy if exists "admin write settings"   on public.settings;

create policy "public read products" on public.products for select using (true);
create policy "admin write products" on public.products for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "public read reviews" on public.reviews for select using (true);
create policy "anyone post reviews" on public.reviews for insert with check (true);
create policy "admin moderate reviews" on public.reviews for delete
  using (auth.uid() is not null);

create policy "public read settings" on public.settings for select using (true);
create policy "admin write settings" on public.settings for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Cart policies: users can only access their own cart
create policy "users view own cart" on public.carts for select using (auth.uid() = customer_id);
create policy "users upsert own cart" on public.carts for insert with check (auth.uid() = customer_id);
create policy "users update own cart" on public.carts for update using (auth.uid() = customer_id);
create policy "users delete own cart" on public.carts for delete using (auth.uid() = customer_id);

-- Order policies: users can view/create their own orders
create policy "users view own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "users create orders" on public.orders for insert with check (auth.uid() = customer_id or customer_id is null);

-- Wishlist policies: users can manage their own wishlist
create policy "users manage own wishlist" on public.wishlist for all using (auth.uid() = customer_id);

-- Coupon policies: public read for validation, admin write
create policy "public read active coupons" on public.coupons for select using (active = true and (expires_at is null or expires_at > now()));
create policy "admin manage coupons" on public.coupons for all using (auth.uid() is not null);

-- 4. Store settings row ----------------------------------------------------
insert into public.settings (id, tagline, announcement)
values (1, 'Build. Learn. Innovate.',
        'Free delivery in Accra over GH₵ 200 · WhatsApp orders 7am–9pm')
on conflict (id) do nothing;

-- 5. Storage bucket for product photos -------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read images"  on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
drop policy if exists "admin replace images" on storage.objects;
drop policy if exists "admin remove images"  on storage.objects;

create policy "public read images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');
create policy "admin replace images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images');
create policy "admin remove images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');
