-- ========================================
-- 修復地點資料表電話欄位長度問題（簡化版）
-- ========================================
-- 🎯 目標：將 phone 欄位從 VARCHAR(10) 擴展到 VARCHAR(20)
-- 📅 建立日期：2025-09-15

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

-- 2. 修改電話欄位長度
ALTER TABLE public.locations
ALTER COLUMN phone TYPE VARCHAR(20);

-- 3. 驗證修改後的欄位狀態
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
    AND table_schema = 'public'
    AND column_name = 'phone';

-- 4. 添加註解說明修復
COMMENT ON COLUMN locations.phone IS '聯絡電話 (最大 20 字元，支援格式：02-12345678, 0912-345678)';

-- 5. 檢查資料完整性
SELECT
    count(*) as total_locations,
    count(phone) as locations_with_phone
FROM locations;

-- 完成訊息
SELECT '✅ 電話欄位長度修復完成！現在支援最多 20 字元的電話號碼。' as status;