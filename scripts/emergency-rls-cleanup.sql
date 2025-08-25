-- ========================================
-- 緊急 RLS 清理腳本
-- ========================================
-- 當出現無限遞迴錯誤時，立即執行此腳本來暫時解除問題
-- 注意：此腳本會暫時停用 RLS，僅用於緊急情況

-- ========================================
-- 1. 立即停用 RLS 以解除遞迴問題
-- ========================================

-- 停用問題表格的 RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. 刪除造成遞迴的政策
-- ========================================

-- 刪除有問題的管理員政策
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_interests" ON user_interests;

-- ========================================
-- 3. 暫時建立基本政策（如果需要）
-- ========================================

-- 如果需要暫時的基本存取控制，取消註解以下政策
-- 注意：這些政策沒有管理員檢查，相對安全

-- 重新啟用 RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- 基本的用戶自我存取政策
-- CREATE POLICY "temp_users_own_profile" ON profiles
--   FOR ALL USING (auth.uid() = id);

-- CREATE POLICY "temp_users_own_interests" ON user_interests
--   FOR ALL USING (user_id = auth.uid());

-- ========================================
-- 完成提示
-- ========================================

-- 執行此腳本後：
-- 1. RLS 已停用，系統應該恢復正常運作
-- 2. 但是沒有存取控制，所有 authenticated 用戶都可以存取所有資料
-- 3. 請儘快執行 015_fix_rls_recursion.sql 來恢復正確的安全控制

SELECT 'RLS 緊急清理完成。請立即執行 015_fix_rls_recursion.sql 來恢復安全控制。' AS status;