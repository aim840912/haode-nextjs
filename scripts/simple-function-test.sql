-- ========================================
-- 簡單函數驗證
-- ========================================
-- 目的：用最簡單的方式驗證函數可用
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行
-- ========================================

-- 測試 1：建立產品（無圖片）
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  result JSONB;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '測試 1: 建立產品（無圖片）';
  RAISE NOTICE '========================================';

  result := create_product_with_images(
    jsonb_build_object(
      'id', test_id,
      'name', '測試產品',
      'description', '測試描述',
      'category', '測試分類',
      'price', 100,
      'inventory', 50
    )
  );

  IF (result->>'success')::BOOLEAN THEN
    RAISE NOTICE '成功: %', result->>'message';
    RAISE NOTICE '產品 ID: %', result->'data'->'product'->>'id';
    DELETE FROM products WHERE id = test_id;
  ELSE
    RAISE WARNING '失敗: %', result->>'error';
  END IF;
END $$;

-- 測試 2：建立產品（含圖片）
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  result JSONB;
  img_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '測試 2: 建立產品（含圖片）';
  RAISE NOTICE '========================================';

  result := create_product_with_images(
    jsonb_build_object(
      'id', test_id,
      'name', '測試產品2',
      'description', '測試描述',
      'category', '測試分類',
      'price', 200
    ),
    jsonb_build_array(
      jsonb_build_object(
        'url', 'https://test.com/image1.jpg',
        'path', 'test/image1.jpg',
        'position', 0
      )
    )
  );

  IF (result->>'success')::BOOLEAN THEN
    img_count := jsonb_array_length(result->'data'->'images');
    RAISE NOTICE '成功: %', result->>'message';
    RAISE NOTICE '產品 ID: %', result->'data'->'product'->>'id';
    RAISE NOTICE '圖片數量: %', img_count;
    DELETE FROM products WHERE id = test_id;
  ELSE
    RAISE WARNING '失敗: %', result->>'error';
  END IF;
END $$;

-- 測試 3：錯誤處理
DO $$
DECLARE
  result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '測試 3: 錯誤處理（缺少必填欄位）';
  RAISE NOTICE '========================================';

  result := create_product_with_images(
    jsonb_build_object('name', '測試產品3')
  );

  IF NOT (result->>'success')::BOOLEAN THEN
    RAISE NOTICE '成功捕捉錯誤';
    RAISE NOTICE '錯誤訊息: %', SUBSTRING(result->>'error', 1, 50);
  ELSE
    RAISE WARNING '應該回傳錯誤但沒有';
  END IF;
END $$;

-- 完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '驗證完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '如果看到上面 3 個測試都顯示「成功」';
  RAISE NOTICE '就代表函數運作正常！';
  RAISE NOTICE '';
  RAISE NOTICE '可以開始使用 API:';
  RAISE NOTICE 'POST /api/admin/products/create-with-images';
  RAISE NOTICE '';
END $$;