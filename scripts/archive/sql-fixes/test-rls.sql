-- ========================================
-- RLS 政策測試腳本
-- ========================================
-- 用於驗證 013_restore_rls_security.sql 的修復效果
-- 日期：2025-08-25

-- ========================================
-- 測試說明
-- ========================================

-- 此腳本需要在 Supabase SQL Editor 中執行，或使用 psql 連接到資料庫
-- 
-- 執行前準備：
-- 1. 確保已套用 013_restore_rls_security.sql migration
-- 2. 確保資料庫中有測試用戶和管理員帳號
-- 3. 記錄測試用戶的 UUID 以供測試使用

-- ========================================
-- 1. 檢查 RLS 狀態
-- ========================================

-- 檢查 profiles 表的 RLS 是否啟用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_interests');

-- 列出 profiles 表的所有政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 列出 user_interests 表的所有政策  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_interests'
ORDER BY policyname;

-- ========================================
-- 2. 測試資料準備
-- ========================================

-- 注意：以下測試需要替換為實際的用戶 UUID
-- 可以從 auth.users 表或應用程式中獲得

-- 查看現有用戶（管理員可見）
SELECT id, name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- 3. 模擬不同角色的測試
-- ========================================

-- 以下測試需要通過應用程式進行，因為需要實際的認證上下文
-- 這裡提供測試案例說明：

/*
測試案例 1: 普通用戶存取自己的資料
前提：以普通用戶身份登入
期望：能查看和修改自己的 profile，不能查看他人資料

-- 應該成功
SELECT * FROM profiles WHERE id = auth.uid();

-- 應該失敗或只返回自己的資料
SELECT * FROM profiles;

-- 應該成功
UPDATE profiles SET name = 'Updated Name' WHERE id = auth.uid();

-- 應該失敗
UPDATE profiles SET name = 'Hacked' WHERE id != auth.uid();
*/

/*
測試案例 2: 管理員存取所有資料
前提：以管理員身份登入
期望：能查看和修改所有用戶的 profile

-- 應該成功，返回所有用戶
SELECT * FROM profiles;

-- 應該成功
UPDATE profiles SET name = 'Admin Updated' WHERE id = '任意用戶ID';
*/

/*
測試案例 3: 用戶興趣管理
前提：以普通用戶身份登入
期望：只能管理自己的興趣

-- 應該成功
INSERT INTO user_interests (user_id, interest_name) VALUES (auth.uid(), 'Test Interest');

-- 應該成功，只看到自己的興趣
SELECT * FROM user_interests WHERE user_id = auth.uid();

-- 應該失敗或看不到他人興趣
SELECT * FROM user_interests WHERE user_id != auth.uid();

-- 應該失敗
INSERT INTO user_interests (user_id, interest_name) VALUES ('他人ID', 'Malicious Interest');
*/

/*
測試案例 4: 新用戶註冊自動創建 profile
前提：通過應用程式註冊新用戶
期望：自動創建對應的 profile 記錄

-- 註冊後應該能查詢到新的 profile
SELECT * FROM profiles WHERE id = '新用戶ID';
*/

-- ========================================
-- 4. 性能測試查詢
-- ========================================

-- 測試 RLS 政策對查詢性能的影響
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM profiles WHERE id = '測試用戶ID';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM user_interests WHERE user_id = '測試用戶ID';

-- ========================================
-- 5. 政策測試輔助查詢
-- ========================================

-- 檢查當前認證狀態（需要在已認證的環境中執行）
/*
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;
*/

-- 檢查用戶角色
/*
SELECT id, name, role 
FROM profiles 
WHERE id = auth.uid();
*/

-- ========================================
-- 6. 常見問題排查
-- ========================================

-- 如果遇到 "permission denied for table" 錯誤：
-- 檢查基本表權限
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasinsert,
  hasselect,
  hasupdate,
  hasdelete
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_interests');

-- 檢查角色權限
SELECT 
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'user_interests')
AND grantee = 'authenticated';

-- 如果遇到 "new row violates row-level security policy" 錯誤：
-- 檢查 INSERT 政策的 WITH CHECK 條件
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_interests')
AND cmd = 'INSERT';

-- ========================================
-- 7. 清理測試資料（可選）
-- ========================================

-- 清理測試過程中創建的測試資料
-- 注意：只在測試環境執行
/*
DELETE FROM user_interests WHERE interest_name = 'Test Interest';
*/

-- ========================================
-- 測試完成檢查清單
-- ========================================

/*
完成以下檢查項目：

□ RLS 已在兩個表上正確啟用
□ 普通用戶只能看到自己的 profile
□ 普通用戶可以更新自己的 profile  
□ 普通用戶不能查看他人的 profile
□ 管理員可以查看所有用戶的 profile
□ 管理員可以更新所有用戶的 profile
□ 普通用戶只能管理自己的 interests
□ 普通用戶不能插入他人的 interests
□ 新用戶註冊時能自動創建 profile
□ 查詢性能在可接受範圍內
□ 沒有出現權限相關錯誤
□ 應用程式功能正常運作

如果所有項目都通過，則 RLS 修復成功！
*/