-- =============================================
-- 建立 moments storage bucket RLS 政策
-- 請在 Supabase SQL Editor 中執行
-- =============================================

-- 公開讀取政策
CREATE POLICY "公開讀取 moments 檔案" ON storage.objects
FOR SELECT USING (bucket_id = 'moments');

-- 管理員上傳政策
CREATE POLICY "管理員上傳 moments 檔案" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
);

-- 管理員更新政策
CREATE POLICY "管理員更新 moments 檔案" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
)
WITH CHECK (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
);

-- 管理員刪除政策
CREATE POLICY "管理員刪除 moments 檔案" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
);

-- 完成提示
SELECT 'moments storage 政策設定完成！' as message;