-- =====================================================
-- 首頁最新消息卡片設定 Migration
-- =====================================================
-- 新增「當季推薦」和「農場活動」卡片的可配置設定
-- 執行日期: 2025-11-11
-- =====================================================

-- 當季推薦卡片設定 (Seasonal Recommendation)
INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.enabled', 'true', 'boolean', '是否啟用當季推薦卡片')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.title', '當季推薦', 'string', '當季推薦卡片標題')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.icon', 'sprout', 'string', '當季推薦卡片圖示 (sprout/apple/wheat/leaf)')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.description', '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中', 'string', '當季推薦卡片描述文字')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.link_url', '/products', 'string', '當季推薦卡片連結 URL')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.seasonal_recommendation.link_text', '查看產品 →', 'string', '當季推薦卡片連結文字')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

-- 農場活動卡片設定 (Farm Activity)
INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.enabled', 'true', 'boolean', '是否啟用農場活動卡片')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.title', '農場活動', 'string', '農場活動卡片標題')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.icon', 'party-popper', 'string', '農場活動卡片圖示 (party-popper/calendar/users/sparkles)')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.description', '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣', 'string', '農場活動卡片描述文字')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.link_url', '/farm-tour', 'string', '農場活動卡片連結 URL')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO site_settings (key, value, type, description)
VALUES
  ('home.news.farm_activity.link_text', '立即預約 →', 'string', '農場活動卡片連結文字')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = now();

-- 驗證查詢
SELECT key, value, type, description
FROM site_settings
WHERE key LIKE 'home.news.%'
ORDER BY key;
