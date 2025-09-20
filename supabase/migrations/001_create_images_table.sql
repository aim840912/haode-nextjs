-- 圖片管理系統統一重構 - 建立 images 表
-- 此表將統一管理所有模組的圖片資料

-- 建立圖片資訊表
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module VARCHAR(50) NOT NULL,  -- 模組名稱：products, news, locations, farm-tour, moments
  entity_id VARCHAR(100) NOT NULL,  -- 關聯的實體 ID (產品ID、新聞ID等)
  file_path TEXT NOT NULL,  -- Storage 中的完整路徑
  storage_url TEXT NOT NULL,  -- 公開存取 URL
  size VARCHAR(20) NOT NULL DEFAULT 'medium',  -- 圖片尺寸：thumbnail, medium, large
  display_position INT DEFAULT 0,  -- 排序位置（用於多圖排序）
  alt_text TEXT,  -- 替代文字（無障礙支援）
  metadata JSONB,  -- 額外資料：原始檔名、檔案大小、MIME 類型等
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_images_module_entity ON images(module, entity_id);
CREATE INDEX IF NOT EXISTS idx_images_display_position ON images(display_position);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

-- 建立唯一索引確保同一模組同一實體的相同路徑不重複
CREATE UNIQUE INDEX IF NOT EXISTS idx_images_unique_path ON images(module, entity_id, file_path);

-- 建立複合索引以支援常見查詢模式
CREATE INDEX IF NOT EXISTS idx_images_module_entity_position ON images(module, entity_id, display_position);

-- 啟用 Row Level Security (RLS)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 公開讀取政策（所有人都可以讀取圖片資訊）
CREATE POLICY "Public read" ON images
  FOR SELECT USING (true);

-- 認證用戶可新增圖片
CREATE POLICY "Authenticated insert" ON images
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- 認證用戶可更新圖片（建議後續可加入更嚴格的權限控制）
CREATE POLICY "Authenticated update" ON images
  FOR UPDATE USING (
    auth.role() = 'authenticated'
  );

-- 認證用戶可刪除圖片（建議後續可加入更嚴格的權限控制）
CREATE POLICY "Authenticated delete" ON images
  FOR DELETE USING (
    auth.role() = 'authenticated'
  );

-- 建立觸發器自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 建立用於統計和分析的視圖
CREATE OR REPLACE VIEW images_stats AS
SELECT
  module,
  COUNT(*) as total_images,
  COUNT(DISTINCT entity_id) as total_entities,
  SUM(CASE WHEN size = 'thumbnail' THEN 1 ELSE 0 END) as thumbnail_count,
  SUM(CASE WHEN size = 'medium' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN size = 'large' THEN 1 ELSE 0 END) as large_count,
  AVG((metadata->>'file_size')::numeric) as avg_file_size,
  MIN(created_at) as first_upload,
  MAX(created_at) as last_upload
FROM images
GROUP BY module;

-- 建立清理孤兒圖片的函數（移除沒有對應實體的圖片）
CREATE OR REPLACE FUNCTION cleanup_orphan_images(target_module text)
RETURNS TABLE(deleted_count integer) AS $$
DECLARE
  result integer;
BEGIN
  -- 這個函數需要根據各模組的實際表名進行客製化
  -- 目前先建立架構，實際清理邏輯需要後續實作

  CASE target_module
    WHEN 'products' THEN
      -- 假設產品表名為 products
      DELETE FROM images
      WHERE module = 'products'
      AND entity_id NOT IN (SELECT id::text FROM products);

    WHEN 'news' THEN
      -- 假設新聞表名為 news
      DELETE FROM images
      WHERE module = 'news'
      AND entity_id NOT IN (SELECT id::text FROM news);

    -- 其他模組可以後續新增
    ELSE
      RAISE EXCEPTION 'Unsupported module: %', target_module;
  END CASE;

  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN QUERY SELECT result;
END;
$$ LANGUAGE plpgsql;

-- 建立用於查詢實體圖片的便利函數
CREATE OR REPLACE FUNCTION get_entity_images(p_module text, p_entity_id text)
RETURNS TABLE(
  id uuid,
  file_path text,
  storage_url text,
  size varchar(20),
  display_position int,
  alt_text text,
  metadata jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.file_path,
    i.storage_url,
    i.size,
    i.display_position,
    i.alt_text,
    i.metadata,
    i.created_at
  FROM images i
  WHERE i.module = p_module
  AND i.entity_id = p_entity_id
  ORDER BY i.display_position ASC, i.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 建立用於批量更新位置的函數
CREATE OR REPLACE FUNCTION update_image_positions(image_positions jsonb)
RETURNS void AS $$
DECLARE
  image_item jsonb;
BEGIN
  FOR image_item IN SELECT * FROM jsonb_array_elements(image_positions)
  LOOP
    UPDATE images
    SET
      display_position = (image_item->>'position')::int,
      updated_at = NOW()
    WHERE id = (image_item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 在表格建立完成後新增註解
COMMENT ON TABLE images IS '統一圖片管理表：儲存所有模組的圖片資訊';
COMMENT ON COLUMN images.module IS '模組名稱：products, news, locations, farm-tour, moments';
COMMENT ON COLUMN images.entity_id IS '關聯實體的 ID';
COMMENT ON COLUMN images.file_path IS 'Supabase Storage 中的完整檔案路徑';
COMMENT ON COLUMN images.storage_url IS '圖片的公開存取 URL';
COMMENT ON COLUMN images.size IS '圖片尺寸標識：thumbnail, medium, large';
COMMENT ON COLUMN images.display_position IS '排序位置，數字越小越前面';
COMMENT ON COLUMN images.alt_text IS '替代文字，用於無障礙支援';
COMMENT ON COLUMN images.metadata IS '額外資料：檔案大小、原始檔名、MIME 類型等';