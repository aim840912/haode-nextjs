-- 更新 products 表格，添加缺少的欄位
-- 在 Supabase SQL Editor 執行

-- 添加 emoji 欄位（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'emoji'
    ) THEN
        ALTER TABLE products ADD COLUMN emoji TEXT DEFAULT '';
    END IF;
END $$;

-- 添加 stock 欄位（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'stock'
    ) THEN
        ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
    END IF;
END $$;

-- 確保欄位類型正確
ALTER TABLE products 
    ALTER COLUMN price TYPE DECIMAL(10,2),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);

COMMENT ON TABLE products IS '產品資料表';
COMMENT ON COLUMN products.emoji IS '產品表情符號';
COMMENT ON COLUMN products.stock IS '庫存數量';
COMMENT ON COLUMN products.is_active IS '是否啟用';
COMMENT ON COLUMN products.category IS '產品分類';
COMMENT ON COLUMN products.price IS '產品價格';
COMMENT ON COLUMN products.image_url IS '產品圖片 URL';