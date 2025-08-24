-- 新增 news 表的 author 和 featured 欄位
-- 修復現有未發布的新聞資料

-- 新增 author 欄位
ALTER TABLE news ADD COLUMN IF NOT EXISTS author VARCHAR(100) DEFAULT '豪德農場';

-- 新增 featured 欄位（是否精選）
ALTER TABLE news ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- 修復現有未發布的新聞，將其設為已發布
UPDATE news 
SET is_published = true 
WHERE is_published = false OR is_published IS NULL;

-- 確保 publish_date 不為 NULL
UPDATE news 
SET publish_date = created_at 
WHERE publish_date IS NULL;

-- 為現有資料設定預設作者
UPDATE news 
SET author = '豪德農場' 
WHERE author IS NULL OR author = '';