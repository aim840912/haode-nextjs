-- ========================================
-- 建立地點（門市）資料表
-- ========================================
-- 🎯 目標：建立地點管理功能所需的 locations 資料表
-- 📅 建立日期：2025-09-10

-- 1. 建立 locations 表
CREATE TABLE IF NOT EXISTS public.locations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    landmark VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) NOT NULL,
    line_id VARCHAR(50) DEFAULT '',
    hours VARCHAR(100) NOT NULL,
    closed_days VARCHAR(50) DEFAULT '',
    parking VARCHAR(200) DEFAULT '',
    public_transport VARCHAR(200) DEFAULT '',
    features TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    coordinates JSONB NOT NULL,
    image TEXT DEFAULT '',
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations (name);
CREATE INDEX IF NOT EXISTS idx_locations_is_main ON locations (is_main);
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_locations_features ON locations USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_locations_specialties ON locations USING GIN (specialties);

-- 3. 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 設定 RLS (Row Level Security)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取地點資料
CREATE POLICY "Allow public read access to locations" ON locations
    FOR SELECT USING (true);

-- 只允許認證使用者新增/更新/刪除地點
CREATE POLICY "Allow authenticated users to insert locations" ON locations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update locations" ON locations
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete locations" ON locations
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. 新增評論
COMMENT ON TABLE locations IS '地點（門市）資料表';
COMMENT ON COLUMN locations.id IS '地點唯一識別碼';
COMMENT ON COLUMN locations.name IS '地點名稱';
COMMENT ON COLUMN locations.title IS '地點完整標題';
COMMENT ON COLUMN locations.address IS '地點地址';
COMMENT ON COLUMN locations.landmark IS '地標說明';
COMMENT ON COLUMN locations.phone IS '聯絡電話';
COMMENT ON COLUMN locations.line_id IS 'LINE ID';
COMMENT ON COLUMN locations.hours IS '營業時間';
COMMENT ON COLUMN locations.closed_days IS '公休日';
COMMENT ON COLUMN locations.parking IS '停車資訊';
COMMENT ON COLUMN locations.public_transport IS '大眾運輸資訊';
COMMENT ON COLUMN locations.features IS '特色服務清單';
COMMENT ON COLUMN locations.specialties IS '主打商品清單';
COMMENT ON COLUMN locations.coordinates IS '地理座標 (lat, lng)';
COMMENT ON COLUMN locations.image IS '地點圖片 URL';
COMMENT ON COLUMN locations.is_main IS '是否為總店';
COMMENT ON COLUMN locations.created_at IS '建立時間';
COMMENT ON COLUMN locations.updated_at IS '更新時間';

-- 6. 新增範例資料（可選）
INSERT INTO locations (
    name, title, address, landmark, phone, line_id, hours, closed_days,
    parking, public_transport, features, specialties, coordinates, is_main
) VALUES (
    '總店',
    '豪德茶業總店',
    '南投縣埔里鎮中山路一段123號',
    '埔里酒廠對面',
    '049-291-5678',
    '@haudetea',
    '09:00-19:00',
    '週一公休',
    '店前免費停車場（30個車位）',
    '埔里轉運站步行5分鐘',
    ARRAY['免費試茶', '專業導覽', '茶葉包裝', '禮盒訂製'],
    ARRAY['日月潭紅茶', '凍頂烏龍茶', '高山茶', '茉莉花茶'],
    '{"lat": 23.9685, "lng": 120.9681}',
    true
) ON CONFLICT DO NOTHING;

-- 驗證表是否建立成功
SELECT 'locations 表建立完成' as status;

-- 顯示表結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND table_schema = 'public'
ORDER BY ordinal_position;