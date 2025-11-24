-- ========================================
-- 修復事務式產品建立函數 - 移除 SKU 欄位
-- ========================================
-- 目的：移除不存在的 sku 欄位，使函數與實際資料庫 schema 一致
-- 執行方式：在 Supabase Dashboard > SQL Editor 中執行
-- ========================================

-- 重新建立函數（移除 sku 欄位）
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
    -- 步驟 1: 插入產品（移除 sku 欄位）
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
    -- 步驟 3: 查詢完整產品資料（移除 sku 欄位）
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
          WHEN SQLSTATE = '23505' THEN '產品 ID 重複，請使用不同的值'
          WHEN SQLSTATE = '23503' THEN '關聯資料不存在，請檢查外鍵引用'
          WHEN SQLSTATE = '23502' THEN '缺少必填欄位'
          WHEN SQLSTATE = '22P02' THEN '資料格式錯誤'
          WHEN SQLSTATE = '42703' THEN '資料庫欄位不存在'
          ELSE '請檢查輸入資料格式'
        END
      )
    );
  END;
END;
$$;

-- 完成訊息
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 函數已更新：移除 SKU 欄位';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '變更內容：';
  RAISE NOTICE '  ✓ INSERT 語句移除 sku 欄位';
  RAISE NOTICE '  ✓ SELECT 語句移除 sku 欄位';
  RAISE NOTICE '  ✓ 新增 42703 錯誤碼處理（欄位不存在）';
  RAISE NOTICE '';
  RAISE NOTICE '現在可以正常建立產品了！';
  RAISE NOTICE '========================================';
END $$;