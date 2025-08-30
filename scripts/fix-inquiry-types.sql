-- 修復詢價單類型錯誤顯示問題
-- 此腳本會將所有包含產品項目的詢價單更新為 'product' 類型
-- 執行時間: 2025-08-30

BEGIN;

-- 顯示修復前的統計資訊
DO $$
DECLARE
    total_inquiries INTEGER;
    product_inquiries INTEGER;
    farm_tour_inquiries INTEGER;
    null_type_inquiries INTEGER;
    inquiries_with_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_inquiries FROM inquiries;
    SELECT COUNT(*) INTO product_inquiries FROM inquiries WHERE inquiry_type = 'product';
    SELECT COUNT(*) INTO farm_tour_inquiries FROM inquiries WHERE inquiry_type = 'farm_tour';
    SELECT COUNT(*) INTO null_type_inquiries FROM inquiries WHERE inquiry_type IS NULL;
    SELECT COUNT(DISTINCT inquiry_id) INTO inquiries_with_items FROM inquiry_items;
    
    RAISE NOTICE '=== 修復前統計 ===';
    RAISE NOTICE '總詢價單數量: %', total_inquiries;
    RAISE NOTICE '產品詢價單數量: %', product_inquiries;
    RAISE NOTICE '農場參觀數量: %', farm_tour_inquiries;
    RAISE NOTICE 'NULL 類型數量: %', null_type_inquiries;
    RAISE NOTICE '含有產品項目的詢價單: %', inquiries_with_items;
END $$;

-- 1. 將所有包含產品項目的詢價單更新為 'product' 類型
UPDATE inquiries 
SET inquiry_type = 'product', 
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT inquiry_id 
    FROM inquiry_items
) 
AND (inquiry_type IS NULL OR inquiry_type != 'product');

-- 2. 針對沒有產品項目但 notes 中包含農場參觀資料的詢價單，設定為 'farm_tour'
UPDATE inquiries 
SET inquiry_type = 'farm_tour',
    updated_at = NOW()
WHERE notes LIKE 'FARM_TOUR_DATA:%'
AND inquiry_type IS NULL;

-- 3. 對於仍然是 NULL 的詢價單，根據 STK 編號格式判斷是否為產品詢價
-- STK 開頭的編號通常是產品庫存查詢
UPDATE inquiries 
SET inquiry_type = 'product',
    updated_at = NOW()
WHERE inquiry_type IS NULL
AND id IN (
    -- 查找創建時間格式化後符合 STK 前綴的詢價單
    SELECT i.id 
    FROM inquiries i
    WHERE 'STK' || TO_CHAR(i.created_at, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(i.id::text FROM 1 FOR 8)) 
          LIKE 'STK%'
);

-- 4. 其餘的 NULL 類型詢價單預設為 'product'
UPDATE inquiries 
SET inquiry_type = 'product',
    updated_at = NOW()
WHERE inquiry_type IS NULL;

-- 顯示修復後的統計資訊
DO $$
DECLARE
    total_inquiries INTEGER;
    product_inquiries INTEGER;
    farm_tour_inquiries INTEGER;
    null_type_inquiries INTEGER;
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_inquiries FROM inquiries;
    SELECT COUNT(*) INTO product_inquiries FROM inquiries WHERE inquiry_type = 'product';
    SELECT COUNT(*) INTO farm_tour_inquiries FROM inquiries WHERE inquiry_type = 'farm_tour';
    SELECT COUNT(*) INTO null_type_inquiries FROM inquiries WHERE inquiry_type IS NULL;
    
    RAISE NOTICE '=== 修復後統計 ===';
    RAISE NOTICE '總詢價單數量: %', total_inquiries;
    RAISE NOTICE '產品詢價單數量: %', product_inquiries;
    RAISE NOTICE '農場參觀數量: %', farm_tour_inquiries;
    RAISE NOTICE 'NULL 類型數量: %', null_type_inquiries;
    RAISE NOTICE '修復完成！';
END $$;

-- 驗證修復結果：顯示問題詢價單的修復狀態
SELECT 
    i.id,
    'STK' || TO_CHAR(i.created_at, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(i.id::text FROM 1 FOR 8)) as inquiry_number,
    i.inquiry_type,
    i.customer_name,
    COUNT(ii.id) as items_count,
    i.created_at,
    i.updated_at
FROM inquiries i
LEFT JOIN inquiry_items ii ON i.id = ii.inquiry_id
WHERE i.id = '0ed453f8-0961-4b68-9033-fc5cfbde3be7'
   OR i.customer_email = 'b@gmail.com'
   OR i.customer_name = 'b'
GROUP BY i.id, i.inquiry_type, i.customer_name, i.created_at, i.updated_at
ORDER BY i.created_at DESC;

COMMIT;