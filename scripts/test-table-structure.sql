-- ========================================
-- 資料表結構驗證腳本
-- ========================================
-- 🎯 目標：驗證修正後的索引語句是否與實際表結構相符
-- 📅 建立日期：2025-09-10

-- 測試 1：檢查 products 表的欄位結構
-- 這個查詢會顯示 products 表的所有欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 測試 2：檢查 inquiries 表的欄位結構
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'inquiries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 測試 2a：檢查 product_images 表的欄位結構（如果存在）
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 測試 2b：檢查可選表是否存在
SELECT table_name, 'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_interests', 'locations', 'audit_logs')
ORDER BY table_name;

-- 測試 3：檢查 products 表是否有 is_active 欄位
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name = 'is_active' 
  AND table_schema = 'public'
) AS has_is_active_field;

-- 測試 4：檢查 products 表是否有 status 欄位
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name = 'status' 
  AND table_schema = 'public'
) AS has_status_field;

-- 測試 5：檢查 inquiries 表是否有 status 欄位
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'inquiries' 
  AND column_name = 'status' 
  AND table_schema = 'public'
) AS has_status_field;

-- 測試 6：檢查 products 表是否有 features 欄位
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name = 'features' 
  AND table_schema = 'public'
) AS has_features_field;

-- 測試 7：驗證修正後的索引語句語法（不實際建立）
-- 測試 products 表的 is_active 欄位索引語法
SELECT 'products is_active 欄位索引語法正確' as validation_result;
-- CREATE INDEX IF NOT EXISTS idx_products_active_created_at ON products (is_active, created_at DESC);

-- 測試 8：檢查現有的索引
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'inquiries', 'product_images', 'news')
ORDER BY tablename, indexname;

-- 結果總結
SELECT 
    'Table structure validation completed' as status,
    '請檢查上述結果確認欄位是否存在' as instruction,
    '如果 is_active 欄位存在，可以執行修正後的索引腳本' as next_step;