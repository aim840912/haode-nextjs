-- 臨時解決方案：暫時關閉 profiles 表的 RLS
-- 這是為了解決無限遞迴問題，等系統穩定後可以重新啟用

-- 刪除所有 profiles 表的政策
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;

-- 暫時關閉 RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 注意：這會讓所有已認證用戶都能存取 profiles 表
-- 在開發階段這是可以接受的，但在生產環境需要重新啟用 RLS

-- 如果之後想重新啟用 RLS，可以執行：
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- 然後重新建立適當的政策