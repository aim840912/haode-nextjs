-- Farm Tour 表結構更新 Migration
-- 移除不需要的欄位並調整月份和價格欄位
-- 執行時間：2025-09-17

-- 開始事務
BEGIN;

-- 移除不需要的欄位
ALTER TABLE farm_tour
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS season,
  DROP COLUMN IF EXISTS highlight,
  DROP COLUMN IF EXISTS includes;

-- 修改 months 為兩個數字欄位
ALTER TABLE farm_tour
  DROP COLUMN IF EXISTS months,
  ADD COLUMN start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  ADD COLUMN end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12);

-- 修改 price 欄位為可為空，預設值 0
ALTER TABLE farm_tour
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN price DROP NOT NULL;

-- 為現有資料設定預設值（如果有的話）
UPDATE farm_tour
SET
  start_month = 1,
  end_month = 12,
  price = COALESCE(price, 0)
WHERE start_month IS NULL OR end_month IS NULL;

-- 添加註解
COMMENT ON COLUMN farm_tour.start_month IS '活動開始月份 (1-12)';
COMMENT ON COLUMN farm_tour.end_month IS '活動結束月份 (1-12)';
COMMENT ON COLUMN farm_tour.price IS '活動價格（選填，預設 0）';

-- 提交事務
COMMIT;

-- 驗證表結構
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'farm_tour'
ORDER BY ordinal_position;