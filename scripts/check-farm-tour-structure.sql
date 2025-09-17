-- 檢查 farm_tour 表結構腳本
-- 此腳本用於檢查當前表結構，可在遷移前後執行以確認變更
-- 日期: 2025-09-17

-- 1. 顯示完整的表結構資訊
SELECT
    '=== FARM_TOUR 表結構資訊 ===' as info_section;

SELECT
    column_name as "欄位名稱",
    data_type as "資料型別",
    CASE
        WHEN is_nullable = 'YES' THEN 'NULL'
        ELSE 'NOT NULL'
    END as "是否可空值",
    COALESCE(column_default, '無') as "預設值",
    CASE
        WHEN character_maximum_length IS NOT NULL
        THEN character_maximum_length::text
        WHEN numeric_precision IS NOT NULL
        THEN numeric_precision::text
        ELSE '不限'
    END as "長度/精度"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'farm_tour'
ORDER BY ordinal_position;

-- 2. 檢查約束條件
SELECT
    '=== 約束條件 ===' as constraint_section;

SELECT
    constraint_name as "約束名稱",
    constraint_type as "約束類型",
    CASE constraint_type
        WHEN 'PRIMARY KEY' THEN '主鍵'
        WHEN 'FOREIGN KEY' THEN '外鍵'
        WHEN 'UNIQUE' THEN '唯一'
        WHEN 'CHECK' THEN '檢查'
        ELSE constraint_type
    END as "約束說明"
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'farm_tour'
ORDER BY constraint_type;

-- 3. 顯示檢查約束的詳細定義
SELECT
    '=== 檢查約束詳細定義 ===' as check_constraints_section;

SELECT
    cc.constraint_name as "約束名稱",
    cc.check_clause as "約束條件"
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu
    ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'farm_tour'
ORDER BY cc.constraint_name;

-- 4. 檢查索引資訊
SELECT
    '=== 索引資訊 ===' as index_section;

SELECT
    indexname as "索引名稱",
    indexdef as "索引定義"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'farm_tour'
ORDER BY indexname;

-- 5. 檢查目前的資料狀態
SELECT
    '=== 資料統計 ===' as data_stats_section;

SELECT
    COUNT(*) as "總記錄數",
    COUNT(start_month) as "有 start_month 的記錄",
    COUNT(end_month) as "有 end_month 的記錄",
    COUNT(price) as "有 price 的記錄",
    AVG(price) as "平均價格",
    MIN(start_month) as "最小開始月份",
    MAX(end_month) as "最大結束月份"
FROM farm_tour;

-- 6. 檢查是否有舊欄位殘留
SELECT
    '=== 舊欄位檢查 ===' as legacy_fields_section;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'duration'
        ) THEN '存在' ELSE '不存在'
    END as "duration 欄位",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'season'
        ) THEN '存在' ELSE '不存在'
    END as "season 欄位",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'highlight'
        ) THEN '存在' ELSE '不存在'
    END as "highlight 欄位",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'includes'
        ) THEN '存在' ELSE '不存在'
    END as "includes 欄位",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'months'
        ) THEN '存在' ELSE '不存在'
    END as "months 欄位";

-- 7. 檢查新欄位是否存在
SELECT
    '=== 新欄位檢查 ===' as new_fields_section;

SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'start_month'
        ) THEN '存在' ELSE '不存在'
    END as "start_month 欄位",
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'farm_tour' AND column_name = 'end_month'
        ) THEN '存在' ELSE '不存在'
    END as "end_month 欄位";

-- 8. 遷移狀態總結
SELECT
    '=== 遷移狀態總結 ===' as migration_status_section;

WITH migration_status AS (
    SELECT
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'start_month') as has_start_month,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'end_month') as has_end_month,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'duration') as has_duration,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'season') as has_season,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'highlight') as has_highlight,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'includes') as has_includes,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farm_tour' AND column_name = 'months') as has_months
)
SELECT
    CASE
        WHEN has_start_month AND has_end_month AND NOT has_duration AND NOT has_season AND NOT has_highlight AND NOT has_includes AND NOT has_months
        THEN '✅ 遷移已完成'
        WHEN has_start_month AND has_end_month
        THEN '⚠️ 部分遷移 - 新欄位已新增但舊欄位仍存在'
        WHEN NOT has_start_month OR NOT has_end_month
        THEN '❌ 需要遷移 - 缺少新欄位'
        ELSE '❓ 未知狀態'
    END as "遷移狀態",
    CASE
        WHEN has_start_month AND has_end_month THEN '新欄位: ✅'
        ELSE '新欄位: ❌'
    END as "新欄位狀態",
    CASE
        WHEN NOT has_duration AND NOT has_season AND NOT has_highlight AND NOT has_includes AND NOT has_months THEN '舊欄位清理: ✅'
        ELSE '舊欄位清理: ❌'
    END as "舊欄位清理狀態"
FROM migration_status;