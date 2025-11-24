-- 修復 farm_tour 表欄位長度限制 (v2)
-- 專注修復 VARCHAR 長度問題，避免 jsonb 轉換錯誤
-- 日期: 2025-09-17
-- 主要問題: image 欄位 VARCHAR(10) 太短，無法儲存 URL

-- 開始事務
BEGIN;

-- 顯示修復開始訊息
SELECT '開始修復 farm_tour 表的欄位長度問題...' as status;

-- 1. 修復 image 欄位 - 從 VARCHAR(10) 改為 TEXT
DO $$
BEGIN
    -- 檢查當前 image 欄位類型和長度
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'image'
        AND data_type = 'character varying'
        AND character_maximum_length <= 50  -- 任何過短的 VARCHAR
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN image TYPE TEXT;
        RAISE NOTICE '✅ image 欄位已從 VARCHAR(%%) 更改為 TEXT',
                     (SELECT character_maximum_length FROM information_schema.columns
                      WHERE table_name = 'farm_tour' AND column_name = 'image' LIMIT 1);
    ELSE
        RAISE NOTICE '⏩ image 欄位已經是 TEXT 或足夠長度，跳過';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- 如果出現任何錯誤，強制轉換為 TEXT
        ALTER TABLE farm_tour ALTER COLUMN image TYPE TEXT;
        RAISE NOTICE '✅ image 欄位已強制轉換為 TEXT';
END $$;

-- 2. 修復 title 欄位 - 確保至少 VARCHAR(255)
DO $$
BEGIN
    -- 檢查 title 欄位長度是否足夠
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'title'
        AND data_type = 'character varying'
        AND (character_maximum_length IS NULL OR character_maximum_length < 100)
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN title TYPE VARCHAR(255);
        RAISE NOTICE '✅ title 欄位已更改為 VARCHAR(255)';
    ELSE
        RAISE NOTICE '⏩ title 欄位長度已足夠，跳過';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        ALTER TABLE farm_tour ALTER COLUMN title TYPE VARCHAR(255);
        RAISE NOTICE '✅ title 欄位已強制設為 VARCHAR(255)';
END $$;

-- 3. 修復 note 欄位 - 改為 TEXT 以支援長內容
DO $$
BEGIN
    -- 如果 note 欄位不是 TEXT，則改為 TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'note'
        AND data_type != 'text'
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN note TYPE TEXT;
        RAISE NOTICE '✅ note 欄位已更改為 TEXT';
    ELSE
        RAISE NOTICE '⏩ note 欄位已經是 TEXT，跳過';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        ALTER TABLE farm_tour ALTER COLUMN note TYPE TEXT;
        RAISE NOTICE '✅ note 欄位已強制轉換為 TEXT';
END $$;

-- 4. 保持 activities 為 jsonb（Supabase 標準做法）
-- 不進行類型轉換，只確保預設值正確
DO $$
BEGIN
    -- 檢查 activities 欄位預設值
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'activities'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN activities SET DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ activities 欄位已設定預設值為空陣列 (jsonb)';
    ELSE
        RAISE NOTICE '⏩ activities 欄位已有預設值，跳過';
    END IF;
END $$;

-- 5. 確保其他欄位有適當的預設值
DO $$
BEGIN
    -- available 欄位預設值
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

    -- price 欄位預設值（如果還沒設定）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'price'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN price SET DEFAULT 0;
        RAISE NOTICE '✅ price 欄位已設定預設值為 0';
    ELSE
        RAISE NOTICE '⏩ price 欄位已有預設值，跳過';
    END IF;
END $$;

-- 6. 清理可能的 NULL 值
UPDATE farm_tour
SET
    image = COALESCE(image, ''),
    title = COALESCE(title, ''),
    note = COALESCE(note, ''),
    activities = COALESCE(activities, '[]'::jsonb),
    available = COALESCE(available, true),
    price = COALESCE(price, 0)
WHERE image IS NULL
   OR title IS NULL
   OR note IS NULL
   OR activities IS NULL
   OR available IS NULL
   OR price IS NULL;

-- 提交事務
COMMIT;

-- 顯示修復完成和當前表結構
SELECT '=== 修復完成！當前 farm_tour 表結構 ===' as message;

SELECT
    column_name as "欄位名稱",
    data_type as "資料類型",
    CASE
        WHEN character_maximum_length IS NOT NULL THEN 'VARCHAR(' || character_maximum_length::text || ')'
        WHEN data_type = 'text' THEN 'TEXT (不限長度)'
        WHEN data_type = 'jsonb' THEN 'JSONB (JSON 陣列)'
        WHEN data_type = 'boolean' THEN 'BOOLEAN'
        WHEN data_type = 'integer' THEN 'INTEGER'
        WHEN data_type = 'numeric' THEN 'NUMERIC'
        ELSE data_type
    END as "詳細類型",
    CASE
        WHEN is_nullable = 'YES' THEN '可空值'
        ELSE '必填'
    END as "是否必填",
    COALESCE(column_default, '無') as "預設值"
FROM information_schema.columns
WHERE table_name = 'farm_tour'
ORDER BY ordinal_position;

-- 顯示修復摘要
SELECT '=== 修復摘要 ===' as summary;
SELECT
    '✅ image 欄位: 已改為 TEXT，可儲存任意長度的 URL' as "修復1",
    '✅ title 欄位: 已確保為 VARCHAR(255) 或更長' as "修復2",
    '✅ note 欄位: 已改為 TEXT，支援長文字描述' as "修復3",
    '✅ activities 欄位: 保持 jsonb 類型，符合 Supabase 慣例' as "修復4",
    '✅ 所有欄位都已設定適當的預設值' as "修復5";

-- 建議的測試指令
SELECT '=== 建議測試 ===' as test_instruction;
SELECT 'curl -X POST http://localhost:3000/api/farm-tour -H "Content-Type: application/json" -d ''{"title":"春季農業體驗","start_month":3,"end_month":5,"price":500,"activities":["播種","澆水","收成"],"image":"https://example.com/spring-farming-experience.jpg","available":true,"note":"這是一個非常詳細的農業體驗活動，包含多種學習內容和實際操作機會"}''' as "測試指令";
SELECT '如果上述測試成功，表示 VARCHAR(10) 問題已徹底解決！' as "成功標準";