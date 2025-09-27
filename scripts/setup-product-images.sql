-- ========================================
-- 產品圖片系統資料庫設定
-- ========================================
-- 用途：建立 product_images 表及相關索引
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行
-- ========================================

-- 1. 建立 product_images 表
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) NOT NULL DEFAULT 'medium',
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 外鍵約束
  CONSTRAINT fk_product_images_product_id
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  -- 唯一約束：同一產品的圖片位置不能重複
  CONSTRAINT uq_product_images_position
    UNIQUE(product_id, position)
);

-- 2. 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_product_images_position
  ON product_images(product_id, position);

CREATE INDEX IF NOT EXISTS idx_product_images_url
  ON product_images(url);

-- 3. 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_images_updated_at ON product_images;

CREATE TRIGGER trigger_update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 啟用 Row Level Security (RLS)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 5. 建立 RLS 政策

-- 允許所有人查看產品圖片（公開讀取）
CREATE POLICY "產品圖片公開可讀取"
  ON product_images
  FOR SELECT
  USING (true);

-- 只有管理員可以新增圖片
CREATE POLICY "管理員可新增產品圖片"
  ON product_images
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 只有管理員可以更新圖片
CREATE POLICY "管理員可更新產品圖片"
  ON product_images
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 只有管理員可以刪除圖片
CREATE POLICY "管理員可刪除產品圖片"
  ON product_images
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 6. 驗證表創建
DO $$
BEGIN
  RAISE NOTICE '✅ product_images 表創建成功！';
  RAISE NOTICE '📋 表結構說明:';
  RAISE NOTICE '  - id: 圖片唯一 ID (UUID)';
  RAISE NOTICE '  - product_id: 關聯的產品 ID';
  RAISE NOTICE '  - url: 圖片公開 URL';
  RAISE NOTICE '  - path: 存儲路徑';
  RAISE NOTICE '  - alt: 替代文字';
  RAISE NOTICE '  - position: 排序位置 (0 = 主圖)';
  RAISE NOTICE '  - size: 圖片尺寸 (thumbnail/medium/large)';
  RAISE NOTICE '  - width/height: 圖片尺寸 (像素)';
  RAISE NOTICE '  - file_size: 檔案大小 (bytes)';
  RAISE NOTICE '  - created_at/updated_at: 創建/更新時間';
  RAISE NOTICE '🔒 RLS 政策已啟用：公開讀取，管理員寫入';
END $$;