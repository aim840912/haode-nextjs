# 🚨 詢價功能緊急修復方案

## 問題狀況
詢價功能持續失敗，顯示 500 Internal Server Error，需要立即修復。

## 🔧 方案 A：立即執行 SQL 修復

### 1. 進入 Supabase Dashboard
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案
3. 點選「SQL Editor」

### 2. 執行完整診斷和修復 SQL
```sql
-- === 緊急診斷和修復 ===

-- 1. 檢查資料表是否存在
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inquiries', 'inquiry_items', 'profiles')
ORDER BY table_name;

-- 2. 如果資料表不存在，建立它們
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  total_estimated_amount DECIMAL(10,2),
  delivery_address TEXT,
  preferred_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id ON inquiry_items(inquiry_id);

-- 4. 啟用 RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;

-- 5. 移除所有現有政策
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiry items" ON inquiry_items;
DROP POLICY IF EXISTS "Users can insert own inquiry items" ON inquiry_items;
DROP POLICY IF EXISTS "Admins can view all inquiry items" ON inquiry_items;

-- 6. 建立寬鬆的 RLS 政策（緊急修復用）
CREATE POLICY "Emergency - Users can do anything on inquiries" ON inquiries
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Emergency - Users can do anything on inquiry items" ON inquiry_items
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. 修復 profiles 資料表
INSERT INTO profiles (id, name, phone, role, created_at, updated_at)
SELECT 
  u.id, 
  COALESCE(
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1)
  ) as name,
  u.raw_user_meta_data->>'phone' as phone,
  'customer' as role,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = EXCLUDED.updated_at;

-- 8. 驗證設定
SELECT 
  '修復完成' as status,
  (SELECT COUNT(*) FROM inquiries) as existing_inquiries,
  (SELECT COUNT(*) FROM inquiry_items) as existing_inquiry_items,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles;
```

## 🔧 方案 B：暫時停用 RLS（最後手段）

如果上述方案無效，暫時停用 RLS：

```sql
-- 緊急停用 RLS（僅限開發環境）
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items DISABLE ROW LEVEL SECURITY;

-- 記得：修復問題後要重新啟用 RLS
-- ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;
```

## 🔧 方案 C：使用 Service Role Key

如果需要繞過 RLS，在 `.env.local` 中添加：

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

然後在 API 中使用 service role client（僅限開發測試）。

## ⚠️ 重要提醒

1. **方案 A 是首選** - 解決根本問題
2. **方案 B 和 C** 僅供緊急使用，會降低安全性
3. **完成修復後** 請執行正確的 RLS 政策設定
4. **測試修復** 執行完畢後立即測試詢價功能

## 🧪 測試修復結果

執行修復後，在瀏覽器控制台執行：
```javascript
// 複製 docs/development/supabase-diagnosis.js 的內容
// 然後執行 diagnoseSuppbaseInquiry()
```

## 📞 如果仍然失敗

1. 檢查瀏覽器控制台的詳細錯誤訊息
2. 檢查 Supabase Dashboard 的 Logs 頁面
3. 提供完整的錯誤日誌和截圖