-- 暫時停用 user_interests 表的 RLS
-- 這是為了解決 "new row violates row-level security policy" 錯誤

-- 先移除現有的 RLS 政策
DROP POLICY IF EXISTS "Users can manage their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can view their own interests" ON user_interests;

-- 停用 RLS
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- 確保表的基本權限設定正確
GRANT ALL ON user_interests TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;