-- 建立使用者興趣產品表
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 建立唯一索引，確保同一使用者不會重複加入同一產品
CREATE UNIQUE INDEX idx_user_interests_unique ON user_interests(user_id, product_id);

-- 建立索引加速查詢
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_product_id ON user_interests(product_id);

-- 設定 RLS (Row Level Security)
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看和修改自己的興趣清單
CREATE POLICY "Users can view own interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests" ON user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests" ON user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- 管理員可以查看所有興趣清單（可選）
CREATE POLICY "Authenticated users can view all interests" ON user_interests
  FOR SELECT USING (auth.role() = 'authenticated');