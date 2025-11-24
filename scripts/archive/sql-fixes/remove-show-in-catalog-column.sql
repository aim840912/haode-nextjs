-- Migration: Remove show_in_catalog column from products table
-- Purpose: 移除產品頁面顯示控制欄位，所有產品將預設顯示在產品頁面
-- Date: 2025-09-17

-- 檢查欄位是否存在
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'show_in_catalog';

-- 備份現有資料（可選，作為安全措施）
-- CREATE TABLE products_backup_show_in_catalog AS
-- SELECT id, show_in_catalog FROM products WHERE show_in_catalog = false;

-- 移除 show_in_catalog 欄位
ALTER TABLE products DROP COLUMN IF EXISTS show_in_catalog;

-- 驗證欄位已被移除
SELECT
    column_name
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'show_in_catalog';

-- 如果上述查詢沒有返回任何結果，表示欄位已成功移除

-- 顯示目前 products 表格結構
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 注意事項：
-- 1. 執行此 migration 後，所有產品將預設顯示在產品頁面
-- 2. 現有的隱藏產品將變為顯示狀態
-- 3. 如果需要恢復資料，可以從 products_backup_show_in_catalog 表格中恢復
-- 4. 建議在執行前先備份整個 products 表格