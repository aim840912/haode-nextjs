-- 建立審計日誌系統
-- Migration: 010_create_audit_logs.sql

-- 建立審計日誌表
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'view_list', 'create', 'update', 'delete', 'export', 'status_change')),
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('inquiry', 'inquiry_item', 'customer_data')),
  resource_id VARCHAR(255) NOT NULL,
  resource_details JSONB DEFAULT '{}',
  previous_data JSONB DEFAULT '{}', -- 儲存更新前的資料（用於變更追蹤）
  new_data JSONB DEFAULT '{}', -- 儲存更新後的資料
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}', -- 額外的上下文資訊
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);

-- 複合索引用於常見查詢
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date ON audit_logs(resource_type, resource_id, created_at DESC);

-- 啟用 RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策：只有管理員和稽核人員可以查看審計日誌
CREATE POLICY "Admin and auditor can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'auditor')
    )
  );

-- 建立 RLS 政策：系統可以插入審計日誌（不限制插入）
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 建立 RLS 政策：禁止更新和刪除審計日誌（保證資料完整性）
CREATE POLICY "No updates allowed on audit logs" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed on audit logs" ON audit_logs
  FOR DELETE USING (false);

-- 建立審計統計檢視（管理員用）
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
  action,
  resource_type,
  user_role,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as date
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action, resource_type, user_role, DATE_TRUNC('day', created_at)
ORDER BY date DESC, count DESC;

-- 建立使用者活動統計檢視
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
  user_id,
  user_email,
  user_name,
  user_role,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action = 'view' THEN 1 END) as view_count,
  COUNT(CASE WHEN action = 'update' THEN 1 END) as update_count,
  COUNT(CASE WHEN action = 'delete' THEN 1 END) as delete_count,
  MAX(created_at) as last_activity,
  MIN(created_at) as first_activity
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, user_email, user_name, user_role
ORDER BY total_actions DESC;

-- 建立資源存取統計檢視
CREATE OR REPLACE VIEW resource_access_stats AS
SELECT 
  resource_type,
  resource_id,
  COUNT(*) as access_count,
  COUNT(DISTINCT user_id) as unique_users,
  ARRAY_AGG(DISTINCT action ORDER BY action) as actions_performed,
  MAX(created_at) as last_accessed,
  MIN(created_at) as first_accessed
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY resource_type, resource_id
HAVING COUNT(*) > 1  -- 只顯示被多次存取的資源
ORDER BY access_count DESC;

-- 建立函數：清理舊的審計日誌（可選，保留指定天數的日誌）
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 刪除超過指定天數的審計日誌
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 記錄清理操作
  INSERT INTO audit_logs (
    user_id, 
    user_email, 
    user_name,
    user_role,
    action, 
    resource_type, 
    resource_id, 
    metadata
  ) VALUES (
    NULL,
    'system',
    'System Cleanup',
    'system',
    'delete',
    'audit_log',
    'cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'days_kept', days_to_keep,
      'cleanup_time', NOW()
    )
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數：取得特定使用者的活動歷史
CREATE OR REPLACE FUNCTION get_user_audit_history(
  target_user_id UUID,
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  resource_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.action,
    a.resource_type,
    a.resource_id,
    a.resource_details,
    a.created_at
  FROM audit_logs a
  WHERE a.user_id = target_user_id
  ORDER BY a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數：取得特定資源的存取歷史
CREATE OR REPLACE FUNCTION get_resource_audit_history(
  target_resource_type VARCHAR(50),
  target_resource_id VARCHAR(255),
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_email,
    a.user_name,
    a.user_role,
    a.action,
    a.created_at,
    a.ip_address,
    a.metadata
  FROM audit_logs a
  WHERE a.resource_type = target_resource_type
    AND a.resource_id = target_resource_id
  ORDER BY a.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 註釋說明
COMMENT ON TABLE audit_logs IS '審計日誌表，記錄所有系統操作以確保安全性和合規性';
COMMENT ON COLUMN audit_logs.action IS '執行的動作：view(查看), view_list(查看列表), create(建立), update(更新), delete(刪除), export(匯出), status_change(狀態變更)';
COMMENT ON COLUMN audit_logs.resource_type IS '資源類型：inquiry(詢價單), inquiry_item(詢價項目), customer_data(客戶資料)';
COMMENT ON COLUMN audit_logs.resource_details IS '資源的相關資訊，如詢價單標題、客戶姓名等';
COMMENT ON COLUMN audit_logs.previous_data IS '更新操作前的資料狀態（用於變更追蹤）';
COMMENT ON COLUMN audit_logs.new_data IS '更新操作後的資料狀態';
COMMENT ON COLUMN audit_logs.metadata IS '額外的上下文資訊，如變更原因、批次操作 ID 等';

COMMENT ON VIEW audit_stats IS '審計統計檢視，提供操作類型和使用者角色的統計資訊';
COMMENT ON VIEW user_activity_stats IS '使用者活動統計檢視，顯示各使用者的操作統計';
COMMENT ON VIEW resource_access_stats IS '資源存取統計檢視，顯示資源的存取頻率和模式';

COMMENT ON FUNCTION cleanup_old_audit_logs IS '清理舊審計日誌的函數，預設保留 365 天';
COMMENT ON FUNCTION get_user_audit_history IS '取得特定使用者的審計歷史記錄';
COMMENT ON FUNCTION get_resource_audit_history IS '取得特定資源的存取歷史記錄';