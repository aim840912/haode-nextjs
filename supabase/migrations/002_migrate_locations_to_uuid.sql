-- ========================================
-- 遷移 locations 表 ID 從 BIGSERIAL 改為 UUID
-- ========================================
-- 🎯 目標：統一所有模組使用 UUID 作為主鍵，解決類型不一致問題
-- 📅 建立日期：2025-09-22
-- ⚠️  警告：此遷移會更改主鍵類型，執行前請備份資料

-- 開始事務
BEGIN;

-- 1. 創建新的 UUID 欄位
ALTER TABLE locations ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();

-- 2. 為現有記錄生成 UUID
UPDATE locations SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;

-- 3. 設置 UUID 欄位為 NOT NULL
ALTER TABLE locations ALTER COLUMN id_uuid SET NOT NULL;

-- 4. 儲存舊 ID 到新 UUID 的映射（用於後續可能的資料恢復）
CREATE TABLE IF NOT EXISTS location_id_mapping (
    old_id BIGINT,
    new_uuid UUID,
    migrated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO location_id_mapping (old_id, new_uuid)
SELECT id, id_uuid FROM locations;

-- 5. 移除舊的主鍵約束
ALTER TABLE locations DROP CONSTRAINT locations_pkey;

-- 6. 移除舊的 ID 欄位
ALTER TABLE locations DROP COLUMN id;

-- 7. 重新命名 UUID 欄位為 id
ALTER TABLE locations RENAME COLUMN id_uuid TO id;

-- 8. 設定新的主鍵
ALTER TABLE locations ADD CONSTRAINT locations_pkey PRIMARY KEY (id);

-- 9. 重建相關索引（如果有的話）
-- 檢查是否有引用舊 ID 的外鍵約束，需要手動處理
-- 目前根據程式碼檢查，locations 表沒有被其他表引用作為外鍵

-- 10. 更新相關的資料庫函數（如果有的話）
-- 更新 cleanup_orphan_images 函數以支持 locations
DROP FUNCTION IF EXISTS cleanup_orphan_images(text);
CREATE OR REPLACE FUNCTION cleanup_orphan_images(target_module text)
RETURNS TABLE(deleted_count integer) AS $$
DECLARE
  result integer;
BEGIN
  CASE target_module
    WHEN 'products' THEN
      DELETE FROM images
      WHERE module = 'products'
      AND entity_id NOT IN (SELECT id::text FROM products);

    WHEN 'news' THEN
      DELETE FROM images
      WHERE module = 'news'
      AND entity_id NOT IN (SELECT id::text FROM news);

    WHEN 'locations' THEN
      -- 新增 locations 支援
      DELETE FROM images
      WHERE module = 'locations'
      AND entity_id NOT IN (SELECT id::text FROM locations);

    WHEN 'farm-tour' THEN
      -- 新增 farm-tour 支援
      DELETE FROM images
      WHERE module = 'farm-tour'
      AND entity_id NOT IN (SELECT id::text FROM farm_tour);

    WHEN 'moments' THEN
      -- 新增 moments 支援
      DELETE FROM images
      WHERE module = 'moments'
      AND entity_id NOT IN (SELECT id::text FROM moments);

    ELSE
      RAISE EXCEPTION 'Unsupported module: %', target_module;
  END CASE;

  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN QUERY SELECT result;
END;
$$ LANGUAGE plpgsql;

-- 11. 建立新的 UUID 預設值觸發器
-- UUID 欄位已經有 DEFAULT gen_random_uuid()，所以新記錄會自動生成 UUID

-- 12. 更新相關註解
COMMENT ON COLUMN locations.id IS '地點唯一識別碼 (UUID)';

-- 13. 驗證遷移結果
DO $$
DECLARE
    loc_count INTEGER;
    mapping_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO loc_count FROM locations;
    SELECT COUNT(*) INTO mapping_count FROM location_id_mapping;

    RAISE NOTICE '遷移完成：locations 表有 % 筆記錄', loc_count;
    RAISE NOTICE 'ID 映射表有 % 筆記錄', mapping_count;

    IF loc_count != mapping_count THEN
        RAISE EXCEPTION '資料不一致：locations 表和映射表的記錄數不符';
    END IF;
END
$$;

-- 提交事務
COMMIT;

-- 顯示遷移結果
SELECT
    'locations ID 遷移完成 - 從 BIGSERIAL 改為 UUID' as status,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM locations;

-- 顯示新的表結構
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'locations'
AND table_schema = 'public'
AND column_name = 'id'
ORDER BY ordinal_position;

-- 建議：執行遷移後檢查事項
-- 1. 檢查應用程式中所有使用 location ID 的地方
-- 2. 更新 TypeScript 類型定義
-- 3. 更新前端程式碼以處理 UUID 格式的 ID
-- 4. 測試所有 location 相關的 CRUD 操作
-- 5. 在確認所有功能正常後，可考慮刪除 location_id_mapping 表