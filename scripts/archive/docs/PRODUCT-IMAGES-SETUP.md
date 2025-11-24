# 產品圖片系統設定指南

## 📋 概述

本指南說明如何建立產品多圖片上傳系統所需的資料庫架構。

## 🚀 快速開始

### 步驟 1：執行 SQL 腳本

1. 打開 **Supabase Dashboard**
2. 進入 **SQL Editor**
3. 複製 `setup-product-images.sql` 的全部內容
4. 貼上並執行

### 步驟 2：驗證表創建

執行以下查詢確認表已正確建立：

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'product_images'
ORDER BY ordinal_position;
```

### 步驟 3：測試 RLS 政策

```sql
-- 測試公開讀取
SELECT * FROM product_images LIMIT 1;

-- 測試管理員寫入（需要以管理員身分登入）
INSERT INTO product_images (
  product_id,
  url,
  path,
  position
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- 替換為實際產品 ID
  'https://example.com/test.jpg',
  'products/test.jpg',
  0
);
```

## 📊 資料庫架構

### product_images 表結構

| 欄位名稱 | 類型 | 說明 | 約束 |
|---------|------|------|------|
| id | UUID | 圖片唯一 ID | PRIMARY KEY |
| product_id | UUID | 產品 ID | NOT NULL, FK |
| url | TEXT | 圖片公開 URL | NOT NULL |
| path | TEXT | 存儲路徑 | NOT NULL |
| alt | TEXT | 替代文字 | NULLABLE |
| position | INTEGER | 排序位置 | DEFAULT 0 |
| size | VARCHAR(20) | 圖片尺寸 | DEFAULT 'medium' |
| width | INTEGER | 寬度(px) | NULLABLE |
| height | INTEGER | 高度(px) | NULLABLE |
| file_size | INTEGER | 檔案大小(bytes) | NULLABLE |
| created_at | TIMESTAMPTZ | 創建時間 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新時間 | AUTO UPDATE |

### 索引

- `idx_product_images_product_id` - 查詢產品的所有圖片
- `idx_product_images_position` - 排序查詢
- `idx_product_images_url` - URL 查找

### RLS 政策

- **SELECT**: 公開讀取（所有人）
- **INSERT/UPDATE/DELETE**: 僅管理員

## 🔧 使用範例

### 新增產品圖片

```typescript
const { data, error } = await supabase
  .from('product_images')
  .insert({
    product_id: productId,
    url: imageUrl,
    path: imagePath,
    position: 0, // 0 = 主圖
    alt: '產品圖片描述'
  });
```

### 查詢產品所有圖片

```typescript
const { data, error } = await supabase
  .from('product_images')
  .select('*')
  .eq('product_id', productId)
  .order('position', { ascending: true });
```

### 更新圖片排序

```typescript
const { error } = await supabase
  .from('product_images')
  .update({ position: newPosition })
  .eq('id', imageId);
```

### 刪除圖片

```typescript
const { error } = await supabase
  .from('product_images')
  .delete()
  .eq('id', imageId);
```

## ⚠️ 重要提醒

1. **外鍵約束**：刪除產品時會自動刪除相關圖片（CASCADE）
2. **唯一約束**：同一產品的 position 不能重複
3. **RLS 政策**：確保前端使用管理員 token 執行寫入操作
4. **position = 0**：代表主圖，前端應確保每個產品有且只有一張 position=0 的圖片

## 🐛 故障排除

### 問題：無法創建表

**解決方案**：檢查是否有足夠的權限，確保在 Supabase Dashboard 中執行。

### 問題：RLS 阻止寫入

**解決方案**：
1. 確認 JWT token 包含正確的 role
2. 檢查 auth.jwt() 是否返回預期資料
3. 暫時禁用 RLS 測試：`ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;`

### 問題：position 衝突

**解決方案**：使用批次更新重新排列所有圖片的 position。

## 📚 下一步

設定完成後，繼續進行：
1. 更新 TypeScript 類型定義（`src/types/database.ts`）
2. 實作 ProductImageService
3. 建立圖片管理 API
4. 整合前端上傳元件

## 📞 需要協助？

如有問題，請檢查：
- Supabase Dashboard 的 Logs
- Browser Console 的錯誤訊息
- Network Tab 的 API 請求