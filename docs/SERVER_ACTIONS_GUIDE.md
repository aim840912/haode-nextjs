# Server Actions 開發指南

本指南說明如何在本專案中開發和使用 Server Actions,包含最佳實踐、常見模式和範例程式碼。

---

## 📋 目錄

- [什麼是 Server Actions?](#什麼是-server-actions)
- [何時使用 Server Actions](#何時使用-server-actions)
- [基礎設施概覽](#基礎設施概覽)
- [開發新的 Server Action](#開發新的-server-action)
- [最佳實踐](#最佳實踐)
- [常見模式](#常見模式)
- [測試指南](#測試指南)
- [疑難排解](#疑難排解)

---

## 什麼是 Server Actions?

Server Actions 是 Next.js 15 的功能,允許在 Server Components 或 Client Components 中直接調用伺服器端函數。

### 與 API Routes 的差異

| 特性 | API Routes | Server Actions |
|------|-----------|----------------|
| **定義方式** | `export async function GET(req)` | `export async function myAction(data)` |
| **呼叫方式** | `fetch('/api/endpoint')` | `myAction(data)` |
| **類型安全** | 需手動定義 | 自動推導 |
| **表單支援** | 需 JavaScript | 支援漸進式增強 |
| **快取控制** | Response headers | `revalidatePath()` |
| **位置** | `src/app/api/**` | `src/app/actions/**` |

---

## 何時使用 Server Actions

### ✅ 適合使用 Server Actions

- **表單提交**: 建立、更新、刪除資源
- **資料變更**: 任何會修改資料的操作
- **需要認證**: 需要用戶登入的操作
- **需要審計**: 需要記錄操作日誌的行為
- **互動式操作**: 按鈕點擊、切換狀態等

**範例**:
- 建立訂單
- 更新用戶資料
- 刪除產品
- 切換興趣清單
- 上傳檔案

### ❌ 不適合使用 Server Actions

- **純查詢**: GET 操作應使用 API Routes 或 Server Components
- **公開 API**: 需要被外部系統調用的端點
- **Webhook**: 接收第三方服務回調
- **檔案下載**: 需要返回非 JSON 資料
- **串流回應**: 需要 SSE 或 WebSocket

**範例**:
- 取得產品列表 → 使用 Server Components
- 搜尋功能 → 使用 API Routes
- 支付回調 → 使用 API Routes
- 匯出 CSV → 使用 API Routes

---

## 基礎設施概覽

### 檔案結構

```
src/
├── lib/server/              # Server-only 基礎設施
│   ├── auth.ts              # 認證工具
│   ├── action-response.ts   # 回應格式
│   ├── rate-limit.ts        # 速率限制
│   ├── audit-log.ts         # 審計日誌
│   └── index.ts             # 統一匯出
│
└── app/actions/             # Server Actions
    ├── user-interests.ts    # 用戶興趣
    ├── inquiries.ts         # 詢價單
    ├── orders.ts            # 訂單
    └── index.ts             # 統一匯出
```

### 可用工具

從 `@/lib/server` 匯入:

```typescript
import {
  // 認證
  requireAuth,      // 需要登入用戶
  requireAdmin,     // 需要管理員
  auth,             // 可選認證

  // 回應格式
  success,          // 成功回應
  error,            // 錯誤回應
  validationError,  // 驗證錯誤

  // 速率限制
  checkRateLimit,   // 檢查速率限制
  withRateLimit,    // 包裝函數

  // 審計日誌
  logCreate,        // 記錄建立
  logUpdate,        // 記錄更新
  logDelete,        // 記錄刪除
  logStatusChange,  // 記錄狀態變更
} from '@/lib/server'
```

---

## 開發新的 Server Action

### 步驟 1: 建立檔案

在 `src/app/actions/` 建立或編輯對應的檔案:

```typescript
/**
 * 產品 Server Actions
 *
 * 提供產品管理的 Server Actions:
 * - createProductAction - 建立產品
 * - updateProductAction - 更新產品
 */

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  requireAdmin,
  success,
  error,
  validationError,
  logCreate,
} from '@/lib/server'
```

### 步驟 2: 定義驗證 Schema

使用 Zod 定義輸入驗證:

```typescript
const CreateProductSchema = z.object({
  name: z.string().min(1, '產品名稱不能為空'),
  price: z.number().positive('價格必須大於 0'),
  description: z.string().optional(),
  categoryId: z.string().uuid('分類 ID 格式不正確'),
})
```

### 步驟 3: 實作 Action

遵循標準模式:

```typescript
/**
 * 建立產品
 *
 * 需要管理員權限
 *
 * @param data - 產品資料
 * @returns ActionResponse 包含建立的產品
 *
 * @example
 * ```tsx
 * import { createProductAction } from '@/app/actions/products'
 *
 * function CreateProductForm() {
 *   const [isPending, startTransition] = useTransition()
 *
 *   const handleSubmit = async (formData: FormData) => {
 *     startTransition(async () => {
 *       const result = await createProductAction({
 *         name: formData.get('name'),
 *         price: parseFloat(formData.get('price')),
 *         categoryId: formData.get('categoryId'),
 *       })
 *
 *       if (result.success) {
 *         toast.success(result.message)
 *         router.push(`/products/${result.data.id}`)
 *       } else {
 *         toast.error(result.error.message)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export async function createProductAction(data: unknown) {
  try {
    // 1. 認證檢查
    const admin = await requireAdmin()

    // 2. 驗證輸入資料
    const result = CreateProductSchema.safeParse(data)
    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 記錄操作 (可選)
    apiLogger.info('建立產品', {
      metadata: {
        adminId: admin.id,
        productName: result.data.name,
      },
    })

    // 4. 執行業務邏輯
    const product = await productService.create(result.data, admin.id)

    // 5. 審計日誌
    await logCreate(admin, 'product', product.id, {
      newData: {
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
      },
    })

    // 6. Revalidation - 清除相關頁面快取
    revalidatePath('/products')
    revalidatePath('/admin/products')

    // 7. 返回成功回應
    return success(product, '產品建立成功')
  } catch (err) {
    return error(err)
  }
}
```

### 步驟 4: 匯出 Action

在 `src/app/actions/index.ts` 加入匯出:

```typescript
// 產品相關 Actions
export { createProductAction, updateProductAction } from './products'
```

---

## 最佳實踐

### 1. 始終使用 try-catch

```typescript
export async function myAction(data: unknown) {
  try {
    // 業務邏輯
    return success(result, '操作成功')
  } catch (err) {
    return error(err)  // 統一錯誤處理
  }
}
```

### 2. 輸入驗證

```typescript
// ✅ 正確: 使用 Zod safeParse
const result = schema.safeParse(data)
if (!result.success) {
  return validationError(result.error)
}

// ❌ 錯誤: 直接使用 parse (會拋出例外)
const result = schema.parse(data)
```

### 3. 認證在最前面

```typescript
export async function myAction(data: unknown) {
  // ✅ 第一步就檢查認證
  const user = await requireAuth()

  // 然後才驗證輸入
  const result = schema.safeParse(data)
  // ...
}
```

### 4. 明確的 Revalidation

```typescript
// ✅ 正確: 清除所有相關路徑
revalidatePath('/products')              // 列表頁
revalidatePath(`/products/${id}`)        // 詳情頁
revalidatePath('/admin/products')        // 管理員頁面

// ❌ 錯誤: 忘記清除快取
// 用戶可能看到過時資料
```

### 5. 審計關鍵操作

```typescript
// ✅ 記錄審計日誌
await logCreate(user, 'order', order.id, {
  newData: {
    totalAmount: order.totalAmount,
    itemsCount: order.items.length,
  },
})

// 對於非關鍵操作可以跳過
// 例如: 切換 UI 設定、同步本地資料等
```

### 6. 詳細的 JSDoc

```typescript
/**
 * Action 簡要說明
 *
 * 詳細描述:
 * - 誰可以使用 (認證要求)
 * - 會做什麼 (業務邏輯)
 * - 有什麼副作用 (審計、通知等)
 *
 * @param data - 參數說明
 * @returns ActionResponse 說明返回資料
 *
 * @example
 * ```tsx
 * // 完整使用範例
 * ```
 */
```

---

## 常見模式

### 模式 1: 簡單的建立操作

```typescript
export async function createResourceAction(data: unknown) {
  try {
    const user = await requireAuth()
    const result = CreateSchema.safeParse(data)
    if (!result.success) return validationError(result.error)

    const resource = await service.create(user.id, result.data)

    await logCreate(user, 'resource', resource.id, { newData: resource })
    revalidatePath('/resources')

    return success(resource, '建立成功')
  } catch (err) {
    return error(err)
  }
}
```

### 模式 2: 狀態變更操作

```typescript
export async function updateStatusAction(resourceId: string, status: string) {
  try {
    const user = await requireAuth()

    // 取得當前狀態
    const current = await service.getById(resourceId, user.id)
    if (!current) throw new NotFoundError('找不到資源')

    // 更新狀態
    await service.updateStatus(resourceId, status, user.id)

    // 記錄狀態變更
    await logStatusChange(user, 'resource', resourceId, {
      previousData: { status: current.status },
      newData: { status },
    })

    revalidatePath(`/resources/${resourceId}`)
    return success(null, '狀態更新成功')
  } catch (err) {
    return error(err)
  }
}
```

### 模式 3: 刪除操作

```typescript
export async function deleteResourceAction(resourceId: string) {
  try {
    const admin = await requireAdmin()  // 通常需要管理員權限

    // 先取得資料 (用於審計)
    const resource = await service.getById(resourceId)
    if (!resource) throw new NotFoundError('找不到資源')

    // 執行刪除
    await service.delete(resourceId, admin.id)

    // 審計日誌
    await logDelete(admin, 'resource', resourceId, {
      previousData: { name: resource.name },
    })

    revalidatePath('/resources')
    return success({ id: resourceId }, '刪除成功')
  } catch (err) {
    return error(err)
  }
}
```

### 模式 4: 批次操作

```typescript
export async function batchUpdateAction(ids: string[], updates: unknown) {
  try {
    const admin = await requireAdmin()

    const result = UpdateSchema.safeParse(updates)
    if (!result.success) return validationError(result.error)

    // 批次更新
    const results = await Promise.all(
      ids.map(id => service.update(id, result.data, admin.id))
    )

    // 批次審計
    await Promise.all(
      results.map(r =>
        logUpdate(admin, 'resource', r.id, {
          previousData: { /* ... */ },
          newData: result.data,
        })
      )
    )

    revalidatePath('/resources')
    return success({ count: results.length }, `更新了 ${results.length} 筆資料`)
  } catch (err) {
    return error(err)
  }
}
```

### 模式 5: 公開 Action (無需認證)

```typescript
export async function publicAction(data: unknown) {
  try {
    // 1. 無需認證,但可能需要速率限制
    await checkRateLimit({
      identifier: 'public-action',
      action: 'submit',
      maxRequests: 10,
      windowMs: 60 * 1000,
    })

    // 2. 驗證輸入
    const result = PublicSchema.safeParse(data)
    if (!result.success) return validationError(result.error)

    // 3. 業務邏輯
    const resource = await service.createPublic(result.data)

    // 4. 返回最小資訊 (避免洩漏)
    return success(
      { id: resource.id },
      '提交成功,我們會盡快回覆'
    )
  } catch (err) {
    return error(err)
  }
}
```

---

## 測試指南

### 單元測試範例

```typescript
import { createProductAction } from '@/app/actions/products'
import { requireAdmin } from '@/lib/server/auth'
import { productService } from '@/services/core/product/ProductService'

// Mock 依賴
jest.mock('@/lib/server/auth')
jest.mock('@/services/core/product/ProductService')
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('createProductAction', () => {
  it('should create product successfully', async () => {
    // Arrange
    const mockAdmin = { id: 'admin-123', email: 'admin@example.com', isAdmin: true }
    const mockProduct = { id: 'prod-123', name: 'Test Product', price: 100 }

    ;(requireAdmin as jest.Mock).mockResolvedValue(mockAdmin)
    ;(productService.create as jest.Mock).mockResolvedValue(mockProduct)

    // Act
    const result = await createProductAction({
      name: 'Test Product',
      price: 100,
      categoryId: 'cat-123',
    })

    // Assert
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockProduct)
    expect(result.message).toBe('產品建立成功')
  })

  it('should return validation error for invalid data', async () => {
    // Arrange
    const mockAdmin = { id: 'admin-123', email: 'admin@example.com', isAdmin: true }
    ;(requireAdmin as jest.Mock).mockResolvedValue(mockAdmin)

    // Act
    const result = await createProductAction({
      name: '',  // Invalid: empty name
      price: -10,  // Invalid: negative price
    })

    // Assert
    expect(result.success).toBe(false)
    expect(result.error.type).toBe('VALIDATION_ERROR')
  })
})
```

### 整合測試範例

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createProductAction } from '@/app/actions/products'
import ProductCreateForm from '@/components/admin/ProductCreateForm'

describe('Product Creation Flow', () => {
  it('should create product and show success message', async () => {
    // Render
    render(<ProductCreateForm />)

    // Fill form
    fireEvent.change(screen.getByLabelText('產品名稱'), {
      target: { value: 'New Product' },
    })
    fireEvent.change(screen.getByLabelText('價格'), {
      target: { value: '100' },
    })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: '建立' }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('產品建立成功')).toBeInTheDocument()
    })
  })
})
```

---

## 疑難排解

### 問題 1: "Module not found" 錯誤

**錯誤**:
```
Error: Module not found: Can't resolve '@/lib/server'
```

**解決**:
確認 `tsconfig.json` 有設定路徑別名:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 問題 2: TypeScript 類型錯誤

**錯誤**:
```typescript
Property 'data' does not exist on type 'ActionResponse'
```

**解決**:
檢查回應類型,使用 type guard:
```typescript
const result = await myAction(data)

if (result.success) {
  // result.data 可用
  console.log(result.data)
} else {
  // result.error 可用
  console.error(result.error.message)
}
```

### 問題 3: Revalidation 不生效

**症狀**: 更新資料後頁面仍顯示舊資料

**解決**:
1. 確認有調用 `revalidatePath()`
2. 確認路徑正確 (包含所有相關頁面)
3. 檢查是否在 try-catch 之外調用

```typescript
// ✅ 正確
try {
  const result = await service.update()
  revalidatePath('/page')  // 在 try 內
  return success(result)
} catch (err) {
  return error(err)
}

// ❌ 錯誤
try {
  const result = await service.update()
  return success(result)
} catch (err) {
  return error(err)
}
revalidatePath('/page')  // 永遠不會執行
```

### 問題 4: 序列化錯誤

**錯誤**:
```
Error: Only plain objects can be passed to Server Actions
```

**原因**: 試圖傳遞 Date、undefined 或函數

**解決**:
```typescript
// ❌ 錯誤
await myAction({
  date: new Date(),
  optional: undefined,
})

// ✅ 正確
await myAction({
  date: new Date().toISOString(),
  optional: null,
})
```

### 問題 5: 認證失敗

**錯誤**:
```
AuthorizationError: 未授權訪問
```

**檢查清單**:
1. Cookie 是否正確設定?
2. JWT_SECRET 環境變數是否存在?
3. Token 是否過期?
4. 是否在客戶端元件中調用?

```typescript
// ✅ 在客戶端元件中使用
'use client'

import { myAction } from '@/app/actions'

function MyComponent() {
  const handleClick = async () => {
    const result = await myAction(data)
    // ...
  }
}
```

---

## 進階主題

### 樂觀更新

```typescript
'use client'

import { useOptimistic } from 'react'
import { toggleInterestAction } from '@/app/actions'

function ProductCard({ productId, isInterested }) {
  const [optimisticInterested, setOptimisticInterested] = useOptimistic(
    isInterested,
    (state, newState) => newState
  )

  const handleToggle = async () => {
    // 立即更新 UI
    setOptimisticInterested(!optimisticInterested)

    // 實際調用 Action
    const result = await toggleInterestAction({ productId })

    if (!result.success) {
      // 回滾 (自動)
      toast.error(result.error.message)
    }
  }

  return (
    <button onClick={handleToggle}>
      {optimisticInterested ? '已加入' : '加入興趣'}
    </button>
  )
}
```

### 進度追蹤

```typescript
'use client'

import { useTransition } from 'react'

function UploadForm() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await uploadAction(formData)
      // ...
    })
  }

  return (
    <form action={handleSubmit}>
      <button disabled={isPending}>
        {isPending ? '上傳中...' : '上傳'}
      </button>
    </form>
  )
}
```

---

## 參考資料

- [Next.js Server Actions 文檔](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [專案 CLAUDE.md](../CLAUDE.md) - 開發規範
- [遷移報告](./server-actions-migration-report.md) - 遷移詳情
- [架構分析](./architecture/architecture-analysis-report-2025-01-16.md)

---

**最後更新**: 2025-01-16
**版本**: 1.0
