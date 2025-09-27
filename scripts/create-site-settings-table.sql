-- 網站設定表
-- 用於儲存首頁、農場體驗頁等頁面的動態設定

-- 建立表格
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_type ON site_settings(type);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- 插入預設資料
INSERT INTO site_settings (key, value, type, description) VALUES
  ('home.hero_images', '["\/images\/hero\/scene1.jpg","\/images\/locations\/mountain.jpg","\/images\/farm-tour\/many_people_1.jpg"]', 'images_array', '首頁輪播圖片'),
  ('home.hero_title', '純淨農產的守護者', 'string', '首頁主標題'),
  ('home.hero_subtitle', '梅山優質農場，傳承自然農法的美好', 'string', '首頁副標題'),
  ('farm_tour.hero_background', '\/images\/hero\/farm-tour.jpg', 'image', '農場體驗頁面背景圖片'),
  ('farm_tour.hero_title', '農場體驗之旅', 'string', '農場體驗頁面主標題'),
  ('farm_tour.hero_subtitle', '走進自然，體驗四季農事之美', 'string', '農場體驗頁面副標題')
ON CONFLICT (key) DO NOTHING;

-- 加入 RLS (Row Level Security) 政策
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取
CREATE POLICY "允許所有人讀取網站設定"
  ON site_settings FOR SELECT
  USING (true);

-- 只有管理員可以修改
CREATE POLICY "只有管理員可以修改網站設定"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- 註解說明
COMMENT ON TABLE site_settings IS '網站動態設定表，用於儲存首頁、農場體驗頁等頁面的可配置內容';
COMMENT ON COLUMN site_settings.key IS '設定鍵（唯一）';
COMMENT ON COLUMN site_settings.value IS '設定值（JSON 或字串）';
COMMENT ON COLUMN site_settings.type IS '設定類型：string, number, boolean, json, image, images_array';
COMMENT ON COLUMN site_settings.description IS '設定說明';