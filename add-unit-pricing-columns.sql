-- 新增價格單位欄位到 products 表
-- 支援單位價格功能（如：NT$ 150 / 斤）

-- 新增價格單位欄位
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20),
ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC DEFAULT 1;

-- 新增註解說明
COMMENT ON COLUMN products.price_unit IS '價格單位（如：斤、包、箱等）';
COMMENT ON COLUMN products.unit_quantity IS '單位數量，預設為 1';

-- 為現有產品設定預設值（可選）
-- UPDATE products SET unit_quantity = 1 WHERE unit_quantity IS NULL;