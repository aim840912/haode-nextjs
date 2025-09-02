# API 中間件系統

統一的 API 權限和功能中間件，減少重複程式碼，提升開發效率和程式碼品質。

## 🎯 核心理念

- **統一性**：所有 API 使用相同的認證和授權模式
- **簡潔性**：減少樣板程式碼，專注業務邏輯
- **安全性**：統一的權限檢查，降低安全漏洞風險
- **可維護性**：集中管理權限邏輯，易於修改和擴展

## 📦 可用中間件

### 權限中間件

#### `requireAuth` - 需要使用者登入
```typescript
import { requireAuth } from '@/lib/api-middleware'

export const GET = requireAuth(async (req, { user }) => {
  // user 保證不為 null
  console.log(user.id, user.email)
  return success(data, 'success')
})
```

#### `requireAdmin` - 需要管理員權限
```typescript
import { requireAdmin } from '@/lib/api-middleware'

export const DELETE = requireAdmin(async (req, { user, isAdmin }) => {
  // user 保證是管理員，isAdmin 永遠是 true
  return success(null, '刪除成功')
})
```

#### `optionalAuth` - 可選認證
```typescript
import { optionalAuth } from '@/lib/api-middleware'

export const GET = optionalAuth(async (req, { user }) => {
  // user 可能是 null 或實際使用者
  if (user) {
    return success(personalizedData, 'success')
  } else {
    return success(publicData, 'success')
  }
})
```

### 組合中間件

#### `authWithCache` - 認證 + 快取
```typescript
import { authWithCache } from '@/lib/api-middleware'

export const GET = authWithCache(async (req, { user }) => {
  // 自動快取回應，需要使用者登入
  return success(expensiveData, 'success')
}, { ttl: 300 })
```

#### `adminWithCache` - 管理員 + 快取
```typescript
import { adminWithCache } from '@/lib/api-middleware'

export const GET = adminWithCache(async (req, { user, isAdmin }) => {
  // 自動快取回應，需要管理員權限
  return success(adminData, 'success')
}, { ttl: 600 })
```

#### `publicWithCache` - 公開 + 快取
```typescript
import { publicWithCache } from '@/lib/api-middleware'

export const GET = publicWithCache(async (req) => {
  // 自動快取回應，不需要登入
  return success(publicData, 'success')
}, { ttl: 1800 })
```

## 🔧 進階用法

### 組合多個中間件
```typescript
import { compose, requireAuth, withApiCache } from '@/lib/api-middleware'

// 手動組合中間件
export const GET = compose(
  requireAuth,
  withApiCache
)(async (req, { user }) => {
  return success(data, 'success')
})
```

### 自訂權限檢查
```typescript
import { requireAuth } from '@/lib/api-middleware'
import { AuthorizationError } from '@/lib/errors'

export const PUT = requireAuth(async (req, { user, params }) => {
  // 額外的權限檢查
  if (params.id !== user.id && user.role !== 'admin') {
    throw new AuthorizationError('只能修改自己的資料')
  }
  
  return success(updatedData, '更新成功')
})
```

## 📊 使用統計

在開發環境下，系統會自動追蹤中間件使用情況：

```typescript
import { getMiddlewareStats } from '@/lib/api-middleware'

// 開發環境下查看統計
console.log(getMiddlewareStats())
// { requireAuth: 15, requireAdmin: 8, optionalAuth: 3 }
```

## 🚀 最佳實踐

### 1. 選擇適合的中間件
- **公開 API**：使用 `publicWithCache` 或 `withErrorHandler`
- **使用者 API**：使用 `requireAuth` 或 `authWithCache`
- **管理員 API**：使用 `requireAdmin` 或 `adminWithCache`
- **個人化公開內容**：使用 `optionalAuth`

### 2. 錯誤處理
中間件已整合錯誤處理，直接拋出錯誤即可：

```typescript
export const POST = requireAuth(async (req, { user }) => {
  if (!validInput) {
    throw new ValidationError('輸入資料無效')
  }
  // 錯誤會自動被處理和記錄
})
```

### 3. 審計日誌
權限檢查會自動記錄審計日誌，無需手動處理：

```typescript
export const GET = requireAdmin(async (req, { user }) => {
  // 系統會自動記錄：
  // - 誰存取了這個 API
  // - 什麼時候存取
  // - 從哪個 IP 存取
  // - 是否成功通過權限檢查
  return success(sensitiveData, 'success')
})
```

### 4. 參數傳遞
Next.js 的動態路由參數會自動傳遞：

```typescript
// /api/users/[id]/route.ts
export const GET = requireAuth(async (req, { user, params }) => {
  const userId = params.id // 來自路由參數
  // 使用 userId 處理業務邏輯
})
```

## ⚠️ 注意事項

1. **不要重複檢查權限**：中間件已處理權限檢查，業務邏輯中不需要重複
2. **善用 TypeScript**：中間件提供完整的類型定義，多利用 IDE 提示
3. **錯誤統一處理**：使用標準的錯誤類別，系統會自動處理格式化
4. **快取合理使用**：根據資料特性設定適當的 TTL，避免資料過期問題

## 🔄 遷移指南

### 從舊 API 遷移

**舊版本**：
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未認證' }, { status: 401 })
    }
    
    const data = await fetchData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
```

**新版本**：
```typescript
import { requireAuth, success } from '@/lib/api-middleware'

export const GET = requireAuth(async (req, { user }) => {
  const data = await fetchData()
  return success(data, '查詢成功')
})
```

效果：
- ✅ 程式碼減少 70%
- ✅ 統一的錯誤處理
- ✅ 自動的審計日誌
- ✅ 更好的 TypeScript 支援