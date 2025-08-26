-- ========================================
-- 移除 reviews 表和相關結構
-- ========================================
-- 日期：2025-08-26
-- 原因：專案不再需要評論功能，移除相關資料庫結構
-- 注意：這是不可逆操作，執行前請確保已備份相關資料

-- ========================================
-- 1. 記錄移除操作到審計日誌
-- ========================================

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
  'Database Migration',
  'system',
  'delete',
  'migration',
  'reviews_table_removal',
  jsonb_build_object(
    'table_name', 'reviews',
    'operation', 'DROP TABLE CASCADE'
  ),
  jsonb_build_object(
    'migration_file', '017_remove_reviews_table.sql',
    'description', 'Removed reviews table and all related database structures as the review feature is no longer needed',
    'impact', 'All review data will be permanently deleted',
    'executed_at', NOW()
  )
);

-- ========================================
-- 2. 移除觸發器
-- ========================================

-- 移除 updated_at 觸發器
DROP TRIGGER IF EXISTS set_timestamp_reviews ON reviews;

-- ========================================
-- 3. 移除索引
-- ========================================

-- 移除評分索引
DROP INDEX IF EXISTS idx_reviews_rating;

-- 移除審核狀態索引  
DROP INDEX IF EXISTS idx_reviews_is_approved;

-- ========================================
-- 4. 移除 RLS 政策（如果存在）
-- ========================================

-- 移除所有 reviews 表的 RLS 政策
DROP POLICY IF EXISTS "users_manage_own_reviews" ON reviews;
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
DROP POLICY IF EXISTS "admins_manage_all_reviews" ON reviews;

-- ========================================
-- 5. 移除表格
-- ========================================

-- 使用 CASCADE 移除表格和所有依賴
DROP TABLE IF EXISTS reviews CASCADE;

-- ========================================
-- 6. 清理相關序列（如果存在）
-- ========================================

-- 注意：如果使用 UUID 作為主鍵，通常不會有相關序列需要清理
-- 但如果有自定義序列，可以在這裡清理

-- ========================================
-- 7. 記錄完成狀態
-- ========================================

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
  'Database Migration',
  'system',
  'update',
  'migration',
  '017_remove_reviews_table_completed',
  jsonb_build_object(
    'status', 'completed',
    'operation', 'reviews table removal'
  ),
  jsonb_build_object(
    'migration_file', '017_remove_reviews_table.sql',
    'description', 'Successfully removed reviews table and all related structures',
    'completed_at', NOW()
  )
);

-- ========================================
-- 移除完成通知
-- ========================================

-- 此 migration 已完成以下操作：
-- ✅ 移除 reviews 表及所有相關結構
-- ✅ 清理相關觸發器和索引
-- ✅ 移除 RLS 政策
-- ✅ 記錄操作到審計日誌

-- 注意事項：
-- ⚠️ 此操作不可逆，所有評論資料已永久刪除
-- ⚠️ 請確保應用程式代碼已移除所有 reviews 相關引用
-- ⚠️ 建議執行應用程式測試確保功能正常