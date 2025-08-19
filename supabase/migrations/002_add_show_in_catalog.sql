-- Add show_in_catalog column to products table
ALTER TABLE products ADD COLUMN show_in_catalog BOOLEAN DEFAULT true NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN products.show_in_catalog IS '是否顯示在前台產品頁面';