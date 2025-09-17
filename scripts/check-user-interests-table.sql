-- ========================================
-- 檢查 user_interests 表格狀態
-- ========================================
-- 🎯 目標：檢查 user_interests 表格是否存在及其結構
-- 📅 建立日期：2025-09-18

-- 檢查 1：確認 user_interests 表格是否存在
SELECT
    EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_interests'
    ) AS table_exists;

-- 檢查 2：如果表格存在，檢查其結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_interests'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 檢查 3：檢查現有的索引
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_interests'
ORDER BY indexname;

-- 檢查 4：檢查 RLS 政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_interests'
ORDER BY policyname;

-- 檢查 5：檢查表格權限
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'user_interests'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 檢查 6：測試基本查詢權限（如果表格存在）
-- 這個查詢應該會成功或給出具體的權限錯誤
SELECT COUNT(*) as record_count FROM user_interests;