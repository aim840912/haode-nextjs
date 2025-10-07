-- 新增首頁四季體驗圖片設定
-- 用於首頁「四季體驗」區域的圖片

-- 插入 4 個四季體驗圖片設定鍵
-- 初始值設為預設圖片路徑
INSERT INTO site_settings (key, value, type, description) VALUES
  ('home.season_spring_image', '/images/locations/mountain.jpg', 'image', '首頁四季體驗 - 春季賞花圖片'),
  ('home.season_summer_image', '/images/farm-tour/many_people_1.jpg', 'image', '首頁四季體驗 - 夏日採果圖片'),
  ('home.season_autumn_image', '/images/locations/mountain.jpg', 'image', '首頁四季體驗 - 秋收體驗圖片'),
  ('home.season_winter_image', '/images/farm-tour/many_people_1.jpg', 'image', '首頁四季體驗 - 冬日品茶圖片')
ON CONFLICT (key) DO NOTHING;

-- 註解說明
COMMENT ON COLUMN site_settings.key IS '設定鍵（唯一），例如: home.season_spring_image';
