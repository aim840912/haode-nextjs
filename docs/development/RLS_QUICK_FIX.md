# 🚨 詢價功能 RLS 權限問題快速修復

## 問題症狀
- 錯誤訊息：「伺服器內部錯誤，系統暫時無法處理，請稍後再試」
- 控制台顯示：`new row violates row-level security policy for table "inquiries"`

## 🔧 立即修復步驟

### 1. 進入 Supabase Dashboard
1. 開啟 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點選左側選單的 **「SQL Editor」**

### 2. 執行修復 SQL
複製貼上以下 SQL 並執行：

```sql
-- 快速修復 RLS 政策問題
-- 步驟 1: 修復缺失的 profiles 記錄
-- 注意：profiles 資料表沒有 email 欄位
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
  name = COALESCE(profiles.name, EXCLUDED.name),
  updated_at = EXCLUDED.updated_at;

-- 步驟 2: 重建 INSERT 政策
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries;
CREATE POLICY "Users can insert own inquiries" ON inquiries
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert own inquiry items" ON inquiry_items;  
CREATE POLICY "Users can insert own inquiry items" ON inquiry_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );
```

### 3. 驗證修復
執行這個查詢來檢查修復結果：

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
    THEN '✅ 修復成功'
    ELSE '❌ 仍有問題'
  END as status;
```

### 4. 測試詢價功能
1. 回到網站
2. 重新載入頁面
3. 嘗試送出詢價

## 🎯 修復說明

這個問題是因為：
1. **缺少 profiles 記錄**：RLS 政策依賴 profiles 資料表，但新使用者可能沒有對應記錄
2. **RLS 政策過嚴**：原始政策檢查過於複雜，導致合法插入被阻擋

修復方案：
1. **補全 profiles 記錄**：確保每個使用者都有對應的 profile
2. **簡化 RLS 政策**：使用更直接的檢查條件

## 📞 如果問題持續

如果執行上述修復後問題仍然存在：

1. **檢查錯誤訊息**：現在會顯示「資料庫權限設定問題」
2. **聯繫開發者**：提供完整的錯誤訊息和截圖
3. **備用方案**：可以暫時使用其他聯繫方式（電話、Email）

---

**⚠️ 重要提醒**：這是緊急修復方案，適用於開發和測試環境。生產環境建議使用更嚴格的 RLS 政策。