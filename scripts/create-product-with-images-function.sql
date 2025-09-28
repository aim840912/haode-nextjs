-- ========================================
-- 事務式產品建立函數
-- ========================================
-- 目的：在單一事務中建立產品和圖片
-- 依賴：需要先執行 refactor-product-images-constraints.sql
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行
-- ========================================

-- 1. 建立事務式產品建立函數
CREATE OR REPLACE FUNCTION create_product_with_images(
  product_data JSONB,
  images_data JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_product_result JSONB;
  v_images_result JSONB;
  v_image_count INTEGER;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  v_start_time := clock_timestamp();

  -- 驗證輸入
  IF product_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '產品資料不能為空',
      'error_code', 'VALIDATION_ERROR'
    );
  END IF;

  -- 開始事務
  BEGIN
    -- ========================================
    -- 步驟 1: 插入產品
    -- ========================================
    INSERT INTO products (
      id,
      name,
      description,
      category,
      price,
      price_unit,
      unit_quantity,
      stock,
      sku,
      is_active,
      is_on_sale,
      original_price,
      sale_end_date
    ) VALUES (
      COALESCE((product_data->>'id')::UUID, gen_random_uuid()),
      product_data->>'name',
      product_data->>'description',
      product_data->>'category',
      (product_data->>'price')::DECIMAL,
      COALESCE(product_data->>'priceUnit', '斤'),
      COALESCE((product_data->>'unitQuantity')::INTEGER, 1),
      COALESCE((product_data->>'inventory')::INTEGER, 0),
      NULLIF(product_data->>'sku', ''),
      COALESCE((product_data->>'isActive')::BOOLEAN, true),
      COALESCE((product_data->>'isOnSale')::BOOLEAN, false),
      (product_data->>'originalPrice')::DECIMAL,
      NULLIF(product_data->>'saleEndDate', '')::TIMESTAMPTZ
    ) RETURNING id INTO v_product_id;

    RAISE NOTICE '✓ 產品建立成功: %', v_product_id;

    -- ========================================
    -- 步驟 2: 批量插入圖片（如果有）
    -- ========================================
    v_image_count := jsonb_array_length(images_data);

    IF v_image_count > 0 THEN
      INSERT INTO product_images (
        product_id,
        url,
        path,
        alt,
        position,
        size,
        width,
        height,
        file_size
      )
      SELECT
        v_product_id,
        (image->>'url')::TEXT,
        (image->>'path')::TEXT,
        COALESCE(image->>'alt', '產品圖片'),
        COALESCE((image->>'position')::INTEGER, 0),
        COALESCE(image->>'size', 'medium'),
        (image->>'width')::INTEGER,
        (image->>'height')::INTEGER,
        (image->>'file_size')::INTEGER
      FROM jsonb_array_elements(images_data) AS image;

      RAISE NOTICE '✓ 圖片插入成功: % 張', v_image_count;
    ELSE
      RAISE NOTICE '⚠ 未提供圖片資料';
    END IF;

    -- ========================================
    -- 步驟 3: 查詢完整產品資料
    -- ========================================
    SELECT jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'category', p.category,
      'price', p.price,
      'priceUnit', p.price_unit,
      'unitQuantity', p.unit_quantity,
      'inventory', p.stock,
      'sku', p.sku,
      'isActive', p.is_active,
      'isOnSale', p.is_on_sale,
      'originalPrice', p.original_price,
      'saleEndDate', p.sale_end_date,
      'createdAt', p.created_at,
      'updatedAt', p.updated_at
    ) INTO v_product_result
    FROM products p
    WHERE p.id = v_product_id;

    -- ========================================
    -- 步驟 4: 查詢圖片資料
    -- ========================================
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'productId', pi.product_id,
        'url', pi.url,
        'path', pi.path,
        'alt', pi.alt,
        'position', pi.position,
        'size', pi.size,
        'width', pi.width,
        'height', pi.height,
        'fileSize', pi.file_size,
        'createdAt', pi.created_at,
        'updatedAt', pi.updated_at
      ) ORDER BY pi.position
    ), '[]'::jsonb) INTO v_images_result
    FROM product_images pi
    WHERE pi.product_id = v_product_id;

    v_end_time := clock_timestamp();

    -- ========================================
    -- 步驟 5: 返回結果
    -- ========================================
    RETURN jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'product', v_product_result,
        'images', v_images_result
      ),
      'meta', jsonb_build_object(
        'productId', v_product_id,
        'imageCount', v_image_count,
        'executionTime', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER || 'ms'
      ),
      'message', format('產品建立成功，包含 %s 張圖片', v_image_count)
    );

  EXCEPTION WHEN OTHERS THEN
    -- ========================================
    -- 錯誤處理
    -- ========================================
    RAISE WARNING '建立產品失敗: % (SQLSTATE: %)', SQLERRM, SQLSTATE;

    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'error_details', jsonb_build_object(
        'hint', CASE
          WHEN SQLSTATE = '23505' THEN '產品 ID 或 SKU 已存在，請使用不同的值'
          WHEN SQLSTATE = '23503' THEN '關聯資料不存在，請檢查外鍵引用'
          WHEN SQLSTATE = '23502' THEN '缺少必填欄位'
          WHEN SQLSTATE = '22P02' THEN '資料格式錯誤'
          ELSE '請檢查輸入資料格式'
        END
      )
    );
  END;
END;
$$;

-- 2. 賦予執行權限
GRANT EXECUTE ON FUNCTION create_product_with_images TO authenticated;

-- 3. 新增函數註解
COMMENT ON FUNCTION create_product_with_images IS '
事務式產品建立函數

功能：
  在單一事務中建立產品和相關圖片，確保資料一致性。

參數：
  - product_data (JSONB): 產品資料
    必填欄位：name, description, category, price
    選填欄位：id, priceUnit, unitQuantity, inventory, sku, isActive, isOnSale, originalPrice, saleEndDate

  - images_data (JSONB): 圖片資料陣列，預設為空陣列
    每個圖片物件包含：url, path, alt, position, size, width, height, file_size

返回值 (JSONB):
  {
    "success": true/false,
    "data": {
      "product": { 產品完整資料 },
      "images": [ 圖片陣列 ]
    },
    "meta": {
      "productId": "UUID",
      "imageCount": 3,
      "executionTime": "15ms"
    },
    "message": "產品建立成功，包含 3 張圖片"
  }

使用範例：
  SELECT create_product_with_images(
    ''{"name": "有機茄子", "description": "新鮮有機", "category": "蔬菜", "price": 50}''::jsonb,
    ''[{"url": "https://...", "path": "products/...", "position": 0}]''::jsonb
  );

錯誤碼：
  - 23505: 產品 ID 或 SKU 重複
  - 23503: 外鍵引用錯誤
  - 23502: 缺少必填欄位
  - 22P02: 資料格式錯誤
';

-- 4. 建立測試函數
CREATE OR REPLACE FUNCTION test_create_product_with_images()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  test_product_id UUID := gen_random_uuid();
  test_result JSONB;
  all_tests_passed BOOLEAN := TRUE;
  test_output TEXT := '';
BEGIN
  test_output := test_output || E'========================================\n';
  test_output := test_output || E'測試：事務式產品建立函數\n';
  test_output := test_output || E'========================================\n\n';

  -- 測試 1：建立產品（無圖片）
  BEGIN
    test_output := test_output || E'測試 1: 建立產品（無圖片）...\n';

    test_result := create_product_with_images(
      jsonb_build_object(
        'id', test_product_id,
        'name', '測試產品 1',
        'description', '測試描述',
        'category', '測試分類',
        'price', 100,
        'inventory', 50
      )
    );

    IF test_result->>'success' = 'true' THEN
      test_output := test_output || E'✓ 測試 1 通過\n';
      DELETE FROM products WHERE id = test_product_id;
    ELSE
      test_output := test_output || E'✗ 測試 1 失敗: ' || (test_result->>'error') || E'\n';
      all_tests_passed := FALSE;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    test_output := test_output || E'✗ 測試 1 異常: ' || SQLERRM || E'\n';
    all_tests_passed := FALSE;
  END;

  test_output := test_output || E'\n';

  -- 測試 2：建立產品（含圖片）
  BEGIN
    test_product_id := gen_random_uuid();
    test_output := test_output || E'測試 2: 建立產品（含圖片）...\n';

    test_result := create_product_with_images(
      jsonb_build_object(
        'id', test_product_id,
        'name', '測試產品 2',
        'description', '測試描述',
        'category', '測試分類',
        'price', 200
      ),
      jsonb_build_array(
        jsonb_build_object(
          'url', 'https://test.com/image1.jpg',
          'path', 'test/image1.jpg',
          'alt', '測試圖片 1',
          'position', 0
        ),
        jsonb_build_object(
          'url', 'https://test.com/image2.jpg',
          'path', 'test/image2.jpg',
          'alt', '測試圖片 2',
          'position', 1
        )
      )
    );

    IF test_result->>'success' = 'true' AND
       (test_result->'data'->'images'->0->>'url') = 'https://test.com/image1.jpg' THEN
      test_output := test_output || E'✓ 測試 2 通過\n';
      DELETE FROM products WHERE id = test_product_id;
    ELSE
      test_output := test_output || E'✗ 測試 2 失敗\n';
      all_tests_passed := FALSE;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    test_output := test_output || E'✗ 測試 2 異常: ' || SQLERRM || E'\n';
    all_tests_passed := FALSE;
  END;

  test_output := test_output || E'\n';

  -- 測試 3：錯誤處理（缺少必填欄位）
  BEGIN
    test_output := test_output || E'測試 3: 錯誤處理（缺少必填欄位）...\n';

    test_result := create_product_with_images(
      jsonb_build_object(
        'name', '測試產品 3'
        -- 故意缺少 description, category, price
      )
    );

    IF test_result->>'success' = 'false' THEN
      test_output := test_output || E'✓ 測試 3 通過（正確捕捉錯誤）\n';
    ELSE
      test_output := test_output || E'✗ 測試 3 失敗（應該回傳錯誤）\n';
      all_tests_passed := FALSE;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    test_output := test_output || E'✗ 測試 3 異常: ' || SQLERRM || E'\n';
    all_tests_passed := FALSE;
  END;

  test_output := test_output || E'\n';
  test_output := test_output || E'========================================\n';

  IF all_tests_passed THEN
    test_output := test_output || E'🎉 所有測試通過！\n';
  ELSE
    test_output := test_output || E'⚠️ 部分測試失敗，請檢查錯誤訊息\n';
  END IF;

  test_output := test_output || E'========================================\n';

  RETURN test_output;
END;
$$;

-- 5. 執行測試
SELECT test_create_product_with_images();

-- 6. 完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 事務式產品建立函數已建立！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '函數名稱: create_product_with_images';
  RAISE NOTICE '執行權限: authenticated 角色';
  RAISE NOTICE '';
  RAISE NOTICE '使用範例：';
  RAISE NOTICE '';
  RAISE NOTICE 'SELECT create_product_with_images(';
  RAISE NOTICE '  ''{"name": "有機茄子", "description": "新鮮", "category": "蔬菜", "price": 50}''::jsonb,';
  RAISE NOTICE '  ''[{"url": "https://...", "path": "products/..."}]''::jsonb';
  RAISE NOTICE ');';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '請建立 API 端點 /api/admin/products/create-with-images';
  RAISE NOTICE '========================================';
END $$;