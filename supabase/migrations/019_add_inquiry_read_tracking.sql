-- 新增詢價單閱讀與回覆追蹤欄位
-- Migration: 019_add_inquiry_read_tracking.sql

-- 新增欄位到 inquiries 表
ALTER TABLE inquiries 
ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN is_replied BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN replied_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_inquiries_is_read ON inquiries(is_read);
CREATE INDEX IF NOT EXISTS idx_inquiries_is_replied ON inquiries(is_replied);
CREATE INDEX IF NOT EXISTS idx_inquiries_replied_by ON inquiries(replied_by);

-- 更新 inquiry_stats 檢視以包含讀取和回覆統計
DROP VIEW IF EXISTS inquiry_stats;

CREATE OR REPLACE VIEW inquiry_stats AS
SELECT 
  status,
  COUNT(*) as count,
  COALESCE(SUM(total_estimated_amount), 0) as total_amount,
  AVG(total_estimated_amount) as average_amount,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
  COUNT(CASE WHEN is_replied = false AND status != 'cancelled' THEN 1 END) as unreplied_count,
  AVG(CASE 
    WHEN replied_at IS NOT NULL AND created_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (replied_at - created_at))/3600.0 
  END) as avg_response_time_hours
FROM inquiries 
GROUP BY status;

-- 建立每日詢問統計檢視
CREATE OR REPLACE VIEW daily_inquiry_stats AS
SELECT 
  DATE(created_at) as inquiry_date,
  COUNT(*) as total_inquiries,
  COUNT(CASE WHEN is_read = true THEN 1 END) as read_inquiries,
  COUNT(CASE WHEN is_replied = true THEN 1 END) as replied_inquiries,
  ROUND(
    COUNT(CASE WHEN is_read = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 
    2
  ) as read_rate_percent,
  ROUND(
    COUNT(CASE WHEN is_replied = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 
    2
  ) as reply_rate_percent,
  AVG(CASE 
    WHEN replied_at IS NOT NULL AND created_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (replied_at - created_at))/3600.0 
  END) as avg_response_time_hours
FROM inquiries 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY inquiry_date DESC;

-- 建立觸發器函數：當狀態改為 quoted/confirmed/completed 時自動標記為已回覆
CREATE OR REPLACE FUNCTION auto_mark_inquiry_replied()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果狀態從 pending 改為其他狀態，標記為已讀和已回覆
  IF OLD.status = 'pending' AND NEW.status IN ('quoted', 'confirmed', 'completed') THEN
    NEW.is_read = true;
    NEW.is_replied = true;
    
    -- 設定讀取和回覆時間（如果還未設定）
    IF NEW.read_at IS NULL THEN
      NEW.read_at = NOW();
    END IF;
    
    IF NEW.replied_at IS NULL THEN
      NEW.replied_at = NOW();
    END IF;
    
    -- 如果沒有設定回覆者，使用當前用戶（如果有的話）
    IF NEW.replied_by IS NULL AND auth.uid() IS NOT NULL THEN
      NEW.replied_by = auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER trigger_auto_mark_inquiry_replied
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_inquiry_replied();

-- 註釋說明
COMMENT ON COLUMN inquiries.is_read IS '是否已閱讀此詢價單';
COMMENT ON COLUMN inquiries.read_at IS '閱讀時間';
COMMENT ON COLUMN inquiries.is_replied IS '是否已回覆此詢價單';
COMMENT ON COLUMN inquiries.replied_at IS '回覆時間';
COMMENT ON COLUMN inquiries.replied_by IS '回覆者 ID（管理員）';
COMMENT ON VIEW daily_inquiry_stats IS '每日詢價統計，包含讀取率和回覆率';

-- 初始化現有資料：將非 pending 狀態的詢價單標記為已讀和已回覆
UPDATE inquiries 
SET 
  is_read = true,
  read_at = updated_at,
  is_replied = true,
  replied_at = updated_at
WHERE status IN ('quoted', 'confirmed', 'completed');