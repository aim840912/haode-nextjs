-- Allow admin audit log deletion
-- Migration: 011_allow_admin_audit_deletion.sql

-- 移除原本的刪除限制政策
DROP POLICY IF EXISTS "No deletes allowed on audit logs" ON audit_logs;

-- 建立新的政策：只允許管理員刪除審計日誌
CREATE POLICY "Admin can delete audit logs" ON audit_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 註釋說明
COMMENT ON POLICY "Admin can delete audit logs" ON audit_logs IS '只允許管理員刪除審計日誌，用於系統維護和清理';