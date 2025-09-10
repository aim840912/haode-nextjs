# 訂單系統部署指南

## 🚀 部署步驟

### 前置需求檢查

在開始之前，請確認您的 Supabase 資料庫已經有以下基礎設施：

1. **profiles 表格**：必須包含 `role` 欄位（文字類型）
2. **products 表格**：必須包含 `inventory` 和 `updated_at` 欄位
3. **public.is_admin() 函數**：用於權限檢查

### 步驟 1：確保權限函數存在

如果您的資料庫還沒有 `public.is_admin()` 函數，請先執行：

```sql
-- 在 Supabase SQL Editor 中執行
\i /path/to/scripts/complete-rls-fix.sql
```

或者手動建立：

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

-- 授權執行權限
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
```

### 步驟 2：建立訂單系統表格

執行修正後的訂單建表腳本：

```sql
-- 在 Supabase SQL Editor 中執行
\i /path/to/scripts/create-orders-tables.sql
```

或者直接複製 `scripts/create-orders-tables.sql` 的內容到 Supabase SQL Editor 中執行。

### 步驟 3：驗證部署

檢查表格是否建立成功：

```sql
-- 檢查 orders 表格
SELECT * FROM information_schema.tables WHERE table_name = 'orders';

-- 檢查 order_items 表格
SELECT * FROM information_schema.tables WHERE table_name = 'order_items';

-- 檢查函數是否存在
SELECT * FROM pg_proc WHERE proname IN ('generate_order_number', 'update_product_inventory');

-- 測試權限函數
SELECT public.is_admin();
```

### 步驟 4：測試 API 端點

確認以下 API 端點可以正常工作：

1. **使用者端點**：
   - `GET /api/orders` - 取得訂單列表
   - `POST /api/orders` - 建立新訂單
   - `GET /api/orders/[id]` - 取得訂單詳情
   - `PATCH /api/orders/[id]` - 取消訂單

2. **管理員端點**：
   - `GET /api/admin/orders` - 管理員查看所有訂單
   - `PATCH /api/admin/orders/[id]` - 管理員更新訂單狀態

### 步驟 5：前端測試

1. 訪問 `http://localhost:3000/profile?tab=orders`
2. 確認頁面不再顯示硬編碼的模擬訂單資料
3. 如果是新系統，應該看到「尚無訂單記錄」的消息

## 🔧 故障排除

### 常見錯誤及解決方案

#### 1. `column profiles.is_admin does not exist`
**原因**：資料庫使用 `role` 欄位而非 `is_admin` 欄位  
**解決**：確保使用修正後的 `create-orders-tables.sql`

#### 2. `function public.is_admin() does not exist`
**原因**：缺少權限檢查函數  
**解決**：先執行 `complete-rls-fix.sql` 或手動建立函數

#### 3. `function update_product_inventory does not exist`
**原因**：缺少庫存更新函數  
**解決**：確保 `create-orders-tables.sql` 完整執行

#### 4. API 權限錯誤
**原因**：使用者沒有適當角色或 RLS 政策問題  
**解決**：
- 確保測試使用者的 `profiles.role` 設為 `'admin'`（管理員功能）
- 檢查 RLS 政策是否正確套用

#### 5. 全文搜尋配置錯誤 `text search configuration "chinese" does not exist`
**原因**：PostgreSQL 資料庫未安裝中文全文搜尋配置  
**解決**：已修正為使用 `'english'` 配置以確保相容性
- 如果需要中文搜尋支援，可在資料庫中執行：
```sql
-- 檢查可用的搜尋配置
SELECT cfgname FROM pg_ts_config;
-- 如果沒有中文配置，可以安裝或使用簡單配置
CREATE TEXT SEARCH CONFIGURATION chinese (COPY=simple);
```

#### 6. 欄位引用歧義錯誤 `column reference "order_number" is ambiguous`
**原因**：在函數中查詢時欄位名稱與變數名稱衝突  
**解決**：已修正為使用完全限定名稱（`orders.order_number`）和重命名變數
- 變數名稱從 `order_number` 改為 `new_order_number`
- 查詢中使用 `orders.order_number` 明確指定表格

#### 7. 觸發器重複建立錯誤 `trigger "update_orders_updated_at_trigger" already exists`
**原因**：重複執行腳本時觸發器已存在  
**解決**：已加入 `DROP TRIGGER IF EXISTS` 語句
- 在建立觸發器前先刪除舊的觸發器
- 確保腳本可以重複執行而不會出錯

#### 8. RLS 政策重複建立錯誤 `policy "Users can view own orders" already exists`
**原因**：重複執行腳本時 RLS 政策已存在  
**解決**：已加入 `DROP POLICY IF EXISTS` 語句
- 在建立政策前先刪除所有相關的舊政策
- 確保 orders 和 order_items 表的政策都能正確重建

## 📊 資料庫結構概覽

### orders 表格
```sql
- id (UUID, PK)
- order_number (VARCHAR, 唯一訂單編號)
- user_id (UUID, FK -> profiles.id)
- status (訂單狀態)
- subtotal, shipping_fee, tax, total_amount (金額)
- shipping_address (JSONB, 配送地址)
- payment_* (付款相關欄位)
- created_at, updated_at (時間戳記)
```

### order_items 表格
```sql
- id (UUID, PK)
- order_id (UUID, FK -> orders.id)
- product_id (UUID, FK -> products.id)
- product_name, product_image (產品快照)
- quantity, unit_price, subtotal (數量和價格)
- created_at, updated_at (時間戳記)
```

## 🧪 測試資料

如果需要建立測試資料，可以執行：

```sql
-- 建立測試使用者（如果需要）
INSERT INTO auth.users (id, email) 
VALUES ('test-user-id', 'test@example.com') 
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, name, role) 
VALUES ('test-user-id', '測試使用者', 'admin') 
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 建立測試產品（如果需要）
INSERT INTO products (id, name, price, inventory, is_active) 
VALUES 
  (gen_random_uuid(), '測試產品 1', 100, 10, true),
  (gen_random_uuid(), '測試產品 2', 200, 5, true)
ON CONFLICT DO NOTHING;
```

## 🎉 完成！

如果所有步驟都成功完成，您的訂單系統現在應該：

1. ✅ 資料庫表格和函數已建立
2. ✅ API 端點正常運作
3. ✅ Profile 頁面顯示真實的訂單資料
4. ✅ 支援訂單建立、查看、取消功能
5. ✅ 管理員可以管理所有訂單

需要協助或遇到問題？請檢查上述故障排除部分或聯繫開發團隊。