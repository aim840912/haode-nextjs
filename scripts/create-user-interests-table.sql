-- ========================================
-- 建立和修復 user_interests 表格
-- ========================================
-- 🎯 目標：建立 user_interests 表格並設定適當的權限和 RLS 政策
-- 📅 建立日期：2025-09-18

-- 第一步：建立 user_interests 表格（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- 確保同一用戶不會對同一產品重複加入興趣
    CONSTRAINT user_interests_unique_constraint UNIQUE (user_id, product_id)
);

-- 第二步：建立索引優化查詢效能
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
ON public.user_interests (user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_product_id
ON public.user_interests (product_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_created_at
ON public.user_interests (created_at DESC);

-- 複合索引用於查詢特定用戶的興趣
CREATE INDEX IF NOT EXISTS idx_user_interests_user_created
ON public.user_interests (user_id, created_at DESC);

-- 第三步：啟用 RLS（Row Level Security）
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- 第四步：移除可能存在的舊政策
DROP POLICY IF EXISTS "Users can view own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Admin can view all interests" ON public.user_interests;
DROP POLICY IF EXISTS "Admin can manage all interests" ON public.user_interests;

-- 第五步：建立 RLS 政策

-- 政策 1：用戶可以查看自己的興趣
CREATE POLICY "Users can view own interests" ON public.user_interests
    FOR SELECT
    USING (auth.uid() = user_id);

-- 政策 2：用戶可以新增自己的興趣
CREATE POLICY "Users can insert own interests" ON public.user_interests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 政策 3：用戶可以刪除自己的興趣
CREATE POLICY "Users can delete own interests" ON public.user_interests
    FOR DELETE
    USING (auth.uid() = user_id);

-- 政策 4：管理員可以查看所有興趣
CREATE POLICY "Admin can view all interests" ON public.user_interests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 政策 5：管理員可以管理所有興趣
CREATE POLICY "Admin can manage all interests" ON public.user_interests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 第六步：設定表格權限
GRANT ALL ON public.user_interests TO authenticated;
GRANT ALL ON public.user_interests TO service_role;

-- 第七步：驗證建立結果
SELECT
    'user_interests table created successfully' as status,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_name = 'user_interests' AND table_schema = 'public') as table_exists,
    (SELECT COUNT(*) FROM pg_policies
     WHERE tablename = 'user_interests') as policies_count,
    (SELECT COUNT(*) FROM pg_indexes
     WHERE tablename = 'user_interests') as indexes_count;

-- 第八步：測試基本操作（可選 - 在實際環境中執行）
-- 這些註釋掉的語句可以用來測試表格是否正常工作
/*
-- 測試插入（需要有效的 user_id 和 product_id）
INSERT INTO public.user_interests (user_id, product_id)
VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- 測試查詢
SELECT * FROM public.user_interests LIMIT 1;

-- 清理測試資料
DELETE FROM public.user_interests
WHERE user_id = '00000000-0000-0000-0000-000000000000';
*/