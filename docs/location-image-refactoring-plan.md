# 門市圖片系統完整重構方案

## 概述
將門市圖片管理系統重構為與產品圖片系統相同的架構，實現更清晰的路徑管理和檔案刪除機制。

## 現狀分析

### 產品圖片系統（運作正常）
```javascript
// 上傳返回
{
  url: "https://xxx.supabase.co/storage/v1/object/public/products/xxx.jpg",  // 完整 URL
  path: "productId/medium-xxx.jpg"  // 實際檔案路徑
}

// 刪除時直接使用 path
await deleteImageFromStorage(path)
```

### 門市圖片系統（有問題）
```javascript
// 上傳返回
{
  url: "/storage/v1/object/public/locations/30/xxx.jpg",  // 相對 URL
  path: "30/xxx.jpg",  // 實際路徑（但前端沒有儲存）
  fileName: "xxx.jpg"
}

// 刪除時使用 url（格式錯誤）
await deleteLocationImage(url)  // 失敗：期待 "30/xxx.jpg" 但收到 "/storage/v1/..."
```

## 重構實施步驟

### 第一階段：修改上傳返回結構

#### 1.1 修改 `/src/lib/locations-storage.ts`

```typescript
export async function uploadLocationImage(
  file: File,
  locationId: string
): Promise<{
  url: string
  path: string  // 確保返回實際路徑
  fileName: string
}> {
  // ... 現有上傳邏輯 ...

  // 修改返回值，使用實際檔案路徑而非相對 URL
  return {
    url: urlData.publicUrl,  // 改為返回完整 URL（像產品一樣）
    path: filePath,          // 返回實際路徑 "30/xxx.jpg"
    fileName: fileName
  }
}
```

#### 1.2 修改 `/src/app/api/upload/locations/route.ts`

```typescript
async function handlePOST(request: NextRequest) {
  // ... 現有邏輯 ...

  const uploadResult = await uploadLocationImage(file, locationId)

  // 返回 path 給前端
  const result = {
    url: uploadResult.url,
    path: uploadResult.path,  // 新增：返回實際路徑
    fileName: uploadResult.fileName,
    size: file.size
  }

  return success(result, '圖片上傳成功')
}
```

### 第二階段：修改前端儲存邏輯

#### 2.1 修改 `/src/app/admin/locations/[id]/edit/page.tsx`

```typescript
// 新增狀態來儲存圖片路徑
const [imagePaths, setImagePaths] = useState<Map<string, string>>(new Map())

// 修改圖片上傳成功處理
const handleImageUploadSuccess = (images: {
  id: string
  url?: string
  path?: string  // 新增 path 屬性
  preview?: string
  // ... 其他屬性
}[]) => {
  if (images.length > 0) {
    const image = images[0]
    const imageUrl = image.url || image.path

    if (imageUrl && image.path) {
      // 儲存 URL 和 path 的對應關係
      setImagePaths(prev => new Map(prev).set(imageUrl, image.path))
      setUploadedImages([imageUrl])
      setFormData(prev => ({ ...prev, image: imageUrl }))
    }
  }
}

// 修改刪除處理
const handleImageDelete = async () => {
  if (!locationId || !formData.image) {
    alert('沒有圖片可以刪除')
    return
  }

  // 使用實際路徑而非 URL
  const actualPath = imagePaths.get(formData.image) || formData.image

  const response = await fetch('/api/upload/locations', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      locationId,
      filePath: actualPath,  // 使用實際路徑
    }),
  })

  // ... 其餘邏輯
}
```

#### 2.2 修改 `/src/app/admin/locations/add/page.tsx`
同樣的修改模式套用到新增頁面。

### 第三階段：資料庫遷移（選擇性）

#### 3.1 方案 A：保持現有欄位，僅改變儲存內容

```sql
-- 不需要修改資料庫結構
-- 只需更新應用層邏輯，將 image 欄位從儲存 URL 改為儲存 path
```

#### 3.2 方案 B：新增 path 欄位（更完整）

```sql
-- 新增 image_path 欄位
ALTER TABLE locations
ADD COLUMN image_path VARCHAR(255);

-- 從現有 image 欄位遷移資料
UPDATE locations
SET image_path = REGEXP_REPLACE(
  image,
  '^/storage/v1/object/public/locations/',
  ''
)
WHERE image IS NOT NULL AND image != '';
```

### 第四階段：服務層修改

#### 4.1 修改 `/src/services/v2/locationServiceSimple.ts`

```typescript
// 如果採用方案 B（新增 path 欄位）
interface SupabaseLocationRecord {
  // ... 現有欄位
  image: string
  image_path?: string  // 新增
}

// 轉換函數
private transformFromDB(record: SupabaseLocationRecord): Location {
  return {
    // ... 現有轉換
    image: record.image || '',
    imagePath: record.image_path || '',  // 新增
  }
}

// 更新函數
async updateLocation(id: number, locationData: Partial<Location>) {
  const updateData: UpdateDataObject = {}

  // ... 現有邏輯

  if (locationData.image !== undefined) {
    updateData.image = locationData.image
  }
  if (locationData.imagePath !== undefined) {
    updateData.image_path = locationData.imagePath
  }

  // ... 其餘邏輯
}
```

## 實施計畫

### 階段 1：準備工作（1天）
- [ ] 備份現有資料
- [ ] 建立測試環境
- [ ] 準備回滾計畫

### 階段 2：後端修改（2天）
- [ ] 修改 `locations-storage.ts`
- [ ] 修改 API 路由
- [ ] 修改服務層
- [ ] 單元測試

### 階段 3：前端修改（2天）
- [ ] 修改編輯頁面
- [ ] 修改新增頁面
- [ ] 整合測試

### 階段 4：資料遷移（1天）
- [ ] 執行資料庫遷移腳本
- [ ] 驗證現有資料
- [ ] 修復任何不一致

### 階段 5：部署與監控（1天）
- [ ] 分階段部署
- [ ] 監控錯誤日誌
- [ ] 效能測試

## 風險評估

### 高風險
1. **資料遷移錯誤**：可能導致現有圖片連結失效
   - 緩解：完整備份、分批遷移、保留舊欄位

2. **向後相容性**：舊版本客戶端可能無法正常工作
   - 緩解：保持雙重支援一段時間

### 中風險
1. **效能影響**：額外的資料庫欄位和查詢
   - 緩解：適當的索引和快取策略

2. **測試覆蓋不足**：可能遺漏邊界情況
   - 緩解：完整的測試計畫和 QA 流程

## 回滾計畫

如果出現嚴重問題：

1. **立即回滾**：
```bash
# 回滾程式碼
git revert <commit-hash>

# 回滾資料庫（如果有修改）
psql -d database_name -f backup.sql
```

2. **資料修復**：
```sql
-- 恢復原始 image 欄位資料
UPDATE locations
SET image = backup_image
WHERE backup_image IS NOT NULL;
```

## 預期效益

1. **一致性**：與產品圖片系統架構統一
2. **可維護性**：更清晰的程式碼結構
3. **可靠性**：確保檔案刪除正常運作
4. **擴展性**：方便未來功能擴充

## 長期建議

1. **建立統一的圖片管理服務**
   - 整合產品和門市圖片邏輯
   - 提供一致的 API 介面

2. **實施圖片 CDN**
   - 提升圖片載入速度
   - 減少伺服器負載

3. **自動清理機制**
   - 定期清理孤立檔案
   - 壓縮和優化儲存

## 結論

完整重構雖然工作量較大，但能徹底解決問題並提供更好的長期維護性。建議在有足夠時間和資源的情況下執行此方案。如果時間緊迫，可以先採用快速修復方案，待後續再進行完整重構。

---

**文件資訊**
- 建立日期：2025-09-18
- 建立者：Claude Code Assistant
- 版本：1.0
- 相關問題：門市圖片刪除時未從 Supabase Storage 刪除實際檔案