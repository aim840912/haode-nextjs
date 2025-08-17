-- 初始化 Supabase 資料庫表格
-- 執行方式：複製內容到 Supabase SQL Editor 執行

-- 建立 profiles 表格（用戶資料）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立 products 表格（產品資料）
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '',
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立 orders 表格（訂單）
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立 order_items 表格（訂單項目）
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立 test_data 表格（測試用）
CREATE TABLE IF NOT EXISTS test_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_data ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策

-- profiles: 用戶只能看到和編輯自己的資料
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- products: 所有人都可以查看產品，只有管理員可以修改
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (is_active = true);

-- orders: 用戶只能看到自己的訂單
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- order_items: 通過 order 關聯檢查權限
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- test_data: 允許所有人讀寫（測試用）
CREATE POLICY "Anyone can manage test_data" ON test_data
    FOR ALL USING (true);

-- 插入一些測試資料
INSERT INTO products (name, description, price, category, image_url) VALUES
    ('測試產品 1', '這是一個測試產品', 99.99, 'electronics', 'https://via.placeholder.com/300'),
    ('測試產品 2', '另一個測試產品', 149.99, 'clothing', 'https://via.placeholder.com/300'),
    ('測試產品 3', '第三個測試產品', 79.99, 'home', 'https://via.placeholder.com/300')
ON CONFLICT DO NOTHING;

-- 插入測試資料用於驗證連線
INSERT INTO test_data (name, description) VALUES
    ('初始化測試', 'Supabase 資料庫初始化成功')
ON CONFLICT DO NOTHING;