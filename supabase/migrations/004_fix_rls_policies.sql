-- 修復 profiles 表的 RLS 政策無限遞迴問題

-- 刪除有問題的政策
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 重新建立正確的政策

-- 1. 使用者可以查看自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. 使用者可以更新自己的 profile  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. 系統可以插入新的 profile（給 trigger 使用）
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- 4. 簡化的管理員政策（避免遞迴）
-- 注意：這個政策暫時允許所有已認證用戶查看 profiles
-- 在生產環境中，你可能需要更嚴格的控制
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 如果你需要更嚴格的管理員控制，可以使用以下替代方案：
-- CREATE POLICY "Admin users can view all profiles" ON profiles
--   FOR SELECT USING (
--     auth.uid() IN (
--       SELECT au.id FROM auth.users au
--       JOIN profiles p ON au.id = p.id
--       WHERE p.role = 'admin'
--     )
--   );

-- 確保 RLS 仍然啟用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;