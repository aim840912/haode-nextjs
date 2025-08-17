-- 最小化 Supabase 表格初始化
-- 只建立測試需要的表格

-- 建立測試表格
CREATE TABLE test_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立基本產品表格
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE test_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 寬鬆的 RLS 政策（測試用）
CREATE POLICY "Allow all operations on test_data" ON test_data FOR ALL USING (true);
CREATE POLICY "Allow read products" ON products FOR SELECT USING (true);

-- 插入測試資料
INSERT INTO test_data (name, description) VALUES 
    ('測試資料', 'Supabase 連線測試成功');

INSERT INTO products (name, description, price) VALUES 
    ('測試產品', '這是一個測試產品', 99.99);