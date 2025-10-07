-- 開發筆記/待辦事項表
CREATE TABLE IF NOT EXISTS public.dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'todo', 'feature', 'improvement')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  tags TEXT[], -- PostgreSQL 陣列,儲存標籤
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_dev_notes_type ON public.dev_notes(type);
CREATE INDEX idx_dev_notes_status ON public.dev_notes(status);
CREATE INDEX idx_dev_notes_priority ON public.dev_notes(priority);
CREATE INDEX idx_dev_notes_created_by ON public.dev_notes(created_by);
CREATE INDEX idx_dev_notes_assigned_to ON public.dev_notes(assigned_to);
CREATE INDEX idx_dev_notes_created_at ON public.dev_notes(created_at DESC);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_dev_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dev_notes_updated_at
  BEFORE UPDATE ON public.dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_notes_updated_at();

-- RLS 政策:只有管理員可以存取
ALTER TABLE public.dev_notes ENABLE ROW LEVEL SECURITY;

-- 管理員可以查看所有記錄
CREATE POLICY "Admins can view all dev notes"
  ON public.dev_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以新增記錄
CREATE POLICY "Admins can insert dev notes"
  ON public.dev_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以更新記錄
CREATE POLICY "Admins can update dev notes"
  ON public.dev_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以刪除記錄
CREATE POLICY "Admins can delete dev notes"
  ON public.dev_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
