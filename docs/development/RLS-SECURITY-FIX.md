# Supabase Row Level Security (RLS) 安全修復指南

## 問題描述
您的 Supabase 資料庫顯示警告："Data is publicly accessible via API as RLS is disabled"，這表示您的資料透過 API 公開存取，因為 Row Level Security (RLS) 未啟用。

## 修復步驟

### 步驟 1：在 Supabase Dashboard 執行 RLS 腳本

1. 開啟 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 點擊左側選單的 **SQL Editor**
4. 複製 `sql/enable-rls.sql` 檔案的全部內容
5. 貼上到 SQL Editor 中
6. 點擊 **Run** 執行

### 步驟 2：設定環境變數

在您的 `.env.local` 檔案中新增管理員 API 金鑰：

```bash
# 新增到 .env.local
ADMIN_API_KEY=你的超級安全密鑰
```

⚠️ **重要**：請使用一個強密碼作為 ADMIN_API_KEY

### 步驟 3：重新啟動應用程式

```bash
npm run dev
```

## 架構變更說明

### 安全改進

1. **啟用 RLS**：所有表格現在都啟用了 Row Level Security
2. **分離讀寫權限**：
   - 公開讀取：使用一般 Supabase 客戶端（anon key）
   - 管理員寫入：使用服務角色客戶端（service role key）

### 新的 API 端點

現在管理員功能使用專用的 API 路由：

- `POST /api/admin/products` - 新增產品
- `PUT /api/admin/products` - 更新產品  
- `DELETE /api/admin/products?id=xxx` - 刪除產品
- `POST /api/admin/locations` - 新增地點
- `PUT /api/admin/locations` - 更新地點
- `DELETE /api/admin/locations?id=xxx` - 刪除地點

### 使用管理員 API

在請求標頭中包含管理員金鑰：

```javascript
fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': 'your-admin-api-key'
  },
  body: JSON.stringify(productData)
})
```

## RLS 政策說明

### 產品表格 (products)
- **讀取**：所有人可以查看已啟用的產品
- **寫入**：只有服務角色可以新增/更新/刪除

### 地點表格 (locations)  
- **讀取**：所有人可以查看所有地點
- **寫入**：只有服務角色可以新增/更新/刪除

### 其他表格 (schedule, news, culture, farm_tour)
- **讀取**：所有人可以查看已發布/可用的內容
- **寫入**：只有服務角色可以新增/更新/刪除

## 驗證修復

執行完 SQL 腳本後：

1. 檢查 Supabase Dashboard 是否不再顯示安全警告
2. 測試網站的公開功能（產品列表、地點資訊等）
3. 確認管理員功能需要適當的 API 金鑰

## 故障排除

### 如果讀取功能失效
- 確認已執行 `sql/enable-rls.sql` 腳本
- 檢查 RLS 政策是否正確建立

### 如果管理員功能失效
- 確認 `.env.local` 中有設定 `ADMIN_API_KEY`
- 檢查 API 請求是否包含正確的 `X-Admin-Key` 標頭

### 如果仍有安全警告
- 確認所有表格都已啟用 RLS
- 檢查是否有其他表格需要設定政策

## 未來改進建議

1. **實施真正的身份驗證**：目前使用簡單的 API 金鑰，建議整合完整的身份驗證系統
2. **角色權限管理**：可以建立更細緻的權限系統
3. **審計日誌**：記錄管理員操作的日誌
4. **IP 白名單**：限制管理員 API 的存取來源