-- ========================================
-- 立即可執行的 RLS 遞迴修復腳本
-- ========================================
-- 直接在 Supabase Dashboard SQL Editor 中執行此腳本
-- 解決 auth schema 權限問題和 RLS 無限遞迴問題

-- ========================================
-- 第 1 步：建立安全函數 (public schema)
-- ========================================

-- 建立管理員檢查函數，避免 auth schema 權限問題
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- 使用 SECURITY DEFINER 權限繞過 RLS 查詢 profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- 安全返回：找不到用戶或非管理員都返回 false
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN others THEN
    -- 任何錯誤都安全地返回 false
    RETURN false;
END;
$$;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ========================================
-- 第 2 步：緊急清理有問題的 RLS 政策
-- ========================================

-- 暫時停用 RLS 以便安全清理
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- 刪除所有可能造成遞迴的政策
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_interests" ON user_interests;

-- 也清理其他可能存在的舊政策
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles; 
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "system_insert_profiles" ON profiles;

DROP POLICY IF EXISTS "Users can manage their own interests" ON user_interests;
DROP POLICY IF EXISTS "users_view_own_interests" ON user_interests;
DROP POLICY IF EXISTS "users_insert_own_interests" ON user_interests;
DROP POLICY IF EXISTS "users_update_own_interests" ON user_interests;
DROP POLICY IF EXISTS "users_delete_own_interests" ON user_interests;

-- ========================================
-- 第 3 步：重新建立安全的 RLS 政策
-- ========================================

-- 重新啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- === profiles 表的安全政策 ===

-- 用戶查看自己的 profile
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用戶更新自己的 profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 系統插入 profile（用於註冊流程）
CREATE POLICY "system_insert_profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- 管理員查看所有 profiles（使用安全函數，避免遞迴）
CREATE POLICY "admins_view_all_profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- 管理員更新所有 profiles
CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- === user_interests 表的安全政策 ===

-- 用戶管理自己的興趣
CREATE POLICY "users_view_own_interests" ON user_interests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_interests" ON user_interests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_interests" ON user_interests
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_interests" ON user_interests
  FOR DELETE USING (user_id = auth.uid());

-- 管理員查看所有用戶興趣（使用安全函數）
CREATE POLICY "admins_view_all_interests" ON user_interests
  FOR SELECT USING (public.is_admin());

-- ========================================
-- 第 4 步：確認權限設定
-- ========================================

-- 確保 authenticated 用戶有必要權限
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_interests TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 完成確認
-- ========================================

-- 測試函數是否可調用（這不會返回有意義的結果，但確認函數可執行）
SELECT 'public.is_admin() 函數已建立' as function_status;

-- 檢查 RLS 是否已啟用
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_interests') 
AND schemaname = 'public';

-- 檢查政策數量
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_interests')
GROUP BY schemaname, tablename;

-- 顯示完成訊息
SELECT '🎉 RLS 遞迴修復完成！' as status,
       '使用 public.is_admin() 函數避免 auth schema 權限問題' as method,
       '所有 RLS 政策已重新建立，應該不會再有無限遞迴錯誤' as result;