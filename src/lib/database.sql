-- 用戶資料表（擴展 Supabase Auth）
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  phone text,
  address jsonb,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 產品資料表
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text,
  description text,
  category text not null check (category in ('fruits', 'coffee', 'vegetables', 'tea')),
  price decimal(10,2) not null,
  images text[] default '{}',
  inventory integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 購物車資料表
create table if not exists carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 購物車商品資料表
create table if not exists cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references carts on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  quantity integer not null check (quantity > 0),
  price decimal(10,2) not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, product_id)
);

-- 訂單資料表
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text check (payment_method in ('stripe', 'ecpay', 'linepay', 'cash')),
  shipping_address jsonb not null,
  total_amount decimal(10,2) not null,
  shipping_fee decimal(10,2) default 0,
  final_amount decimal(10,2) not null,
  notes text,
  tracking_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 訂單商品資料表
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  quantity integer not null check (quantity > 0),
  price decimal(10,2) not null,
  product_snapshot jsonb -- 儲存下單時的產品資訊快照
);

-- 支付記錄資料表
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  payment_intent_id text unique not null,
  amount decimal(10,2) not null,
  currency text default 'TWD',
  method text not null check (method in ('stripe', 'ecpay', 'linepay')),
  status text default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled')),
  transaction_id text,
  failure_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 觸發器：更新 updated_at 欄位
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_products_updated_at before update on products
  for each row execute procedure update_updated_at_column();

create trigger update_carts_updated_at before update on carts
  for each row execute procedure update_updated_at_column();

create trigger update_orders_updated_at before update on orders
  for each row execute procedure update_updated_at_column();

create trigger update_payments_updated_at before update on payments
  for each row execute procedure update_updated_at_column();

-- 建立索引
create index idx_profiles_email on profiles(email);
create index idx_products_category on products(category);
create index idx_products_is_active on products(is_active);
create index idx_cart_items_cart_id on cart_items(cart_id);
create index idx_orders_user_id on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_order_items_order_id on order_items(order_id);
create index idx_payments_order_id on payments(order_id);

-- Row Level Security (RLS) 政策
alter table profiles enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

-- 用戶只能存取自己的資料
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own cart" on carts for select using (auth.uid() = user_id);
create policy "Users can update own cart" on carts for update using (auth.uid() = user_id);

create policy "Users can view own cart items" on cart_items 
  for select using (auth.uid() = (select user_id from carts where carts.id = cart_id));

create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);

-- 產品為公開資料
create policy "Anyone can view products" on products for select using (is_active = true);