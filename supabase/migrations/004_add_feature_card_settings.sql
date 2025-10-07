-- 新增農場特色卡片背面圖片設定
-- 用於首頁「農場特色」區域的翻轉卡片背面圖片

-- 插入 4 個農場特色卡片背面圖片設定鍵
-- 初始值為空字串，管理員可透過後台上傳設定
INSERT INTO site_settings (key, value, type, description) VALUES
  ('home.feature_card_1_image', '', 'image', '首頁農場特色 - 自然農法卡片背面圖片'),
  ('home.feature_card_2_image', '', 'image', '首頁農場特色 - 品質認證卡片背面圖片'),
  ('home.feature_card_3_image', '', 'image', '首頁農場特色 - 農場體驗卡片背面圖片'),
  ('home.feature_card_4_image', '', 'image', '首頁農場特色 - 永續經營卡片背面圖片')
ON CONFLICT (key) DO NOTHING;

-- 註解說明
COMMENT ON COLUMN site_settings.key IS '設定鍵（唯一），例如: home.feature_card_1_image';
