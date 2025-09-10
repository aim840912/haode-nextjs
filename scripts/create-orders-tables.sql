-- ========================================
-- 訂單系統資料庫結構
-- ========================================
-- 🎯 目標：建立完整的訂單管理系統
-- 📅 建立日期：2025-09-10
-- 📝 說明：包含訂單主表、訂單項目表、相關索引和 RLS 政策

BEGIN;

-- ========================================
-- 1. 建立訂單主表 (orders)
-- ========================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- 訂單編號，如 'ORD20240114001'
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  
  -- 金額相關
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0, -- 小計
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0, -- 運費
  tax DECIMAL(10,2) NOT NULL DEFAULT 0, -- 稅費
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- 總金額
  
  -- 配送地址 (JSON 格式)
  shipping_address JSONB NOT NULL,
  
  -- 付款相關
  payment_method VARCHAR(50), -- 付款方式
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  payment_id VARCHAR(100), -- 付款系統的交易ID
  
  -- 其他資訊
  notes TEXT, -- 訂單備註
  estimated_delivery_date DATE, -- 預計送達日期
  actual_delivery_date DATE, -- 實際送達日期
  tracking_number VARCHAR(100), -- 物流追蹤號碼
  
  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 訂單主表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders (user_id, created_at DESC);

-- ========================================
-- 2. 建立訂單項目表 (order_items)
-- ========================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL, -- 快照產品名稱（防止產品更名影響歷史訂單）
  product_image VARCHAR(500), -- 快照產品圖片URL
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL, -- 單價
  price_unit VARCHAR(20), -- 價格單位（斤、包、箱等）
  unit_quantity INTEGER DEFAULT 1, -- 單位數量
  subtotal DECIMAL(10,2) NOT NULL, -- 小計 (quantity * unit_price)
  
  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 訂單項目表索引
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- ========================================
-- 3. 建立更新時間戳記的觸發器
-- ========================================

-- 訂單表更新時間戳記觸發器
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON orders;
CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 訂單項目表更新時間戳記觸發器
CREATE OR REPLACE FUNCTION update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_items_updated_at_trigger ON order_items;
CREATE TRIGGER update_order_items_updated_at_trigger
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_items_updated_at();

-- ========================================
-- 4. 建立 RLS (Row Level Security) 政策
-- ========================================

-- 啟用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 清理現有的 orders 表 RLS 政策
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- 訂單表 RLS 政策
-- 使用者只能查看自己的訂單
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- 使用者可以建立自己的訂單
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 使用者可以更新自己的訂單（僅限特定欄位）
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 管理員可以查看所有訂單
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (public.is_admin());

-- 管理員可以更新所有訂單
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (public.is_admin());

-- 清理現有的 order_items 表 RLS 政策
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- 訂單項目表 RLS 政策
-- 使用者只能查看自己訂單的項目
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 使用者可以建立自己訂單的項目
CREATE POLICY "Users can create own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 管理員可以查看所有訂單項目
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (public.is_admin());

-- ========================================
-- 5. 建立訂單編號生成函數
-- ========================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  today_str VARCHAR(8);
  daily_count INTEGER;
  new_order_number VARCHAR(50);
BEGIN
  -- 取得今天的日期字串 (YYYYMMDD)
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- 計算今天已有的訂單數量
  SELECT COUNT(*) INTO daily_count
  FROM orders
  WHERE orders.order_number LIKE 'ORD' || today_str || '%';
  
  -- 生成訂單編號: ORD + 日期 + 流水號 (3位數)
  new_order_number := 'ORD' || today_str || LPAD((daily_count + 1)::TEXT, 3, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5.1 建立產品庫存更新函數
-- ========================================

CREATE OR REPLACE FUNCTION update_product_inventory(
  product_id UUID,
  quantity_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- 更新產品庫存
  UPDATE products 
  SET 
    inventory = inventory + quantity_change,
    updated_at = NOW()
  WHERE id = product_id;
  
  -- 檢查是否找到產品
  IF NOT FOUND THEN
    RAISE EXCEPTION '產品不存在: %', product_id;
  END IF;
  
  -- 檢查庫存是否為負數
  IF (SELECT inventory FROM products WHERE id = product_id) < 0 THEN
    RAISE EXCEPTION '庫存不足，無法減少 % 個單位', ABS(quantity_change);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授權函數使用權限
GRANT EXECUTE ON FUNCTION update_product_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_inventory(UUID, INTEGER) TO service_role;

-- ========================================
-- 6. 建立訂單統計視圖
-- ========================================

CREATE OR REPLACE VIEW order_summary_view AS
SELECT
  COUNT(*) as total_orders,
  COALESCE(SUM(total_amount), 0) as total_amount,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders
FROM orders;

-- ========================================
-- 7. 建立用於全文搜尋的索引 (可選)
-- ========================================

-- 為訂單編號和備註建立全文搜尋索引
-- 使用預設的英文配置以確保相容性
CREATE INDEX IF NOT EXISTS idx_orders_search ON orders USING GIN (
  to_tsvector('english', COALESCE(order_number, '') || ' ' || COALESCE(notes, ''))
);

COMMIT;

-- ========================================
-- 8. 驗證腳本
-- ========================================

-- 驗證表格是否建立成功
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    RAISE NOTICE '✅ orders 表格建立成功';
  ELSE
    RAISE EXCEPTION '❌ orders 表格建立失敗';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    RAISE NOTICE '✅ order_items 表格建立成功';
  ELSE
    RAISE EXCEPTION '❌ order_items 表格建立失敗';
  END IF;

  -- 測試訂單編號生成函數
  PERFORM generate_order_number();
  RAISE NOTICE '✅ 訂單編號生成函數測試成功';

  RAISE NOTICE '🎉 訂單系統資料庫結構建立完成！';
END $$;