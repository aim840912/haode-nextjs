# Supabase 資料庫遷移指南 - 單位價格功能

## 🚨 重要通知
系統檢測到 Supabase 資料庫缺少單位價格功能所需的欄位：
- `price_unit` (價格單位，如：斤、包、箱、顆等)
- `unit_quantity` (單位數量，預設為 1)

雖然 TypeScript 類型定義已準備好，但實際資料庫表結構尚未更新。

## 🔧 手動遷移步驟

### 步驟 1: 打開 Supabase Dashboard
1. 訪問 [Supabase Dashboard](https://app.supabase.com/)
2. 登入您的帳號
3. 選擇對應的專案

### 步驟 2: 進入 SQL Editor
1. 在左側導覽欄點擊 **"SQL Editor"**
2. 點擊 **"New query"** 建立新查詢

### 步驟 3: 執行遷移 SQL
複製以下 SQL 語句並執行：

```sql
-- 新增價格單位欄位到 products 表
-- 支援單位價格功能（如：NT$ 150 / 斤）

-- 新增價格單位欄位
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20),
ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC DEFAULT 1;

-- 新增註解說明
COMMENT ON COLUMN products.price_unit IS '價格單位（如：斤、包、箱等）';
COMMENT ON COLUMN products.unit_quantity IS '單位數量，預設為 1';

-- 為現有產品設定預設值
UPDATE products SET unit_quantity = 1 WHERE unit_quantity IS NULL;
```

### 步驟 4: 執行查詢
1. 點擊 **"Run"** 按鈕執行 SQL
2. 確認執行成功，沒有錯誤訊息

### 步驟 5: 驗證結果
執行以下查詢來驗證欄位是否成功新增：

```sql
-- 檢查新欄位是否存在
SELECT 
  id, 
  name, 
  price, 
  price_unit, 
  unit_quantity,
  created_at
FROM products 
LIMIT 5;
```

如果查詢成功執行且顯示新欄位，表示遷移完成！

## 🎯 遷移後的效果

### 新增產品時
- 管理員可以設定價格單位（斤、包、箱、顆、公斤等）
- 系統會儲存單位資訊到 `price_unit` 欄位

### 產品顯示時
- 首頁產品區塊：`NT$ 價格 / 單位`
- 產品列表頁面：`NT$ 價格 / 單位`
- 管理頁面會顯示完整的單位資訊

### 範例顯示格式
- `NT$ 150 / 斤`
- `NT$ 300 / 包`
- `NT$ 1000 / 箱`

## 🔄 完成後的下一步

遷移完成後，請執行以下驗證腳本：

```bash
# 在專案根目錄執行
npx tsx scripts/setup-unit-pricing.ts
```

這將驗證：
1. ✅ 資料庫欄位正確新增
2. ✅ 應用程式可以正確讀取欄位
3. ✅ 新增產品功能正常運作
4. ✅ 顯示格式符合預期

## ❓ 常見問題

### Q: 執行 SQL 時出現權限錯誤
**A:** 請確認您有專案的管理員權限，或聯絡專案擁有者協助執行。

### Q: 現有產品會受到影響嗎？
**A:** 不會。現有產品的 `price_unit` 會是 `null`，系統會繼續顯示原有格式 `NT$ 價格`。只有新設定單位的產品才會顯示 `NT$ 價格 / 單位` 格式。

### Q: 如何回滾這次變更？
**A:** 如需回滾，可執行：
```sql
ALTER TABLE products 
DROP COLUMN IF EXISTS price_unit,
DROP COLUMN IF EXISTS unit_quantity;
```

## 📞 需要協助？
如果遇到任何問題，請提供錯誤訊息的截圖，我們會協助解決。

---
*此遷移指南由系統自動生成 - $(date)*