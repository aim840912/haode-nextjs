-- 建立詢價單相關資料表
-- Migration: 009_create_inquiry_tables.sql

-- 建立詢價單主表
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  total_estimated_amount DECIMAL(10,2),
  delivery_address TEXT,
  preferred_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立詢價單項目表
CREATE TABLE IF NOT EXISTS inquiry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_product_id ON inquiry_items(product_id);

-- 啟用 RLS (Row Level Security)
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策：使用者只能查看自己的詢價單
CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id);

-- 建立 RLS 政策：使用者只能建立自己的詢價單
CREATE POLICY "Users can insert own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 建立 RLS 政策：使用者可以更新自己的詢價單（僅限特定欄位）
CREATE POLICY "Users can update own inquiries" ON inquiries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 建立 RLS 政策：管理員可以查看所有詢價單
CREATE POLICY "Admins can view all inquiries" ON inquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 建立 RLS 政策：詢價項目繼承詢價單的權限
CREATE POLICY "Users can view own inquiry items" ON inquiry_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inquiries 
      WHERE inquiries.id = inquiry_items.inquiry_id 
      AND inquiries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own inquiry items" ON inquiry_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inquiries 
      WHERE inquiries.id = inquiry_items.inquiry_id 
      AND inquiries.user_id = auth.uid()
    )
  );

-- 建立 RLS 政策：管理員可以查看所有詢價項目
CREATE POLICY "Admins can view all inquiry items" ON inquiry_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 建立 updated_at 自動更新的觸發器
CREATE OR REPLACE FUNCTION update_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inquiry_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiry_updated_at();

-- 建立詢價統計檢視（管理員用）
CREATE OR REPLACE VIEW inquiry_stats AS
SELECT 
  status,
  COUNT(*) as count,
  COALESCE(SUM(total_estimated_amount), 0) as total_amount,
  AVG(total_estimated_amount) as average_amount
FROM inquiries 
GROUP BY status;

-- 註釋說明
COMMENT ON TABLE inquiries IS '詢價單主表，儲存客戶詢價資訊';
COMMENT ON TABLE inquiry_items IS '詢價單項目表，儲存詢價的產品明細';
COMMENT ON COLUMN inquiries.status IS '詢價單狀態：pending(待處理), quoted(已報價), confirmed(已確認), completed(已完成), cancelled(已取消)';
COMMENT ON COLUMN inquiries.total_estimated_amount IS '預估總金額（台幣）';
COMMENT ON VIEW inquiry_stats IS '詢價統計檢視，供管理員查看各狀態詢價單統計';