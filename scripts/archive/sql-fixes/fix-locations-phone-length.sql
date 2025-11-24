-- ========================================
-- 修復地點資料表電話欄位長度問題
-- ========================================
-- 🎯 目標：將 phone 欄位從 VARCHAR(10) 擴展到 VARCHAR(20)
-- 📅 建立日期：2025-09-15
-- 🔧 修復問題：Database error 22001 - value too long for type character varying(10)

-- 1. 檢查當前 phone 欄位狀態
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
    AND table_schema = 'public'
    AND column_name = 'phone';

-- 2. 檢查現有資料的電話號碼長度分佈
SELECT
    length(phone) as phone_length,
    count(*) as count,
    string_agg(name, ', ' ORDER BY name) as sample_locations
FROM locations
GROUP BY length(phone)
ORDER BY phone_length;

-- 3. 顯示超過 10 字元的電話號碼（如果有的話）
SELECT
    id,
    name,
    phone,
    length(phone) as phone_length
FROM locations
WHERE length(phone) > 10
ORDER BY length(phone) DESC;

-- 4. 修改電話欄位長度
ALTER TABLE public.locations
ALTER COLUMN phone TYPE VARCHAR(20);

-- 5. 驗證修改後的欄位狀態
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
    AND table_schema = 'public'
    AND column_name = 'phone';

-- 6. 添加註解說明修復
COMMENT ON COLUMN locations.phone IS '聯絡電話 (最大 20 字元，支援格式：02-12345678, 0912-345678)';

-- 7. 驗證資料完整性
SELECT
    count(*) as total_locations,
    count(phone) as locations_with_phone,
    min(length(phone)) as min_phone_length,
    max(length(phone)) as max_phone_length,
    avg(length(phone))::numeric(4,2) as avg_phone_length
FROM locations;

-- 8. 檢查是否有無效的電話格式（可選的資料清理）
SELECT
    id,
    name,
    phone,
    CASE
        WHEN phone ~ '^[0-9-+()# ]+$' THEN '有效格式'
        ELSE '可能無效格式'
    END as phone_format_status
FROM locations
WHERE phone IS NOT NULL AND phone != '';

-- 完成訊息
SELECT '✅ 電話欄位長度修復完成！現在支援最多 20 字元的電話號碼。' as status;

-- 使用說明：
-- 1. 在 Supabase SQL Editor 中執行此腳本
-- 2. 檢查執行結果，確認沒有錯誤
-- 3. 驗證現有資料完整性
-- 4. 測試新增地點功能是否正常

-- 注意事項：
-- - 此操作是安全的，只是擴展欄位長度，不會影響現有資料
-- - VARCHAR(20) 足以容納各種台灣電話號碼格式
-- - 如果需要更嚴格的驗證，可以在應用層實施