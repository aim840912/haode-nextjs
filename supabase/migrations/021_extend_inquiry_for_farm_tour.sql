-- 擴展詢問單表格以支援農場參觀預約
-- Migration: 021_extend_inquiry_for_farm_tour.sql

-- 新增詢問類型欄位
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS inquiry_type VARCHAR(20) DEFAULT 'product' 
CHECK (inquiry_type IN ('product', 'farm_tour'));

-- 新增農場參觀相關欄位
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS activity_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS visit_date DATE,
ADD COLUMN IF NOT EXISTS visitor_count VARCHAR(50);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_visit_date ON inquiries(visit_date);

-- 更新詢價統計檢視以支援詢問類型分組
CREATE OR REPLACE VIEW inquiry_stats AS
SELECT 
  status,
  inquiry_type,
  COUNT(*) as count,
  COALESCE(SUM(total_estimated_amount), 0) as total_amount,
  AVG(total_estimated_amount) as average_amount
FROM inquiries 
GROUP BY status, inquiry_type;

-- 建立新的檢視：按類型統計詢問
CREATE OR REPLACE VIEW inquiry_type_stats AS
SELECT 
  inquiry_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted_count,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  COUNT(CASE WHEN NOT is_read THEN 1 END) as unread_count,
  COUNT(CASE WHEN NOT is_replied THEN 1 END) as unreplied_count
FROM inquiries 
GROUP BY inquiry_type;

-- 註釋說明新欄位
COMMENT ON COLUMN inquiries.inquiry_type IS '詢問類型：product(產品詢價), farm_tour(農場參觀)';
COMMENT ON COLUMN inquiries.activity_title IS '農場活動標題（僅農場參觀詢問使用）';
COMMENT ON COLUMN inquiries.visit_date IS '預定參觀日期（僅農場參觀詢問使用）';
COMMENT ON COLUMN inquiries.visitor_count IS '參觀人數描述（僅農場參觀詢問使用）';
COMMENT ON VIEW inquiry_type_stats IS '按詢問類型統計檢視，供管理員查看不同類型詢問的統計資料';

-- 更新現有資料的 inquiry_type 預設值
UPDATE inquiries 
SET inquiry_type = 'product' 
WHERE inquiry_type IS NULL;