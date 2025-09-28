# 產品系統重構計畫

## 📋 執行狀態
- **創建日期**: 2025-09-28
- **狀態**: 進行中
- **預估時間**: 8 小時
- **優先級**: 🔴 高

---

## 🎯 重構目標

將產品系統從「草稿模式」重構為「事務式建立模式」，實現：
1. 無垃圾資料的產品建立流程
2. 統一的 API 架構
3. 正確的中間件使用
4. 符合 ACID 原則的資料操作

---

## 🔍 問題分析

### 1. 目前系統的問題

#### 問題 A：草稿產品模式
**現況**：
```typescript
// src/app/admin/products/add/page.tsx:202
const draftData = {
  id: productId,
  name: '（草稿）',
  description: '草稿產品',
  isActive: false
}
await fetch('/api/admin-proxy/products', { method: 'POST', body: draftData })
```

**問題**：
- ❌ 資料庫中會留下大量 `name: '（草稿）'` 的垃圾資料
- ❌ 使用者放棄建立時，草稿產品永久存在
- ❌ 不符合 RESTful 原則（產品不應該有「不完整」狀態）
- ❌ 需要額外的清理機制

#### 問題 B：API 架構混亂
**現況**：
- `/api/admin-proxy/products` - 舊系統，使用 `checkAdminPermission`
- `/api/admin/products` - 新系統，使用 `checkAdminPermission` + `withErrorHandler` + `withRateLimit`
- `/api/products/[id]/images` - 使用 `requireAdmin`

**問題**：
- ❌ 三套不同的權限驗證機制
- ❌ admin-proxy 是冗餘系統
- ❌ 維護困難，容易出錯

#### 問題 C：中間件使用錯誤
**現況**：
```typescript
// src/app/api/products/route.ts:109
// POST 需要管理員權限（requireAdmin 已內建 withErrorHandler）← 錯誤註釋！
export const POST = requireAdmin(async req => {
```

**真相**：
```typescript
// src/lib/middleware/api-middleware.ts:118
} catch (err) {
  apiLogger.error('認證中間件錯誤', err as Error)
  return error('認證檢查失敗', 500)  // 只有基本錯誤處理
}
```

**問題**：
- ❌ `requireAdmin` **沒有** 內建 `withErrorHandler`
- ❌ 註釋誤導開發者
- ❌ 錯誤處理不一致

#### 問題 D：外鍵約束限制
**現況**：
```sql
-- scripts/setup-product-images.sql:24
CONSTRAINT fk_product_images_product_id
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE CASCADE
```

**問題**：
- ❌ 圖片無法在產品前建立
- ❌ 導致必須使用草稿模式的根本原因

---

## 🏗️ 解決方案架構

### 核心概念：事務式建立 (Transactional Creation)

```
使用者填寫表單 → 前端暫存圖片 URL → 提交時在單一事務中建立產品和圖片
```

### 關鍵技術

1. **DEFERRABLE 外鍵約束** (PostgreSQL 標準功能)
   - 允許在事務內暫時違反外鍵
   - 只要事務結束前滿足約束即可

2. **PostgreSQL RPC 函數**
   - 在資料庫層實作事務邏輯
   - 確保 ACID 原則

3. **前端記憶體暫存**
   - 圖片先上傳到 Storage 取得 URL
   - 暫存在前端 state
   - 提交時一併送出

---

## 📐 實施計畫

### 階段 1：清理和統一 API 架構

#### 1.1 移除 admin-proxy API
**檔案操作**：
- 🗑️ 刪除 `src/app/api/admin-proxy/` 整個目錄
- ✏️ 修改所有使用 admin-proxy 的前端頁面

**受影響檔案**：
```bash
src/app/admin/products/add/page.tsx
src/app/admin/products/[id]/edit/page.tsx
# 搜尋所有使用 '/api/admin-proxy' 的檔案
```

**替換方式**：
```typescript
// 舊
await fetch('/api/admin-proxy/products', { method: 'POST' })

// 新
await fetch('/api/admin/products', { method: 'POST' })
```

#### 1.2 統一中間件使用
**原則**：
- 管理端 API：`requireAdmin` （不包含 withErrorHandler）
- 公開 API：`withErrorHandler`
- 需要時顯式包裝

**修正範例**：
```typescript
// ❌ 錯誤：誤以為 requireAdmin 已含 withErrorHandler
export const POST = requireAdmin(handlePOST)

// ✅ 正確：顯式包裝
export const POST = requireAdmin(
  withErrorHandler(handlePOST, { module: 'ProductAPI' })
)
```

#### 1.3 移除舊的權限中間件
**檔案**：
- 🗑️ `src/lib/middleware/admin-auth-middleware.ts`

**修正受影響檔案**：
```typescript
// 替換所有 checkAdminPermission → requireAdmin
```

---

### 階段 2：資料庫結構優化

#### 2.1 修改外鍵為 DEFERRABLE

**SQL 腳本**：
```sql
-- 檔案：scripts/refactor-product-images-constraints.sql

-- 移除現有外鍵約束
ALTER TABLE product_images
DROP CONSTRAINT IF EXISTS fk_product_images_product_id;

-- 新增 DEFERRABLE 外鍵
ALTER TABLE product_images
ADD CONSTRAINT fk_product_images_product_id
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- 說明：
-- DEFERRABLE: 可以延遲檢查
-- INITIALLY DEFERRED: 預設在事務結束時檢查
-- 這允許在事務中先插入圖片，再插入產品
```

**執行方式**：
```bash
# 在 Supabase Dashboard > SQL Editor 中執行
```

#### 2.2 新增產品狀態欄位（可選）

**目的**：支援未來可能的草稿、歸檔功能

```sql
-- 新增狀態欄位
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
CHECK (status IN ('draft', 'active', 'archived'));

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 說明：
-- draft: 草稿（保留給未來使用）
-- active: 正常啟用
-- archived: 已歸檔
```

---

### 階段 3：實作事務式產品建立

#### 3.1 建立 PostgreSQL 事務函數

**檔案**：`scripts/create-product-with-images-function.sql`

```sql
-- 建立事務式產品建立函數
CREATE OR REPLACE FUNCTION create_product_with_images(
  product_data JSONB,
  images_data JSONB
) RETURNS JSONB AS $$
DECLARE
  product_id UUID;
  product_result JSONB;
  images_result JSONB;
BEGIN
  -- 1. 插入產品
  INSERT INTO products (
    id,
    name,
    description,
    category,
    price,
    price_unit,
    unit_quantity,
    stock,
    sku,
    is_active,
    is_on_sale,
    original_price,
    sale_end_date
  ) VALUES (
    (product_data->>'id')::UUID,
    product_data->>'name',
    product_data->>'description',
    product_data->>'category',
    (product_data->>'price')::DECIMAL,
    product_data->>'priceUnit',
    (product_data->>'unitQuantity')::INTEGER,
    (product_data->>'inventory')::INTEGER,
    NULLIF(product_data->>'sku', ''),
    COALESCE((product_data->>'isActive')::BOOLEAN, true),
    COALESCE((product_data->>'isOnSale')::BOOLEAN, false),
    (product_data->>'originalPrice')::DECIMAL,
    (product_data->>'saleEndDate')::TIMESTAMPTZ
  ) RETURNING id INTO product_id;

  -- 2. 批量插入圖片
  IF jsonb_array_length(images_data) > 0 THEN
    INSERT INTO product_images (
      product_id,
      url,
      path,
      alt,
      position,
      size,
      width,
      height,
      file_size
    )
    SELECT
      product_id,
      (image->>'url')::TEXT,
      (image->>'path')::TEXT,
      COALESCE(image->>'alt', ''),
      COALESCE((image->>'position')::INTEGER, 0),
      COALESCE(image->>'size', 'medium'),
      (image->>'width')::INTEGER,
      (image->>'height')::INTEGER,
      (image->>'file_size')::INTEGER
    FROM jsonb_array_elements(images_data) AS image;
  END IF;

  -- 3. 查詢完整產品資料
  SELECT row_to_json(p.*) INTO product_result
  FROM products p
  WHERE p.id = product_id;

  -- 4. 查詢圖片資料
  SELECT jsonb_agg(row_to_json(pi.*)) INTO images_result
  FROM product_images pi
  WHERE pi.product_id = product_id
  ORDER BY pi.position;

  -- 5. 返回結果
  RETURN jsonb_build_object(
    'product', product_result,
    'images', COALESCE(images_result, '[]'::jsonb),
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  -- 錯誤處理
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql;

-- 賦予執行權限
GRANT EXECUTE ON FUNCTION create_product_with_images TO authenticated;
```

#### 3.2 建立新的 API 端點

**檔案**：`src/app/api/admin/products/create-with-images/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { ValidationError } from '@/lib/errors'
import { created } from '@/lib/api-response'
import { getSupabaseAdmin } from '@/lib/database/supabase-auth'
import { apiLogger } from '@/lib/logger'
import { z } from 'zod'

const ProductWithImagesSchema = z.object({
  product: z.object({
    id: z.string().uuid(),
    name: z.string().min(1, '產品名稱不能為空'),
    description: z.string().min(1, '產品描述不能為空'),
    category: z.string().min(1, '產品分類不能為空'),
    price: z.number().min(0, '價格不能為負'),
    priceUnit: z.string().default('斤'),
    unitQuantity: z.number().int().positive().default(1),
    inventory: z.number().int().min(0, '庫存不能為負'),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
    isOnSale: z.boolean().default(false),
    originalPrice: z.number().optional(),
    saleEndDate: z.string().optional(),
  }),
  images: z.array(z.object({
    url: z.string().url(),
    path: z.string(),
    alt: z.string().optional(),
    position: z.number().int().min(0).optional(),
    size: z.enum(['thumbnail', 'medium', 'large']).default('medium'),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    file_size: z.number().int().positive().optional(),
  })).default([])
})

async function handlePOST(request: NextRequest, { user }: { user: any }) {
  const body = await request.json()

  const validation = ProductWithImagesSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new ValidationError(`資料驗證失敗: ${errors}`)
  }

  const { product, images } = validation.data

  apiLogger.info('開始事務式建立產品', {
    metadata: {
      productId: product.id,
      imageCount: images.length,
      userId: user.id
    }
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('Supabase admin client 未配置')
  }

  const { data, error } = await supabase.rpc('create_product_with_images', {
    product_data: product,
    images_data: images
  }) as { data: any; error: any }

  if (error) {
    apiLogger.error('事務式建立產品失敗', error, {
      metadata: { productId: product.id }
    })
    throw error
  }

  if (!data.success) {
    throw new Error(data.error || '建立產品失敗')
  }

  apiLogger.info('產品建立成功', {
    metadata: {
      productId: product.id,
      imageCount: images.length
    }
  })

  return created(data, '產品建立成功')
}

export const POST = requireAdmin(
  withErrorHandler(handlePOST, {
    module: 'ProductTransactionalAPI',
    enableAuditLog: true
  })
)
```

---

### 階段 4：前端重構

#### 4.1 修改新增產品頁面

**檔案**：`src/app/admin/products/add/page.tsx`

**變更重點**：

1. **移除草稿建立邏輯**：
```typescript
// ❌ 刪除整個 useEffect 中的草稿建立
useEffect(() => {
  const createDraftProduct = async () => { ... }
}, [])
```

2. **改用記憶體暫存圖片**：
```typescript
const [productId] = useState(() => crypto.randomUUID())
const [tempImages, setTempImages] = useState<TempImage[]>([])

// 圖片上傳後暫存
const handleImagesChange = (uploadedImages: TempImage[]) => {
  setTempImages(uploadedImages)
}
```

3. **修改提交邏輯**：
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const payload = {
    product: {
      id: productId,
      name: formData.name,
      description: formData.description,
      // ... 其他欄位
    },
    images: tempImages
  }

  // 使用新的事務 API
  const response = await fetch('/api/admin/products/create-with-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (response.ok) {
    router.push('/admin/products')
  }
}
```

#### 4.2 修改圖片管理元件

**檔案**：`src/components/features/products/ProductImageManager.tsx`

**新增模式支援**：

```typescript
interface ProductImageManagerProps {
  productId: string
  mode?: 'database' | 'memory'  // 新增模式屬性
  onImagesChange?: (images: TempImage[]) => void
}

export default function ProductImageManager({
  productId,
  mode = 'database',  // 預設資料庫模式（編輯產品）
  onImagesChange
}: ProductImageManagerProps) {

  if (mode === 'memory') {
    // 記憶體模式：新產品建立
    return <MemoryImageManager
      onImagesChange={onImagesChange}
    />
  }

  // 資料庫模式：編輯現有產品
  return <DatabaseImageManager
    productId={productId}
    onImagesChange={onImagesChange}
  />
}
```

**MemoryImageManager 實作**：

```typescript
function MemoryImageManager({ onImagesChange }) {
  const [images, setImages] = useState<TempImage[]>([])

  const handleUpload = async (files: FileList) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      // 1. 上傳到 Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', 'products')
      formData.append('entityId', 'temp')  // 臨時 ID

      const response = await fetch('/api/upload/unified', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      // 2. 返回圖片資訊（不寫入 product_images）
      return {
        url: result.data.image.url,
        path: result.data.image.path,
        alt: file.name,
        position: images.length,
        size: 'medium'
      }
    })

    const uploadedImages = await Promise.all(uploadPromises)
    const newImages = [...images, ...uploadedImages]

    setImages(newImages)
    onImagesChange?.(newImages)  // 通知父元件
  }

  // ... 拖放、刪除等功能
}
```

---

### 階段 5：測試和驗證

#### 5.1 單元測試

**測試 PostgreSQL 函數**：
```sql
-- 測試：正常建立
SELECT create_product_with_images(
  '{"id": "123e4567-e89b-12d3-a456-426614174000", "name": "測試產品", ...}'::jsonb,
  '[{"url": "https://...", "path": "..."}]'::jsonb
);

-- 驗證：產品和圖片都被建立
SELECT * FROM products WHERE id = '123e4567-e89b-12d3-a456-426614174000';
SELECT * FROM product_images WHERE product_id = '123e4567-e89b-12d3-a456-426614174000';

-- 測試：錯誤處理（name 重複）
-- 應該回滾整個事務
```

#### 5.2 整合測試

**測試流程**：
1. 登入管理員帳號
2. 進入新增產品頁面
3. 上傳 3 張圖片（驗證記憶體暫存）
4. 填寫產品資訊
5. 提交表單
6. 驗證：
   - 產品正確建立
   - 圖片正確關聯
   - 沒有草稿產品殘留

#### 5.3 錯誤情境測試

**測試情境**：
1. 圖片上傳成功，但產品建立失敗 → 事務回滾
2. 產品建立成功，但圖片關聯失敗 → 事務回滾
3. 使用者中途放棄 → 無垃圾資料

#### 5.4 效能測試

**測試項目**：
- 建立 1 個產品 + 10 張圖片：< 500ms
- 並發建立 10 個產品：無死鎖
- 資料庫連接池正常

---

## 📊 執行檢查清單

### 階段 1：API 清理
- [ ] 刪除 `src/app/api/admin-proxy/` 目錄
- [ ] 更新所有使用 admin-proxy 的前端程式碼
- [ ] 刪除 `src/lib/middleware/admin-auth-middleware.ts`
- [ ] 修正所有 requireAdmin 的使用方式
- [ ] 修正錯誤的註釋

### 階段 2：資料庫優化
- [ ] 執行 DEFERRABLE 外鍵 SQL
- [ ] 驗證外鍵約束正確
- [ ] （可選）新增 status 欄位

### 階段 3：事務 API
- [ ] 建立 PostgreSQL 函數
- [ ] 建立 `/api/admin/products/create-with-images` 端點
- [ ] 測試 API 正常運作

### 階段 4：前端重構
- [ ] 修改 `add/page.tsx` - 移除草稿邏輯
- [ ] 修改 `ProductImageManager.tsx` - 新增記憶體模式
- [ ] 測試圖片上傳和暫存
- [ ] 測試完整建立流程

### 階段 5：測試
- [ ] 單元測試 PostgreSQL 函數
- [ ] 整合測試新增產品流程
- [ ] 錯誤情境測試
- [ ] 效能測試
- [ ] 清理測試資料

---

## 🚀 執行順序

```
Day 1 (4 hours):
├─ 階段 1: API 清理 (2h)
└─ 階段 2: 資料庫優化 (2h)

Day 2 (4 hours):
├─ 階段 3: 事務 API (2h)
├─ 階段 4: 前端重構 (1.5h)
└─ 階段 5: 測試驗證 (0.5h)
```

---

## 📝 技術決策記錄

### 為什麼使用 DEFERRABLE 外鍵？

**選項比較**：
1. ❌ 移除外鍵：失去資料完整性保護
2. ❌ 繼續使用草稿：留下垃圾資料
3. ✅ DEFERRABLE 外鍵：PostgreSQL 標準功能，平衡兩者

### 為什麼使用 PostgreSQL 函數而非應用層事務？

**原因**：
- Supabase JS Client 不支援完整事務控制
- RPC 函數在資料庫層執行，效能更好
- 確保 ACID 原則不被破壞

### 為什麼前端使用記憶體暫存？

**原因**：
- 避免上傳到 product_images 表（外鍵問題）
- 圖片已上傳到 Storage（有 URL）
- 提交時一併送出，確保一致性

---

## ⚠️ 風險和注意事項

### 風險 1：DEFERRABLE 外鍵的限制
**風險**：如果在事務外直接插入，仍會失敗
**緩解**：確保所有插入都通過 RPC 函數

### 風險 2：前端暫存資料遺失
**風險**：頁面重新整理會遺失已上傳圖片
**緩解**：
- 提醒使用者不要重新整理
- （未來）使用 localStorage 暫存

### 風險 3：孤兒圖片
**風險**：上傳圖片後放棄建立，Storage 中有孤兒檔案
**緩解**：
- 定期清理任務
- 記錄上傳時間，清理超過 24 小時未關聯的圖片

---

## 📚 參考資料

- PostgreSQL DEFERRABLE Constraints: https://www.postgresql.org/docs/current/sql-set-constraints.html
- Supabase RPC: https://supabase.com/docs/guides/database/functions
- ACID Transactions: https://en.wikipedia.org/wiki/ACID

---

## 🎯 成功標準

重構完成後應達到：
1. ✅ 無草稿產品殘留
2. ✅ 產品建立符合 ACID 原則
3. ✅ API 架構統一清晰
4. ✅ 中間件使用正確
5. ✅ 所有測試通過
6. ✅ 無效能退化

---

**最後更新**: 2025-09-28
**負責人**: Claude Code
**審核人**: 待定