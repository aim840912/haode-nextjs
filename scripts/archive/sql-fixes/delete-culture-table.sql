-- =============================================
-- 刪除 culture 表和相關資源
-- 請在 Supabase SQL Editor 中執行
-- 注意：這個操作不可逆，請確認已完成資料遷移
-- =============================================

-- 1. 檢查 culture 表是否有資料
SELECT
  'culture 表資料數量: ' || COUNT(*) as message
FROM public.culture;

-- 2. 刪除 culture 表的 RLS 政策
DROP POLICY IF EXISTS "公開讀取文化項目" ON public.culture;
DROP POLICY IF EXISTS "管理員完全存取文化項目" ON public.culture;

-- 3. 刪除 culture 表的索引
DROP INDEX IF EXISTS idx_culture_created_at;
DROP INDEX IF EXISTS idx_culture_category;
DROP INDEX IF EXISTS idx_culture_year;
DROP INDEX IF EXISTS idx_culture_featured;
DROP INDEX IF EXISTS idx_culture_title_search;
DROP INDEX IF EXISTS idx_culture_content_search;

-- 4. 刪除 culture 表的觸發器
DROP TRIGGER IF EXISTS update_culture_updated_at ON public.culture;

-- 5. 刪除 culture 表
DROP TABLE IF EXISTS public.culture;

-- 6. 驗證表已刪除
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'culture'
    )
    THEN '❌ culture 表仍然存在'
    ELSE '✅ culture 表已成功刪除'
  END as result;

-- 完成提示
SELECT 'culture 表清理完成！' as message;