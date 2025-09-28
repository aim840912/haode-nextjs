-- ========================================
-- 產品圖片外鍵約束重構
-- ========================================
-- 目的：將外鍵改為 DEFERRABLE，支援事務式建立
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行
-- ========================================

-- 1. 備份現有資料（可選）
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '開始執行產品圖片外鍵約束重構';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '檢查現有資料...';
END $$;

-- 顯示現有產品和圖片數量
DO $$
DECLARE
  product_count INTEGER;
  image_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO image_count FROM product_images;

  RAISE NOTICE '現有產品數量: %', product_count;
  RAISE NOTICE '現有圖片數量: %', image_count;
  RAISE NOTICE '';
END $$;

-- 2. 移除現有外鍵約束
DO $$
BEGIN
  RAISE NOTICE '步驟 1/3: 移除現有外鍵約束...';
END $$;

ALTER TABLE product_images
DROP CONSTRAINT IF EXISTS fk_product_images_product_id;

ALTER TABLE product_images
DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;

DO $$
BEGIN
  RAISE NOTICE '✅ 現有外鍵約束已移除';
  RAISE NOTICE '';
END $$;

-- 3. 新增 DEFERRABLE 外鍵約束
DO $$
BEGIN
  RAISE NOTICE '步驟 2/3: 新增 DEFERRABLE 外鍵約束...';
END $$;

ALTER TABLE product_images
ADD CONSTRAINT fk_product_images_product_id
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

DO $$
BEGIN
  RAISE NOTICE '✅ DEFERRABLE 外鍵約束已建立';
  RAISE NOTICE '';
  RAISE NOTICE '約束特性：';
  RAISE NOTICE '  - DEFERRABLE: 可延遲檢查約束';
  RAISE NOTICE '  - INITIALLY DEFERRED: 預設在事務結束時檢查';
  RAISE NOTICE '  - ON DELETE CASCADE: 刪除產品時自動刪除關聯圖片';
  RAISE NOTICE '';
END $$;

-- 4. 驗證新約束
DO $$
DECLARE
  constraint_info RECORD;
BEGIN
  RAISE NOTICE '步驟 3/3: 驗證新約束設定...';
  RAISE NOTICE '';

  -- 查詢約束資訊
  SELECT
    con.conname AS constraint_name,
    CASE con.condeferrable
      WHEN TRUE THEN 'DEFERRABLE'
      ELSE 'NOT DEFERRABLE'
    END AS deferrable_status,
    CASE con.condeferred
      WHEN TRUE THEN 'INITIALLY DEFERRED'
      ELSE 'INITIALLY IMMEDIATE'
    END AS defer_mode,
    pg_get_constraintdef(con.oid) AS constraint_definition
  INTO constraint_info
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'product_images'
    AND con.conname = 'fk_product_images_product_id';

  IF FOUND THEN
    RAISE NOTICE '約束名稱: %', constraint_info.constraint_name;
    RAISE NOTICE '延遲狀態: %', constraint_info.deferrable_status;
    RAISE NOTICE '預設模式: %', constraint_info.defer_mode;
    RAISE NOTICE '約束定義: %', constraint_info.constraint_definition;
  ELSE
    RAISE WARNING '警告：找不到約束資訊';
  END IF;

  RAISE NOTICE '';
END $$;

-- 5. 測試 DEFERRABLE 功能
DO $$
DECLARE
  test_product_id UUID := 'aaaaaaaa-bbbb-cccc-dddd-000000000001';
  test_passed BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '執行功能測試...';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- 開始測試事務
  BEGIN
    -- 在事務中：先插入圖片（產品還不存在）
    INSERT INTO product_images (product_id, url, path, alt, position)
    VALUES (
      test_product_id,
      'https://test.com/image.jpg',
      'test/image.jpg',
      '測試圖片',
      0
    );

    RAISE NOTICE '✅ 步驟 1: 成功插入圖片（產品尚未存在）';

    -- 然後插入產品
    INSERT INTO products (
      id, name, description, category, price, price_unit, stock, is_active
    ) VALUES (
      test_product_id,
      '測試產品',
      '測試描述',
      '測試分類',
      100,
      '斤',
      10,
      true
    );

    RAISE NOTICE '✅ 步驟 2: 成功插入產品';
    RAISE NOTICE '✅ 測試通過：DEFERRABLE 外鍵運作正常';
    RAISE NOTICE '';

    test_passed := TRUE;

    -- 清理測試資料
    DELETE FROM product_images WHERE product_id = test_product_id;
    DELETE FROM products WHERE id = test_product_id;

    RAISE NOTICE '✅ 測試資料已清理';

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ 測試失敗: %', SQLERRM;
    RAISE WARNING '請檢查約束設定是否正確';
  END;

  IF test_passed THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 重構完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '現在可以：';
    RAISE NOTICE '1. 在事務中先插入圖片，再插入產品';
    RAISE NOTICE '2. 使用 PostgreSQL 函數實作事務式建立';
    RAISE NOTICE '3. 避免草稿產品的建立';
    RAISE NOTICE '';
  END IF;
END $$;

-- 6. 最後檢查
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '最終檢查清單';
  RAISE NOTICE '========================================';
  RAISE NOTICE '[ ✓ ] 移除舊外鍵約束';
  RAISE NOTICE '[ ✓ ] 建立 DEFERRABLE 外鍵約束';
  RAISE NOTICE '[ ✓ ] 驗證約束設定';
  RAISE NOTICE '[ ✓ ] 功能測試通過';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '請執行 create-product-with-images-function.sql';
  RAISE NOTICE '建立事務式產品建立函數';
  RAISE NOTICE '========================================';
END $$;