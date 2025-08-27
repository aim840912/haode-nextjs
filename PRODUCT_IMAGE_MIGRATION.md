# 產品圖片儲存位置修復

## 問題描述

之前的產品圖片都儲存在以 `temp-` 開頭的臨時資料夾中，而沒有移動到對應的產品 UUID 資料夾。這造成了：

1. **管理困難**：無法從資料夾名稱識別產品
2. **清理困難**：不知道哪些 temp 資料夾可以刪除
3. **刪除問題**：刪除產品時無法正確清理圖片

## 解決方案

### 1. 自動圖片移動機制（新產品）

**新增產品時**：
- 圖片先上傳到 `temp-{timestamp}` 資料夾
- 產品儲存成功後，自動呼叫 `/api/admin/products/move-images` API
- 將圖片從臨時資料夾移動到實際的產品 UUID 資料夾
- 更新資料庫中的圖片 URL

**相關檔案**：
- `/src/app/api/admin/products/move-images/route.ts` - 圖片移動 API
- `/src/lib/supabase-storage.ts` - `moveImagesFromTempToProduct()` 函數
- `/src/app/admin/products/add/page.tsx` - 新增產品流程

### 2. 編輯頁面圖片上傳

**產品編輯時**：
- 新增 `ImageUploader` 組件到編輯頁面
- 使用實際的產品 UUID 作為上傳路徑
- 支援新增圖片和編輯現有圖片 URL

**相關檔案**：
- `/src/app/admin/products/[id]/edit/page.tsx` - 編輯頁面

### 3. 改進的刪除機制

**刪除產品時**：
- 檢查產品 UUID 資料夾
- 同時檢查所有可能的 `temp-` 資料夾
- 確保完全清理相關圖片

**相關檔案**：
- `/src/lib/supabase-storage.ts` - `deleteProductImages()` 函數

### 4. 批次遷移工具

**現有產品圖片遷移**：
- 自動掃描產品和對應的 temp 資料夾
- 批次移動圖片到正確位置
- 更新資料庫中的圖片 URL

## 使用方法

### 批次遷移現有產品圖片

1. **檢查模式**（不會實際移動，只顯示會做什麼）：
   ```bash
   npx tsx scripts/migrate-product-images.ts --dry-run
   ```

2. **執行完整遷移**：
   ```bash
   npx tsx scripts/migrate-product-images.ts
   ```

3. **只遷移特定產品**：
   ```bash
   npx tsx scripts/migrate-product-images.ts --product-id=PRODUCT_UUID
   ```

### API 端點

**移動圖片 API**：
```http
POST /api/admin/products/move-images
Content-Type: application/json

{
  "tempProductId": "temp-1735123456789",
  "actualProductId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**檢查臨時圖片**：
```http
GET /api/admin/products/move-images?tempProductId=temp-1735123456789
```

## 檔案結構

遷移後的 Supabase Storage 結構：

```
products/
├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  # 產品 UUID 資料夾
│   ├── medium-image1.jpg
│   ├── medium-image2.png
│   └── ...
├── b2c3d4e5-f6g7-8901-bcde-f12345678901/  # 另一個產品
│   ├── medium-image1.webp
│   └── ...
└── temp-1735123456789/  # 遺留的臨時資料夾（將被清理）
    └── ...
```

## 注意事項

1. **備份建議**：執行遷移前建議備份 Supabase Storage
2. **測試環境**：建議先在測試環境執行遷移
3. **權限檢查**：確保有 Supabase Service Role Key 權限
4. **監控日誌**：遷移過程中注意 console 日誌輸出

## 環境變數

遷移腳本需要以下環境變數：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 故障排除

### 常見問題

1. **權限錯誤**：檢查 `SUPABASE_SERVICE_ROLE_KEY` 是否正確
2. **找不到 temp 資料夾**：使用 `--dry-run` 先檢查狀況
3. **網路錯誤**：檢查 Supabase 連線狀況

### 檢查遷移結果

1. 登入 Supabase Dashboard
2. 前往 Storage > products bucket
3. 確認圖片已移動到 UUID 資料夾
4. 檢查網站前端圖片顯示是否正常

## 後續維護

- 定期清理空的 temp 資料夾
- 監控新產品的圖片移動是否正常
- 考慮設定自動清理機制清理超過一定時間的孤立 temp 資料夾