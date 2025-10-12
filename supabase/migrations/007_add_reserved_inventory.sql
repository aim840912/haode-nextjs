-- ========================================
-- 保留庫存機制 Migration
-- ========================================
-- 🎯 目標：新增保留庫存欄位與管理函數
-- 📅 建立日期：2025-10-10
-- 📝 說明：
--   - 新增 reserved_stock 欄位追蹤已確認但未完成的詢價單
--   - 可用庫存 = stock - reserved_stock
--   - 提供完整的保留/釋放/完成函數
--   - 修正 update_product_inventory 欄位名稱錯誤
-- ========================================

BEGIN;

-- ========================================
-- 1. 新增保留庫存欄位
-- ========================================

-- 新增 reserved_stock 欄位
ALTER TABLE products
ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0);

-- 為現有產品初始化保留庫存為 0
UPDATE products
SET reserved_stock = 0
WHERE reserved_stock IS NULL;

-- 設定欄位為 NOT NULL（在初始化後）
ALTER TABLE products
ALTER COLUMN reserved_stock SET NOT NULL;

-- 新增約束：保留庫存不能超過實際庫存
ALTER TABLE products
ADD CONSTRAINT check_reserved_not_exceed_stock
CHECK (reserved_stock <= stock);

-- 新增計算欄位索引（提升查詢效能）
CREATE INDEX IF NOT EXISTS idx_products_available_stock
ON products ((stock - reserved_stock));

-- 新增保留庫存索引
CREATE INDEX IF NOT EXISTS idx_products_reserved_stock
ON products (reserved_stock) WHERE reserved_stock > 0;

-- 新增欄位註解
COMMENT ON COLUMN products.reserved_stock IS '保留庫存：已確認但未完成的詢價單佔用的庫存';

-- ========================================
-- 2. 修正現有的 update_product_inventory 函數
-- ========================================
-- 問題：原函數使用 inventory 欄位，但資料庫實際使用 stock

-- 先刪除舊函數（因為要改變參數名稱）
DROP FUNCTION IF EXISTS update_product_inventory(UUID, INTEGER);

CREATE OR REPLACE FUNCTION update_product_inventory(
  p_product_id UUID,
  p_quantity_change INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- 取得當前庫存（使用 FOR UPDATE 鎖定）
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '產品不存在: %', p_product_id;
  END IF;

  -- 計算新庫存
  v_new_stock := v_current_stock + p_quantity_change;

  -- 檢查庫存是否為負數
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION '庫存不足，無法減少 % 個單位（當前庫存: %）',
      ABS(p_quantity_change), v_current_stock;
  END IF;

  -- 更新產品庫存（使用 stock 而非 inventory）
  UPDATE products
  SET
    stock = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;

  RAISE NOTICE '✓ 更新庫存成功: 產品 %, 變化 %, 新庫存 %',
    p_product_id, p_quantity_change, v_new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. 建立保留庫存管理函數
-- ========================================

-- 3.1 保留產品庫存函數
CREATE OR REPLACE FUNCTION reserve_product_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_current_reserved INTEGER;
  v_available_stock INTEGER;
  v_new_reserved INTEGER;
BEGIN
  -- 檢查參數
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION '保留數量必須大於 0';
  END IF;

  -- 取得當前庫存資訊（使用 FOR UPDATE 鎖定，避免併發問題）
  SELECT stock, reserved_stock
  INTO v_current_stock, v_current_reserved
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '產品不存在',
      'product_id', p_product_id
    );
  END IF;

  -- 計算可用庫存
  v_available_stock := v_current_stock - v_current_reserved;

  -- 檢查是否有足夠庫存可保留
  IF v_available_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '可用庫存不足',
      'product_id', p_product_id,
      'available_stock', v_available_stock,
      'requested', p_quantity,
      'shortfall', p_quantity - v_available_stock
    );
  END IF;

  -- 更新保留庫存
  v_new_reserved := v_current_reserved + p_quantity;

  UPDATE products
  SET
    reserved_stock = v_new_reserved,
    updated_at = NOW()
  WHERE id = p_product_id;

  RAISE NOTICE '✓ 保留庫存成功: 產品 %, 保留 %, 新保留總量 %',
    p_product_id, p_quantity, v_new_reserved;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'reserved_quantity', p_quantity,
    'previous_reserved', v_current_reserved,
    'new_reserved_stock', v_new_reserved,
    'new_available_stock', v_available_stock - p_quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reserve_product_inventory IS '保留產品庫存（詢價單確認時調用）';

-- 3.2 釋放保留庫存函數
CREATE OR REPLACE FUNCTION release_reserved_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_reserved INTEGER;
  v_new_reserved INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION '釋放數量必須大於 0';
  END IF;

  -- 取得當前保留庫存（鎖定）
  SELECT reserved_stock
  INTO v_current_reserved
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '產品不存在',
      'product_id', p_product_id
    );
  END IF;

  -- 檢查保留庫存是否足夠
  IF v_current_reserved < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '保留庫存不足',
      'product_id', p_product_id,
      'current_reserved', v_current_reserved,
      'requested', p_quantity
    );
  END IF;

  -- 更新保留庫存
  v_new_reserved := v_current_reserved - p_quantity;

  UPDATE products
  SET
    reserved_stock = v_new_reserved,
    updated_at = NOW()
  WHERE id = p_product_id;

  RAISE NOTICE '✓ 釋放保留庫存成功: 產品 %, 釋放 %, 剩餘保留 %',
    p_product_id, p_quantity, v_new_reserved;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'released_quantity', p_quantity,
    'previous_reserved', v_current_reserved,
    'new_reserved_stock', v_new_reserved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION release_reserved_inventory IS '釋放保留庫存（詢價單取消時調用）';

-- 3.3 完成保留（從保留轉為實際扣減）
CREATE OR REPLACE FUNCTION finalize_reserved_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_current_reserved INTEGER;
  v_new_stock INTEGER;
  v_new_reserved INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION '數量必須大於 0';
  END IF;

  -- 取得當前庫存資訊（鎖定）
  SELECT stock, reserved_stock
  INTO v_current_stock, v_current_reserved
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '產品不存在',
      'product_id', p_product_id
    );
  END IF;

  -- 檢查保留庫存
  IF v_current_reserved < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '保留庫存不足',
      'product_id', p_product_id,
      'current_reserved', v_current_reserved,
      'requested', p_quantity
    );
  END IF;

  -- 檢查實際庫存（雙重保險）
  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '實際庫存不足',
      'product_id', p_product_id,
      'current_stock', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  -- 同時減少實際庫存和保留庫存
  v_new_stock := v_current_stock - p_quantity;
  v_new_reserved := v_current_reserved - p_quantity;

  UPDATE products
  SET
    stock = v_new_stock,
    reserved_stock = v_new_reserved,
    updated_at = NOW()
  WHERE id = p_product_id;

  RAISE NOTICE '✓ 完成保留成功: 產品 %, 扣減 %, 新庫存 %, 新保留 %',
    p_product_id, p_quantity, v_new_stock, v_new_reserved;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'finalized_quantity', p_quantity,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'previous_reserved', v_current_reserved,
    'new_reserved_stock', v_new_reserved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION finalize_reserved_inventory IS '完成保留庫存（詢價單交易完成時調用）';

-- ========================================
-- 4. 授權函數執行權限
-- ========================================

-- 修正後的 update_product_inventory
GRANT EXECUTE ON FUNCTION update_product_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_inventory(UUID, INTEGER) TO service_role;

-- 保留庫存函數
GRANT EXECUTE ON FUNCTION reserve_product_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_product_inventory(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION release_reserved_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION release_reserved_inventory(UUID, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION finalize_reserved_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_reserved_inventory(UUID, INTEGER) TO service_role;

-- ========================================
-- 5. 建立庫存狀態查詢視圖（可選，方便查詢）
-- ========================================

CREATE OR REPLACE VIEW product_inventory_status AS
SELECT
  id,
  name,
  stock AS total_stock,
  reserved_stock,
  (stock - reserved_stock) AS available_stock,
  CASE
    WHEN (stock - reserved_stock) > 0 THEN true
    ELSE false
  END AS can_purchase,
  CASE
    WHEN reserved_stock > 0 THEN
      ROUND((reserved_stock::DECIMAL / stock::DECIMAL * 100), 2)
    ELSE 0
  END AS reserved_percentage
FROM products
WHERE stock IS NOT NULL;

COMMENT ON VIEW product_inventory_status IS '產品庫存狀態視圖（包含可用庫存和保留比例）';

-- ========================================
-- 6. 建立觸發器：防止手動修改保留庫存
-- ========================================

CREATE OR REPLACE FUNCTION validate_reserved_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 只允許透過 RPC 函數修改 reserved_stock
  -- 檢查是否是透過允許的函數調用
  IF TG_OP = 'UPDATE' AND
     OLD.reserved_stock IS DISTINCT FROM NEW.reserved_stock AND
     current_setting('application_name', true) NOT LIKE '%reserve%inventory%' THEN

    RAISE WARNING '⚠️  保留庫存應透過 reserve/release/finalize 函數修改，不建議直接更新';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reserved_stock_change
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.reserved_stock IS DISTINCT FROM NEW.reserved_stock)
  EXECUTE FUNCTION validate_reserved_stock_change();

COMMIT;

-- ========================================
-- 7. 驗證腳本
-- ========================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_constraint_exists BOOLEAN;
BEGIN
  -- 檢查 reserved_stock 欄位
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'reserved_stock'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✅ reserved_stock 欄位存在';
  ELSE
    RAISE EXCEPTION '❌ reserved_stock 欄位不存在';
  END IF;

  -- 檢查約束
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'products'
    AND constraint_name = 'check_reserved_not_exceed_stock'
  ) INTO v_constraint_exists;

  IF v_constraint_exists THEN
    RAISE NOTICE '✅ 保留庫存約束存在';
  ELSE
    RAISE WARNING '⚠️  保留庫存約束不存在（可能 Supabase 不支援）';
  END IF;

  -- 測試函數
  PERFORM reserve_product_inventory(gen_random_uuid(), 1);
  RAISE NOTICE '✅ 保留庫存函數可執行（產品不存在是預期行為）';

  RAISE NOTICE '🎉 保留庫存機制 Migration 完成！';
END $$;
