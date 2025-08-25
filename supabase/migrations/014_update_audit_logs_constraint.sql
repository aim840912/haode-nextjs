-- ========================================
-- 更新 audit_logs 表的 resource_type 約束
-- ========================================
-- 修復 013_restore_rls_security.sql 執行錯誤
-- 日期：2025-08-25
-- 解決：audit_logs 表的 resource_type 約束過於限制，無法記錄系統操作

-- ========================================
-- 1. 移除現有的約束
-- ========================================

-- 移除舊的 resource_type 檢查約束
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_resource_type_check;

-- ========================================
-- 2. 建立新的約束，支援更多操作類型
-- ========================================

-- 新增更完整的 resource_type 約束，支援：
-- - 原有的業務操作：inquiry, inquiry_item, customer_data
-- - 新增系統操作：security_policy, system_config, migration, user_management
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_resource_type_check 
CHECK (resource_type IN (
  -- 業務相關操作
  'inquiry', 
  'inquiry_item', 
  'customer_data',
  -- 系統管理操作
  'security_policy',     -- 安全政策相關操作
  'system_config',       -- 系統設定相關操作
  'migration',          -- 資料庫遷移操作
  'user_management',    -- 用戶管理操作
  'data_maintenance'    -- 資料維護操作
));

-- ========================================
-- 3. 建立註解說明
-- ========================================

COMMENT ON CONSTRAINT audit_logs_resource_type_check ON audit_logs IS 
'限制 resource_type 欄位只能使用預定義的操作類型，包含業務操作和系統管理操作';

-- ========================================
-- 4. 記錄此次修改到審計日誌（測試新約束）
-- ========================================

-- 測試新約束是否正常工作
INSERT INTO audit_logs (
  user_email, 
  user_name,
  user_role,
  action, 
  resource_type, 
  resource_id, 
  resource_details,
  metadata
) VALUES (
  'system',
  'System Migration',
  'system',
  'update',
  'system_config',  -- 使用新的 resource_type
  'audit_logs_constraint_014',
  jsonb_build_object(
    'table', 'audit_logs',
    'operation', 'constraint_update',
    'constraint_name', 'audit_logs_resource_type_check'
  ),
  jsonb_build_object(
    'migration_file', '014_update_audit_logs_constraint.sql',
    'description', 'Updated audit_logs resource_type constraint to support system operations',
    'old_types', ARRAY['inquiry', 'inquiry_item', 'customer_data'],
    'new_types', ARRAY['inquiry', 'inquiry_item', 'customer_data', 'security_policy', 'system_config', 'migration', 'user_management', 'data_maintenance'],
    'executed_at', NOW()
  )
);

-- ========================================
-- 完成通知
-- ========================================

-- 這個 migration 解決了以下問題：
-- ✅ 擴展了 audit_logs 表支援的 resource_type 類型
-- ✅ 支援記錄系統管理操作（security_policy, system_config 等）
-- ✅ 保持向後兼容性（原有類型仍然支援）
-- ✅ 為 013_restore_rls_security.sql 的執行掃除障礙

-- 注意事項：
-- - 此 migration 執行後，013_restore_rls_security.sql 應該能正常執行
-- - 新的約束支援更多系統操作類型，便於未來的審計追蹤