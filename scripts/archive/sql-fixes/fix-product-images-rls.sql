-- ========================================
-- 修復 product_images RLS 策略以支援 Service Role
-- ========================================
-- 問題：當前 RLS 策略阻擋了使用 service_role key 的操作
-- 原因：auth.jwt() ->> 'role' = 'admin' 無法識別 service_role
-- 解決方案：移除舊策略，建立新的允許 service_role 的策略
-- ========================================

-- 1. 移除舊的 RLS 策略
DROP POLICY IF EXISTS "管理員可新增產品圖片" ON product_images;
DROP POLICY IF EXISTS "管理員可更新產品圖片" ON product_images;
DROP POLICY IF EXISTS "管理員可刪除產品圖片" ON product_images;

-- 2. 建立新的 RLS 策略（允許 authenticated 用戶且 role 為 admin，或使用 service_role）
-- INSERT 策略
CREATE POLICY "Service role or admin can insert product images"
  ON product_images
  FOR INSERT
  WITH CHECK (
    -- 允許 service_role（繞過檢查）
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- 或者是已認證的 admin 用戶
    (
      auth.role() = 'authenticated'
      AND auth.jwt() ->> 'role' = 'admin'
    )
  );

-- UPDATE 策略
CREATE POLICY "Service role or admin can update product images"
  ON product_images
  FOR UPDATE
  USING (
    -- 允許 service_role（繞過檢查）
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- 或者是已認證的 admin 用戶
    (
      auth.role() = 'authenticated'
      AND auth.jwt() ->> 'role' = 'admin'
    )
  );

-- DELETE 策略
CREATE POLICY "Service role or admin can delete product images"
  ON product_images
  FOR DELETE
  USING (
    -- 允許 service_role（繞過檢查）
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- 或者是已認證的 admin 用戶
    (
      auth.role() = 'authenticated'
      AND auth.jwt() ->> 'role' = 'admin'
    )
  );

-- 3. 驗證策略
DO $$
BEGIN
  RAISE NOTICE '✅ product_images RLS 策略已更新！';
  RAISE NOTICE '🔑 現在支援：';
  RAISE NOTICE '  1. Service Role Key（後端服務）';
  RAISE NOTICE '  2. Admin 用戶（通過 auth.jwt()）';
  RAISE NOTICE '📖 READ 權限：所有人可讀取（公開）';
  RAISE NOTICE '✏️ WRITE 權限：Service Role 或 Admin 用戶';
END $$;

-- 4. 測試策略（可選）
-- 執行以下測試以確保策略正常工作：
-- SELECT * FROM product_images LIMIT 1;  -- 應該可以讀取（公開策略）