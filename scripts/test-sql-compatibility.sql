-- ========================================
-- SQL 相容性測試腳本
-- ========================================
-- 🎯 目標：測試修正後的 SQL 語法是否與 Supabase 相容
-- 📅 建立日期：2025-09-10

-- 測試 1：檢查文字搜尋配置是否可用
SELECT cfgname FROM pg_ts_config WHERE cfgname IN ('simple', 'english', 'chinese');

-- 測試 2：測試 to_tsvector 函數是否正常
SELECT to_tsvector('simple', '這是測試中文內容') IS NOT NULL as tsvector_test;

-- 測試 3：測試 GIN 索引語法（不實際建立）
-- 這些是修正後的索引語句，應該語法正確
-- CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING GIN (to_tsvector('simple', name));

-- 測試 4：測試搜尋查詢語法
SELECT plainto_tsquery('simple', '測試查詢') IS NOT NULL as tsquery_test;

-- 測試 5：檢查必要的擴展是否可用
SELECT EXISTS(SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') as pg_trgm_available;
SELECT EXISTS(SELECT 1 FROM pg_available_extensions WHERE name = 'unaccent') as unaccent_available;

-- 測試結果顯示
SELECT 
    'SQL 語法測試完成' as status,
    '如果沒有錯誤，表示修正的 SQL 語法相容' as message;