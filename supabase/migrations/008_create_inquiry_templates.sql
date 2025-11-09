-- ========================================
-- 詢價範本系統
-- ========================================
-- 目的：允許使用者儲存常用詢價內容，支援「再次詢價」功能
-- 相關表：inquiries, inquiry_items
-- 版本：1.0.0
-- 建立日期：2025-11-08
-- ========================================

BEGIN;

-- 建立詢價範本主表
CREATE TABLE IF NOT EXISTS inquiry_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 範本基本資訊
  name VARCHAR(100) NOT NULL,  -- 範本名稱，如「每週蔬菜箱」
  description TEXT,  -- 範本說明（可選）

  -- 詢價類型
  inquiry_type VARCHAR(20) NOT NULL DEFAULT 'product',  -- 'product' | 'farm_tour'

  -- 客戶資訊（預填值）
  customer_name VARCHAR(50),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),

  -- 配送資訊
  delivery_address VARCHAR(200),
  preferred_delivery_date_pattern VARCHAR(20),  -- 'weekly' | 'monthly' | 'specific' | null

  -- 備註和項目資料
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,  -- 儲存詢價項目陣列

  -- 農場參觀相關欄位（僅當 inquiry_type = 'farm_tour' 時使用）
  activity_title VARCHAR(100),
  visit_date_pattern VARCHAR(20),  -- 'weekend' | 'weekday' | 'specific' | null
  visitor_count VARCHAR(10),

  -- 範本狀態
  is_active BOOLEAN DEFAULT true,  -- 是否啟用
  is_favorite BOOLEAN DEFAULT false,  -- 是否為常用範本

  -- 使用統計
  usage_count INTEGER DEFAULT 0,  -- 使用次數
  last_used_at TIMESTAMPTZ,  -- 最後使用時間

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 約束條件
  CONSTRAINT inquiry_templates_inquiry_type_check
    CHECK (inquiry_type IN ('product', 'farm_tour')),
  CONSTRAINT inquiry_templates_name_not_empty
    CHECK (length(trim(name)) > 0),
  CONSTRAINT inquiry_templates_usage_count_positive
    CHECK (usage_count >= 0)
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_inquiry_templates_user_id
  ON inquiry_templates(user_id);

CREATE INDEX idx_inquiry_templates_user_active
  ON inquiry_templates(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX idx_inquiry_templates_user_favorite
  ON inquiry_templates(user_id, is_favorite)
  WHERE is_favorite = true;

CREATE INDEX idx_inquiry_templates_inquiry_type
  ON inquiry_templates(inquiry_type);

CREATE INDEX idx_inquiry_templates_usage_count
  ON inquiry_templates(usage_count DESC);

CREATE INDEX idx_inquiry_templates_created_at
  ON inquiry_templates(created_at DESC);

-- 建立 JSONB items 欄位的 GIN 索引（支援 JSONB 查詢）
CREATE INDEX idx_inquiry_templates_items_gin
  ON inquiry_templates USING GIN (items);

-- 啟用 Row Level Security (RLS)
ALTER TABLE inquiry_templates ENABLE ROW LEVEL SECURITY;

-- RLS 政策：使用者只能查看自己的範本
CREATE POLICY "Users can view own templates"
  ON inquiry_templates FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 政策：使用者可以新增範本
CREATE POLICY "Users can insert own templates"
  ON inquiry_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 政策：使用者只能更新自己的範本
CREATE POLICY "Users can update own templates"
  ON inquiry_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS 政策：使用者只能刪除自己的範本
CREATE POLICY "Users can delete own templates"
  ON inquiry_templates FOR DELETE
  USING (auth.uid() = user_id);

-- 建立觸發器：自動更新 updated_at
CREATE TRIGGER update_inquiry_templates_updated_at
  BEFORE UPDATE ON inquiry_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 建立統計視圖
CREATE OR REPLACE VIEW inquiry_templates_stats AS
SELECT
  user_id,
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_active = true) as active_templates,
  COUNT(*) FILTER (WHERE is_favorite = true) as favorite_templates,
  SUM(usage_count) as total_usage_count,
  COALESCE(AVG(usage_count), 0) as avg_usage_count,
  MAX(last_used_at) as last_template_used_at,
  MAX(created_at) as newest_template_created_at
FROM inquiry_templates
GROUP BY user_id;

-- 新增表格註解
COMMENT ON TABLE inquiry_templates IS
  '詢價範本表：儲存使用者的常用詢價範本，支援快速建立詢價單';

COMMENT ON COLUMN inquiry_templates.id IS
  '範本唯一識別碼';

COMMENT ON COLUMN inquiry_templates.user_id IS
  '範本所有者（關聯 auth.users）';

COMMENT ON COLUMN inquiry_templates.name IS
  '範本名稱（必填），如「每週蔬菜箱」';

COMMENT ON COLUMN inquiry_templates.description IS
  '範本描述（選填），補充說明範本用途';

COMMENT ON COLUMN inquiry_templates.inquiry_type IS
  '詢價類型：product（產品詢價）或 farm_tour（農場參觀）';

COMMENT ON COLUMN inquiry_templates.items IS
  'JSONB 格式的詢價項目陣列，包含 product_id, product_name, quantity 等';

COMMENT ON COLUMN inquiry_templates.preferred_delivery_date_pattern IS
  '配送日期模式：weekly（每週）、monthly（每月）、specific（指定日期）';

COMMENT ON COLUMN inquiry_templates.usage_count IS
  '範本使用次數（每次使用範本時 +1）';

COMMENT ON COLUMN inquiry_templates.last_used_at IS
  '最後使用時間（追蹤範本活躍度）';

COMMENT ON COLUMN inquiry_templates.is_active IS
  '範本是否啟用（false 表示暫時停用，不刪除）';

COMMENT ON COLUMN inquiry_templates.is_favorite IS
  '是否為常用範本（用於快速存取）';

COMMIT;

-- 完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 詢價範本表建立成功';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ✓ 表名: inquiry_templates';
  RAISE NOTICE '  ✓ RLS 政策: 已啟用（4 個政策）';
  RAISE NOTICE '  ✓ 索引: 7 個（包含 GIN 索引）';
  RAISE NOTICE '  ✓ 觸發器: update_updated_at';
  RAISE NOTICE '  ✓ 統計視圖: inquiry_templates_stats';
  RAISE NOTICE '  ✓ 約束條件: 3 個（類型、名稱、次數）';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 後續步驟：';
  RAISE NOTICE '  1. 在 Supabase Dashboard 執行此 Migration';
  RAISE NOTICE '  2. 驗證 RLS 政策生效';
  RAISE NOTICE '  3. 測試基本 CRUD 操作';
  RAISE NOTICE '========================================';
END $$;
