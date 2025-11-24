-- 修復 farm_tour 表欄位長度限制
-- 主要修復 image 欄位的 VARCHAR(10) 限制問題
-- 日期: 2025-09-17
-- 問題: image 欄位只有 10 字元長度，無法儲存正常的圖片 URL

-- 開始事務
BEGIN;

-- 顯示修復開始訊息
SELECT 'Starting farm_tour table column length fixes...' as status;

-- 1. 修復 image 欄位 - 從 VARCHAR(10) 改為 TEXT
DO $$
BEGIN
    -- 檢查當前 image 欄位類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'image'
        AND (data_type = 'character varying' AND character_maximum_length = 10)
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN image TYPE TEXT;
        RAISE NOTICE '✅ image 欄位已從 VARCHAR(10) 更改為 TEXT';
    ELSE
        RAISE NOTICE '⏩ image 欄位已經是正確的類型，跳過';
    END IF;
END $$;

-- 2. 檢查並修復 title 欄位 - 確保足夠長度
DO $$
BEGIN
    -- 檢查 title 欄位是否有長度限制過短的問題
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'title'
        AND data_type = 'character varying'
        AND character_maximum_length < 100
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN title TYPE VARCHAR(255);
        RAISE NOTICE '✅ title 欄位已更改為 VARCHAR(255)';
    ELSE
        RAISE NOTICE '⏩ title 欄位長度足夠，跳過';
    END IF;
END $$;

-- 3. 檢查並修復 note 欄位 - 確保足夠長度
DO $$
BEGIN
    -- 檢查 note 欄位是否有長度限制
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'note'
        AND data_type = 'character varying'
        AND character_maximum_length IS NOT NULL
        AND character_maximum_length < 500
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN note TYPE TEXT;
        RAISE NOTICE '✅ note 欄位已更改為 TEXT';
    ELSE
        RAISE NOTICE '⏩ note 欄位類型正確，跳過';
    END IF;
END $$;

-- 4. 檢查 activities 欄位是否正確設定為陣列類型
DO $$
BEGIN
    -- 確認 activities 欄位是文字陣列類型
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'activities'
        AND data_type = 'ARRAY'
    ) THEN
        -- 如果不是陣列類型，嘗試轉換
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour'
            AND column_name = 'activities'
        ) THEN
            ALTER TABLE farm_tour ALTER COLUMN activities TYPE TEXT[] USING activities::TEXT[];
            RAISE NOTICE '✅ activities 欄位已轉換為 TEXT[] 陣列類型';
        ELSE
            ALTER TABLE farm_tour ADD COLUMN activities TEXT[] DEFAULT '{}';
            RAISE NOTICE '✅ activities 欄位已新增為 TEXT[] 陣列類型';
        END IF;
    ELSE
        RAISE NOTICE '⏩ activities 欄位已經是陣列類型，跳過';
    END IF;
END $$;

-- 5. 確保 available 欄位是布林類型
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'available'
        AND data_type = 'boolean'
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN available TYPE BOOLEAN USING available::BOOLEAN;
        RAISE NOTICE '✅ available 欄位已轉換為 BOOLEAN 類型';
    ELSE
        RAISE NOTICE '⏩ available 欄位已經是 BOOLEAN 類型，跳過';
    END IF;
END $$;

-- 6. 設定預設值
DO $$
BEGIN
    -- 為 activities 設定預設值（如果沒有）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'activities'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN activities SET DEFAULT '{}';
        RAISE NOTICE '✅ activities 欄位已設定預設值為空陣列';
    ELSE
        RAISE NOTICE '⏩ activities 欄位已有預設值，跳過';
    END IF;

    -- 為 available 設定預設值（如果沒有）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'available'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN available SET DEFAULT true;
        RAISE NOTICE '✅ available 欄位已設定預設值為 true';
    ELSE
        RAISE NOTICE '⏩ available 欄位已有預設值，跳過';
    END IF;
END $$;

-- 7. 更新現有資料中的 NULL 值
UPDATE farm_tour
SET
    activities = COALESCE(activities, '{}'),
    available = COALESCE(available, true),
    note = COALESCE(note, ''),
    image = COALESCE(image, '')
WHERE activities IS NULL
   OR available IS NULL
   OR note IS NULL
   OR image IS NULL;

-- 提交事務
COMMIT;

-- 顯示修復完成和當前表結構
SELECT '=== 修復完成！當前 farm_tour 表結構 ===' as message;

SELECT
    column_name as "欄位名稱",
    data_type as "資料類型",
    CASE
        WHEN character_maximum_length IS NOT NULL THEN character_maximum_length::text
        WHEN numeric_precision IS NOT NULL THEN numeric_precision::text
        ELSE '不限'
    END as "長度限制",
    CASE
        WHEN is_nullable = 'YES' THEN 'NULL'
        ELSE 'NOT NULL'
    END as "可空值",
    COALESCE(column_default, '無') as "預設值"
FROM information_schema.columns
WHERE table_name = 'farm_tour'
ORDER BY ordinal_position;

-- 測試建議
SELECT '=== 建議測試步驟 ===' as test_steps;
SELECT 'curl -X POST http://localhost:3000/api/farm-tour -H "Content-Type: application/json" -d ''{"title":"測試活動","start_month":3,"end_month":5,"price":500,"activities":["播種","收成"],"image":"https://example.com/test.jpg","available":true,"note":"這是一個測試活動"}''' as "建議的 curl 測試指令";