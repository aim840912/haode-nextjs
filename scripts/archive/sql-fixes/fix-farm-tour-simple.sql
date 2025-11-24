-- farm_tour 表欄位修復 - 簡化版
-- 專注解決 VARCHAR(10) 長度限制問題
-- 日期: 2025-09-17

-- 開始事務
BEGIN;

-- 1. 修復 image 欄位長度限制
ALTER TABLE farm_tour ALTER COLUMN image TYPE TEXT;

-- 2. 確保 title 欄位足夠長度
ALTER TABLE farm_tour ALTER COLUMN title TYPE VARCHAR(255);

-- 3. 修復 note 欄位為 TEXT
ALTER TABLE farm_tour ALTER COLUMN note TYPE TEXT;

-- 4. 設定預設值
ALTER TABLE farm_tour ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE farm_tour ALTER COLUMN available SET DEFAULT true;
ALTER TABLE farm_tour ALTER COLUMN activities SET DEFAULT '[]'::jsonb;

-- 5. 清理 NULL 值
UPDATE farm_tour
SET
    image = COALESCE(image, ''),
    title = COALESCE(title, ''),
    note = COALESCE(note, ''),
    price = COALESCE(price, 0),
    available = COALESCE(available, true),
    activities = COALESCE(activities, '[]'::jsonb)
WHERE image IS NULL
   OR title IS NULL
   OR note IS NULL
   OR price IS NULL
   OR available IS NULL
   OR activities IS NULL;

-- 提交事務
COMMIT;

-- 顯示完成訊息
SELECT 'farm_tour 表欄位修復完成！' as status;