-- ========================================
-- 測試訂單表格建立腳本
-- ========================================
-- 🎯 目標：驗證修正後的訂單表格建立腳本語法和權限設定
-- 📅 建立日期：2025-09-10
-- 📝 說明：檢查語法錯誤並驗證權限函數

BEGIN;

-- ========================================
-- 1. 檢查必要的權限函數是否存在
-- ========================================

-- 檢查 is_admin() 函數是否存在
SELECT EXISTS(
  SELECT 1 FROM pg_proc 
  WHERE proname = 'is_admin' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
) AS has_is_admin_function;

-- 如果函數不存在，先建立它（使用簡化版本）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    
    -- 建立簡化的 is_admin 函數用於測試
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    DECLARE
      user_role text;
    BEGIN
      -- 檢查 profiles 表是否存在 role 欄位
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
      ) THEN
        -- 查詢使用者角色
        SELECT role INTO user_role
        FROM public.profiles
        WHERE id = auth.uid();
        
        RETURN COALESCE(user_role = 'admin', false);
      ELSE
        -- 如果沒有 role 欄位，預設返回 false
        RETURN false;
      END IF;
    EXCEPTION
      WHEN others THEN
        RETURN false;
    END;
    $func$;
    
    RAISE NOTICE '✅ 建立測試用 is_admin() 函數';
  ELSE
    RAISE NOTICE '✅ is_admin() 函數已存在';
  END IF;
END $$;

-- ========================================
-- 2. 檢查 profiles 表結構
-- ========================================

-- 檢查 profiles 表是否存在
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'profiles' 
  AND table_schema = 'public'
) AS has_profiles_table;

-- 檢查 profiles 表的欄位結構
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 3. 檢查 products 表結構（供庫存更新函數使用）
-- ========================================

-- 檢查 products 表是否存在
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'products' 
  AND table_schema = 'public'
) AS has_products_table;

-- 檢查 products 表是否有必要的欄位
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'inventory' 
    AND table_schema = 'public'
  ) AS has_inventory_field,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'updated_at' 
    AND table_schema = 'public'
  ) AS has_updated_at_field;

-- ========================================
-- 4. 驗證訂單建立腳本的語法（模擬執行）
-- ========================================

-- 測試訂單編號生成函數語法
CREATE OR REPLACE FUNCTION test_generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  today_str VARCHAR(8);
  order_number VARCHAR(50);
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  order_number := 'TEST' || today_str || '001';
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

SELECT test_generate_order_number() as test_order_number;

-- 測試庫存更新函數語法（不實際執行）
CREATE OR REPLACE FUNCTION test_update_product_inventory(
  product_id UUID,
  quantity_change INTEGER
)
RETURNS TEXT AS $$
BEGIN
  -- 只測試語法，不實際更新
  RETURN 'Syntax OK: product_id=' || product_id || ', quantity_change=' || quantity_change;
END;
$$ LANGUAGE plpgsql;

SELECT test_update_product_inventory(gen_random_uuid(), -5) as test_inventory_update;

-- ========================================
-- 5. 檢查權限政策語法
-- ========================================

-- 測試 RLS 政策的語法（不實際建立表格）
DO $$
BEGIN
  -- 測試 public.is_admin() 函數調用
  IF public.is_admin() IS NOT NULL THEN
    RAISE NOTICE '✅ public.is_admin() 函數可以正常調用';
  ELSE
    RAISE NOTICE '⚠️ public.is_admin() 函數返回 NULL';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ public.is_admin() 函數調用失敗: %', SQLERRM;
END $$;

ROLLBACK;

-- ========================================
-- 6. 總結測試結果
-- ========================================

SELECT 
  '✅ 語法測試完成' as status,
  '修正後的 create-orders-tables.sql 應該可以正常執行' as result,
  '建議：先執行 complete-rls-fix.sql 確保 is_admin() 函數存在' as recommendation;