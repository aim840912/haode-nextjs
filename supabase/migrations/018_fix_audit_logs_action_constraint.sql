-- ========================================
-- 修復 audit_logs 表的 action 和 resource_type 約束
-- ========================================
-- 修復問題：admin 認證失敗時審計日誌記錄失敗
-- 日期：2025-08-27
-- 解決：audit_logs 表的約束缺少程式碼中使用的值，導致插入失敗

-- ========================================
-- 1. 修復 action 約束 - 新增 'unauthorized_access'
-- ========================================

-- 移除現有的 action 檢查約束
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- 新增更完整的 action 約束，包含：
-- 原有的操作：view, view_list, create, update, delete, export, status_change
-- 新增安全相關：unauthorized_access
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_action_check 
CHECK (action IN (
  -- 基本操作
  'view',                    -- 查看單一資源
  'view_list',              -- 查看資源列表
  'create',                 -- 建立資源
  'update',                 -- 更新資源
  'delete',                 -- 刪除資源
  'export',                 -- 匯出資料
  'status_change',          -- 狀態變更
  -- 安全相關操作
  'unauthorized_access'     -- 未授權存取嘗試
));

-- ========================================
-- 2. 修復 resource_type 約束 - 新增 'admin_api'
-- ========================================

-- 移除現有的 resource_type 檢查約束
ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_resource_type_check;

-- 新增更完整的 resource_type 約束，包含：
-- 業務相關：inquiry, inquiry_item, customer_data  
-- 系統管理：security_policy, system_config, migration, user_management, data_maintenance
-- 新增 API 相關：admin_api
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_resource_type_check
CHECK (resource_type IN (
  -- 業務相關操作
  'inquiry',                -- 詢價單
  'inquiry_item',           -- 詢價項目
  'customer_data',          -- 客戶資料
  -- 系統管理操作
  'security_policy',        -- 安全政策相關操作
  'system_config',          -- 系統設定相關操作
  'migration',             -- 資料庫遷移操作
  'user_management',       -- 用戶管理操作
  'data_maintenance',      -- 資料維護操作
  -- API 相關操作
  'admin_api'              -- Admin API 相關操作
));

-- ========================================
-- 3. 建立註解說明
-- ========================================

COMMENT ON CONSTRAINT audit_logs_action_check ON audit_logs IS 
'限制 action 欄位只能使用預定義的操作類型，包含基本操作和安全相關操作';

COMMENT ON CONSTRAINT audit_logs_resource_type_check ON audit_logs IS 
'限制 resource_type 欄位只能使用預定義的資源類型，包含業務操作、系統管理操作和 API 操作';

-- ========================================
-- 4. 測試新約束（記錄此次修改到審計日誌）
-- ========================================

-- 測試新的 action 和 resource_type 是否正常工作
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
  'unauthorized_access',    -- 測試新的 action
  'admin_api',             -- 測試新的 resource_type
  'audit_logs_constraint_018',
  jsonb_build_object(
    'table', 'audit_logs',
    'operation', 'constraint_update',
    'constraint_names', ARRAY['audit_logs_action_check', 'audit_logs_resource_type_check']
  ),
  jsonb_build_object(
    'migration_file', '018_fix_audit_logs_action_constraint.sql',
    'description', 'Fixed audit_logs constraints to support unauthorized_access action and admin_api resource_type',
    'new_action_types', ARRAY['unauthorized_access'],
    'new_resource_types', ARRAY['admin_api'],
    'executed_at', NOW()
  )
);

-- ========================================
-- 完成通知
-- ========================================

-- 這個 migration 解決了以下問題：
-- ✅ 新增了 'unauthorized_access' action 類型，支援記錄認證失敗事件
-- ✅ 新增了 'admin_api' resource_type，支援記錄 Admin API 相關操作
-- ✅ 保持向後兼容性（原有類型仍然支援）
-- ✅ 修復了 admin 認證失敗時審計日誌記錄失敗的問題

-- 注意事項：
-- - 此 migration 執行後，admin 認證失敗時應該能正常記錄審計日誌
-- - 新增產品功能應該能正常運作，不會因為審計日誌記錄失敗而中斷
-- - 提供了更完整的安全事件追蹤能力