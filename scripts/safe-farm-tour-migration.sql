-- 安全的農場體驗表結構更新腳本
-- 此腳本使用條件檢查，確保冪等性（可以重複執行）
-- 日期: 2025-09-17
-- 目的: 將 farm_tour 表從舊版結構遷移到新版結構

-- 開始事務
BEGIN;

-- 1. 新增新欄位（如果不存在）
DO $$
BEGIN
    -- 新增 start_month 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'start_month'
    ) THEN
        ALTER TABLE farm_tour ADD COLUMN start_month INTEGER;
        RAISE NOTICE '已新增 start_month 欄位';
    ELSE
        RAISE NOTICE 'start_month 欄位已存在，跳過';
    END IF;

    -- 新增 end_month 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'end_month'
    ) THEN
        ALTER TABLE farm_tour ADD COLUMN end_month INTEGER;
        RAISE NOTICE '已新增 end_month 欄位';
    ELSE
        RAISE NOTICE 'end_month 欄位已存在，跳過';
    END IF;
END $$;

-- 2. 修改 price 欄位為 nullable（如果需要）
DO $$
BEGIN
    -- 檢查 price 欄位是否為 NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'price'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN price DROP NOT NULL;
        RAISE NOTICE '已將 price 欄位設為 nullable';
    ELSE
        RAISE NOTICE 'price 欄位已為 nullable，跳過';
    END IF;
END $$;

-- 3. 設定 price 欄位的預設值
DO $$
BEGIN
    -- 檢查 price 欄位是否已有預設值
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour'
        AND column_name = 'price'
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE farm_tour ALTER COLUMN price SET DEFAULT 0;
        RAISE NOTICE '已設定 price 預設值為 0';
    ELSE
        RAISE NOTICE 'price 欄位已有預設值，跳過';
    END IF;
END $$;

-- 4. 刪除舊欄位（如果存在）
DO $$
BEGIN
    -- 刪除 duration 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'duration'
    ) THEN
        ALTER TABLE farm_tour DROP COLUMN duration;
        RAISE NOTICE '已刪除 duration 欄位';
    ELSE
        RAISE NOTICE 'duration 欄位不存在，跳過';
    END IF;

    -- 刪除 season 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'season'
    ) THEN
        ALTER TABLE farm_tour DROP COLUMN season;
        RAISE NOTICE '已刪除 season 欄位';
    ELSE
        RAISE NOTICE 'season 欄位不存在，跳過';
    END IF;

    -- 刪除 highlight 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'highlight'
    ) THEN
        ALTER TABLE farm_tour DROP COLUMN highlight;
        RAISE NOTICE '已刪除 highlight 欄位';
    ELSE
        RAISE NOTICE 'highlight 欄位不存在，跳過';
    END IF;

    -- 刪除 includes 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'includes'
    ) THEN
        ALTER TABLE farm_tour DROP COLUMN includes;
        RAISE NOTICE '已刪除 includes 欄位';
    ELSE
        RAISE NOTICE 'includes 欄位不存在，跳過';
    END IF;

    -- 刪除 months 欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'farm_tour' AND column_name = 'months'
    ) THEN
        ALTER TABLE farm_tour DROP COLUMN months;
        RAISE NOTICE '已刪除 months 欄位';
    ELSE
        RAISE NOTICE 'months 欄位不存在，跳過';
    END IF;
END $$;

-- 5. 新增約束條件（如果不存在）
DO $$
BEGIN
    -- 檢查 start_month 約束是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'farm_tour_start_month_check'
    ) THEN
        ALTER TABLE farm_tour ADD CONSTRAINT farm_tour_start_month_check
        CHECK (start_month >= 1 AND start_month <= 12);
        RAISE NOTICE '已新增 start_month 約束條件';
    ELSE
        RAISE NOTICE 'start_month 約束條件已存在，跳過';
    END IF;

    -- 檢查 end_month 約束是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'farm_tour_end_month_check'
    ) THEN
        ALTER TABLE farm_tour ADD CONSTRAINT farm_tour_end_month_check
        CHECK (end_month >= 1 AND end_month <= 12);
        RAISE NOTICE '已新增 end_month 約束條件';
    ELSE
        RAISE NOTICE 'end_month 約束條件已存在，跳過';
    END IF;
END $$;

-- 6. 更新現有資料（如果有 NULL 值）
UPDATE farm_tour
SET
    start_month = COALESCE(start_month, 1),
    end_month = COALESCE(end_month, 12),
    price = COALESCE(price, 0)
WHERE start_month IS NULL OR end_month IS NULL OR price IS NULL;

-- 提交事務
COMMIT;

-- 顯示最終結果
SELECT
    'Migration completed successfully. Current farm_tour table structure:' as message;

-- 顯示當前表結構
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'farm_tour'
ORDER BY ordinal_position;