-- =============================================
-- 建立 moments 表的完整 SQL 腳本
-- 請在 Supabase SQL Editor 中執行
-- =============================================

-- 1. 建立 moments 表
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'moments',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_featured BOOLEAN DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_moments_updated_at ON public.moments;

CREATE TRIGGER update_moments_updated_at
  BEFORE UPDATE ON public.moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. 啟用 Row Level Security
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- 4. 建立 RLS 政策
-- 公開讀取政策
DROP POLICY IF EXISTS "公開讀取精彩時刻" ON public.moments;
CREATE POLICY "公開讀取精彩時刻" ON public.moments
  FOR SELECT USING (true);

-- 管理員完全存取政策
DROP POLICY IF EXISTS "管理員完全存取精彩時刻" ON public.moments;
CREATE POLICY "管理員完全存取精彩時刻" ON public.moments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@gmail.com'
    )
  );

-- 5. 建立索引優化查詢效能
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON public.moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_category ON public.moments(category);
CREATE INDEX IF NOT EXISTS idx_moments_year ON public.moments(year);
CREATE INDEX IF NOT EXISTS idx_moments_featured ON public.moments(is_featured) WHERE is_featured = true;

-- 6. 建立全文搜尋索引 (使用預設英文配置，支援基本中文)
CREATE INDEX IF NOT EXISTS idx_moments_title_search ON public.moments USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_moments_content_search ON public.moments USING gin(to_tsvector('simple', coalesce(description, '') || ' ' || coalesce(content, '')));

-- 7. 插入一筆測試資料
INSERT INTO public.moments (title, description, content, category, year, is_featured, images)
VALUES (
  '豪德農場精彩時刻',
  '記錄農場生活的美好瞬間',
  '歡迎來到豪德農場的精彩時刻頁面！這裡將分享農場日常生活、特殊活動和美好回憶。',
  'moments',
  EXTRACT(YEAR FROM CURRENT_DATE),
  true,
  '{}'
)
ON CONFLICT (id) DO NOTHING;

-- 完成提示
SELECT 'moments 表建立完成！' as message;