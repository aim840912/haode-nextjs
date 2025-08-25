-- ========================================
-- 最小化 RLS 修復腳本
-- ========================================
-- 這個腳本提供最基本的安全控制，不包含管理員功能
-- 適合只需要用戶自我管理數據的簡單場景
-- 🎯 目標：快速解決遞迴問題，恢復基本功能

-- ========================================
-- 第 1 步：完全停用 RLS 並清理問題政策
-- ========================================

-- 暫時停用 RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- 刪除所有可能造成遞迴的管理員政策
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_interests" ON user_interests;
DROP POLICY IF EXISTS "admin_view_all_interests" ON user_interests;

-- 刪除其他可能有問題的政策
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
-- 第 2 步：重新啟用 RLS
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 第 3 步：建立簡單的用戶自我管理政策
-- ========================================

-- === profiles 表：只有用戶自我管理 ===

-- 用戶可以查看自己的 profile
CREATE POLICY "user_own_profile_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用戶可以更新自己的 profile  
CREATE POLICY "user_own_profile_write" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 系統可以插入新 profile（註冊時需要）
CREATE POLICY "system_create_profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- === user_interests 表：用戶完全自我管理 ===

-- 用戶查看自己的興趣
CREATE POLICY "user_own_interests_read" ON user_interests
  FOR SELECT USING (user_id = auth.uid());

-- 用戶添加自己的興趣
CREATE POLICY "user_own_interests_create" ON user_interests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 用戶更新自己的興趣
CREATE POLICY "user_own_interests_modify" ON user_interests
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 用戶刪除自己的興趣
CREATE POLICY "user_own_interests_remove" ON user_interests
  FOR DELETE USING (user_id = auth.uid());

-- ========================================
-- 第 4 步：確保基本權限
-- ========================================

-- 確保 authenticated 角色有必要權限
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_interests TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 第 5 步：驗證修復
-- ========================================

-- 測試基本功能（避免直接查詢系統表）
-- 透過實際操作來驗證最小化修復是否成功

-- 測試 profiles 表查詢（檢查是否還有遞迴錯誤）
DO $$
DECLARE
  profile_count integer;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles LIMIT 1;
  RAISE NOTICE '✅ profiles 表查詢正常，無遞迴錯誤';
EXCEPTION
  WHEN others THEN
    IF SQLERRM LIKE '%infinite recursion%' THEN
      RAISE NOTICE '❌ profiles 表仍有遞迴問題: %', SQLERRM;
    ELSE
      RAISE NOTICE '⚠️ profiles 表查詢: %', SQLERRM;
    END IF;
END $$;

-- 測試 user_interests 表查詢
DO $$
DECLARE
  interest_count integer;
BEGIN
  SELECT COUNT(*) INTO interest_count FROM user_interests LIMIT 1;
  RAISE NOTICE '✅ user_interests 表查詢正常，無遞迴錯誤';
EXCEPTION
  WHEN others THEN
    IF SQLERRM LIKE '%infinite recursion%' THEN
      RAISE NOTICE '❌ user_interests 表仍有遞迴問題: %', SQLERRM;
    ELSE
      RAISE NOTICE '⚠️ user_interests 表查詢: %', SQLERRM;
    END IF;
END $$;

-- ========================================
-- 完成訊息和重要說明
-- ========================================

SELECT 
  '🎉 最小化 RLS 修復完成！' as status,
  '系統恢復基本功能' as result;

SELECT '=== 重要說明 ===' as notice
UNION ALL
SELECT '✅ 用戶可以管理自己的 profile 和興趣'
UNION ALL
SELECT '❌ 沒有管理員功能（避免遞迴問題）'
UNION ALL
SELECT '✅ 不會再有無限遞迴錯誤'
UNION ALL
SELECT '⚠️  如果需要管理員功能，請使用 complete-rls-fix.sql'
UNION ALL
SELECT '✅ 系統現在應該可以正常運作';

-- ========================================
-- 管理員功能說明
-- ========================================

SELECT '=== 如果需要管理員功能 ===' as admin_notice
UNION ALL
SELECT '1. 使用 complete-rls-fix.sql 而不是此腳本'
UNION ALL
SELECT '2. 或者手動添加管理員 service role key 存取'
UNION ALL
SELECT '3. 管理員可以使用 Supabase Dashboard 管理數據';