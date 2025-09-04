The orignal prompt is from: https://www.dzombak.com/blog/2025/08/getting-good-results-from-claude-code/

# Development Guidelines

## Philosophy

### Core Beliefs

- **Incremental progress over big bangs** - Small changes that compile and pass tests
- **Learning from existing code** - Study and plan before implementing
- **Pragmatic over dogmatic** - Adapt to project reality
- **Clear intent over clever code** - Be boring and obvious
- **使用繁體中文**

### Simplicity Means

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

## Process

### 1. Planning & Staging

Break complex work into 3-5 stages. Document in `IMPLEMENTATION_PLAN.md`:

```markdown
## Stage N: [Name]
**Goal**: [Specific deliverable]
**Success Criteria**: [Testable outcomes]
**Tests**: [Specific test cases]
**Status**: [Not Started|In Progress|Complete]
```
- Update status as you progress
- Remove file when all stages are done

### 2. Implementation Flow

1. **Understand** - Study existing patterns in codebase
2. **Test** - Write test first (red)
3. **Implement** - Minimal code to pass (green)
4. **Refactor** - Clean up with tests passing
5. **Commit** - With clear message linking to plan

### 3. When Stuck (After 3 Attempts)

**CRITICAL**: Maximum 3 attempts per issue, then STOP.

1. **Document what failed**:
   - What you tried
   - Specific error messages
   - Why you think it failed

2. **Research alternatives**:
   - Find 2-3 similar implementations
   - Note different approaches used

3. **Question fundamentals**:
   - Is this the right abstraction level?
   - Can this be split into smaller problems?
   - Is there a simpler approach entirely?

4. **Try different angle**:
   - Different library/framework feature?
   - Different architectural pattern?
   - Remove abstraction instead of adding?

## Technical Standards

### Architecture Principles

- **Composition over inheritance** - Use dependency injection
- **Interfaces over singletons** - Enable testing and flexibility
- **Explicit over implicit** - Clear data flow and dependencies
- **Test-driven when possible** - Never disable tests, fix them

### Code Quality

- **Every commit must**:
  - Compile successfully
  - Pass all existing tests
  - Include tests for new functionality
  - Follow project formatting/linting
  - Use project logger system (no console.log)

- **Before committing**:
  - Run formatters/linters
  - Self-review changes
  - Ensure commit message explains "why"

### Logging Standards

**專案 console.log 替換 100% 完成** - 所有應用程式碼已使用統一 logger 系統 🎊 (2025-09-03 完成)
- ✅ 所有 API 路由 (9個檔案，35處)
- ✅ 所有核心服務 (1個檔案，1處)  
- ✅ 所有 React 元件 (8個檔案，10處)
- ✅ 所有工具庫和設定 (9個檔案，25處)
- ✅ 所有頁面元件 (9個檔案，16處)
- 📊 總計：36個檔案，105處 console.* → 結構化 logger

- **NEVER use console.log/warn/error** - Use the project's logger system instead
- **Import the appropriate logger**:
  ```typescript
  import { logger, apiLogger, dbLogger, cacheLogger, authLogger } from '@/lib/logger'
  ```
- **Use appropriate log levels**:
  - `logger.debug()` - Development debugging info
  - `logger.info()` - General information and user actions  
  - `logger.warn()` - Warnings that don't break functionality
  - `logger.error()` - Errors with recovery possible
  - `logger.fatal()` - Critical system errors
- **Provide context**: Always include relevant metadata in log context
- **Use module-specific loggers**:
  - `apiLogger` for API routes (已廣泛應用)
  - `dbLogger` for database operations
  - `cacheLogger` for cache operations
  - `authLogger` for authentication logic
- **錯誤自動記錄**: 使用 `withErrorHandler` 中間件時，錯誤會自動記錄到適當級別

### API Error Handling Standards

**專案 API 錯誤處理覆蓋率 100% 達成** - 所有 API 路由已使用統一錯誤處理系統 🎯 (2025-09-04 完成)
- ✅ 所有核心 API 路由 (35個檔案)
- ✅ 所有系統管理 API (5個檔案)  
- ✅ 所有新版本 API (/api/v1/)
- 📊 總計：40個 API 路由檔案，從 58% → 100% 覆蓋率

**重要提醒**：
- requireAuth 和 requireAdmin 已內建 withErrorHandler，不要重複包裝
- 所有錯誤都會自動記錄到 apiLogger，無需手動記錄
- 使用 MethodNotAllowedError 處理不支援的 HTTP 方法

#### Logger 使用範例

**API 路由日誌記錄**:
```typescript
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { ValidationError } from '@/lib/errors'

// ✅ 正確：使用 apiLogger 記錄 API 操作
async function handlePOST(req: NextRequest) {
  apiLogger.info('開始建立新資源', {
    module: 'ResourceAPI',
    action: 'create',
    requestId: req.headers.get('x-request-id')
  })
  
  try {
    const result = await service.create(data)
    apiLogger.info('資源建立成功', {
      module: 'ResourceAPI', 
      action: 'create',
      metadata: { resourceId: result.id }
    })
    return success(result, '建立成功')
  } catch (error) {
    // 錯誤會被 withErrorHandler 自動記錄
    throw new ValidationError('建立失敗')
  }
}

export const POST = withErrorHandler(handlePOST, {
  module: 'ResourceAPI'
})

// ❌ 錯誤：不要使用 console.log
// console.log('Creating resource...') // 禁止
```

**認證系統日誌記錄**:
```typescript
import { authLogger } from '@/lib/logger'

// ✅ 正確：使用 authLogger 記錄認證事件
export async function authenticateUser(token: string) {
  authLogger.info('使用者認證開始', {
    module: 'Auth',
    action: 'authenticate'
  })
  
  try {
    const user = await verifyToken(token)
    authLogger.info('使用者認證成功', {
      module: 'Auth',
      action: 'authenticate', 
      metadata: { userId: user.id }
    })
    return user
  } catch (error) {
    authLogger.error('使用者認證失敗', error as Error, {
      module: 'Auth',
      action: 'authenticate',
      metadata: { tokenPreview: token.substring(0, 10) + '...' }
    })
    throw error
  }
}
```

**資料庫操作日誌記錄**:
```typescript
import { dbLogger } from '@/lib/logger'

// ✅ 正確：使用 dbLogger 記錄資料庫操作
export class ProductService {
  async findById(id: string) {
    const timer = dbLogger.timer('查詢產品')
    
    try {
      dbLogger.debug('開始查詢產品', {
        module: 'ProductService',
        action: 'findById',
        metadata: { productId: id }
      })
      
      const result = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (result.error) {
        dbLogger.error('產品查詢失敗', result.error as Error, {
          module: 'ProductService',
          action: 'findById',
          metadata: { productId: id }
        })
        throw ErrorFactory.fromSupabaseError(result.error)
      }
      
      const duration = timer.end({ metadata: { productId: id } })
      dbLogger.info(`產品查詢完成 (${duration.toFixed(2)}ms)`, {
        module: 'ProductService',
        action: 'findById',
        metadata: { productId: id, found: !!result.data }
      })
      
      return result.data
    } catch (error) {
      timer.end()
      throw error
    }
  }
}
```

**React 元件錯誤處理**:
```typescript
import { logger } from '@/lib/logger'
import React from 'react'

// ✅ 正確：使用 logger.fatal 記錄嚴重錯誤
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.fatal('React 元件發生嚴重錯誤', error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        errorMessage: error.message,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      }
    })
  }
}

// ❌ 錯誤：不要使用 console.error
// console.error('Component error:', error) // 禁止
```

**工具函數日誌記錄**:
```typescript
import { logger } from '@/lib/logger'

// ✅ 正確：使用適當的日誌級別
export function processImageUpload(file: File) {
  logger.info('開始處理圖片上傳', {
    module: 'ImageUtils',
    action: 'processUpload',
    metadata: { 
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type 
    }
  })
  
  if (file.size > MAX_FILE_SIZE) {
    logger.warn('圖片檔案過大', {
      module: 'ImageUtils', 
      action: 'processUpload',
      metadata: { 
        fileName: file.name,
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE 
      }
    })
    throw new ValidationError('圖片檔案不能超過 10MB')
  }
  
  // 處理邏輯...
}
```

### Error Handling

**專案已實施統一錯誤處理系統** - 請使用現有系統而不要建立新的錯誤處理機制

- **使用統一錯誤類別**: 從 `@/lib/errors` 匯入標準錯誤類別
- **使用錯誤處理中間件**: 在 API 路由中使用 `withErrorHandler`
- **使用統一回應格式**: 從 `@/lib/api-response` 匯入回應工具
- **整合 logger 系統**: 所有錯誤自動記錄到適當的日誌級別
- **包含除錯上下文**: 每個錯誤都有追蹤 ID 和詳細上下文
- **Never silently swallow exceptions** - 所有例外都應適當處理和記錄

#### 可用的錯誤類型

- `ValidationError` - 輸入驗證失敗 (400)
- `AuthorizationError` - 權限不足 (403) 
- `NotFoundError` - 資源不存在 (404)
- `MethodNotAllowedError` - HTTP 方法不支援 (405) ← 新增
- `DatabaseError` - 資料庫操作失敗 (500)
- `ErrorFactory.fromSupabaseError()` - 自動轉換 Supabase 錯誤

**處理不支援的 HTTP 方法**：
```typescript
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError(`不支援的方法: ${request.method}`)
}

export const PUT = withErrorHandler(handleUnsupportedMethod, { module: 'YourAPI' })
```

#### 錯誤處理使用範例

**API 路由使用錯誤處理中間件**:
```typescript
import { withErrorHandler } from '@/lib/error-handler'
import { success, created } from '@/lib/api-response'
import { ValidationError, NotFoundError, ErrorFactory } from '@/lib/errors'

async function handlePOST(request: NextRequest) {
  const data = await request.json()
  
  // 使用標準錯誤類別
  if (!data.title) {
    throw new ValidationError('標題為必填欄位')
  }
  
  const result = await service.create(data)
  return created(result, '建立成功')
}

// 導出時使用中間件
export const POST = withErrorHandler(handlePOST, {
  module: 'YourModule',
  enableAuditLog: true
})
```

**服務層錯誤處理**:
```typescript
import { ErrorFactory, DatabaseError } from '@/lib/errors'
import { dbLogger } from '@/lib/logger'

try {
  return await database.query(sql)
} catch (error) {
  // 將資料庫錯誤轉換為統一格式
  throw ErrorFactory.fromSupabaseError(error, {
    module: 'YourService',
    action: 'queryOperation'
  })
}
```

## Decision Framework

When multiple valid approaches exist, choose based on:

1. **Testability** - Can I easily test this?
2. **Readability** - Will someone understand this in 6 months?
3. **Consistency** - Does this match project patterns?
4. **Simplicity** - Is this the simplest solution that works?
5. **Reversibility** - How hard to change later?

## Project Integration

### API Route Development

**統一開發模式** - 所有新的 API 路由都應遵循以下模式:

1. **使用錯誤處理中間件**:
   ```typescript
   import { withErrorHandler } from '@/lib/error-handler'
   
   async function handleMethod(request: NextRequest, params?: any) {
     // 業務邏輯 - 直接拋出錯誤，中間件會處理
     if (!isValid) throw new ValidationError('驗證失敗')
     
     const result = await service.operation()
     return success(result, '操作成功')
   }
   
   export const METHOD = withErrorHandler(handleMethod, {
     module: 'YourModule',
     enableAuditLog: true // 根據需要
   })
   ```

2. **使用統一回應格式**:
   ```typescript
   import { success, created, successWithPagination } from '@/lib/api-response'
   
   // 一般成功回應
   return success(data, '操作成功')
   
   // 建立資源回應
   return created(resource, '建立成功')
   
   // 分頁回應
   return successWithPagination(paginatedResult, '查詢成功')
   ```

3. **錯誤拋出標準**:
   - 驗證錯誤: `throw new ValidationError('錯誤訊息')`
   - 找不到資源: `throw new NotFoundError('資源不存在')`
   - 權限錯誤: `throw new AuthorizationError('權限不足')`
   - 資料庫錯誤: `throw ErrorFactory.fromSupabaseError(error)`

#### 動態路由參數處理 (Next.js 15+)

**重要**：Next.js 15 中，動態路由參數是 Promise：

```typescript
// ✅ 正確：等待 params Promise
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // 必須 await
  // 使用 id...
}

// ❌ 錯誤：直接使用 params
async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }  // 這會造成類型錯誤
) {
  const { id } = params
}
```

### 服務層開發標準

**專案已實施統一服務架構** - 所有新服務都應遵循以下模式：

1. **使用基礎介面**:
   ```typescript
   import { BaseService, PaginatedService, SearchableService } from '@/lib/base-service'
   
   // 定義服務介面
   interface IYourService extends BaseService<EntityType, CreateDTO, UpdateDTO> {
     // 自定義方法
   }
   ```

2. **選擇適當的基礎類別**:
   ```typescript
   // Supabase 服務
   import { AbstractSupabaseService } from '@/lib/abstract-supabase-service'
   
   class YourSupabaseService extends AbstractSupabaseService<Entity, CreateDTO, UpdateDTO> {
     constructor() {
       super({
         tableName: 'your_table',
         useAdminClient: true,
         enableCache: true
       })
     }
   }
   
   // JSON 檔案服務
   import { AbstractJsonService } from '@/lib/abstract-json-service'
   
   class YourJsonService extends AbstractJsonService<Entity, CreateDTO, UpdateDTO> {
     constructor() {
       super({
         filePath: path.join(process.cwd(), 'src/data/your-data.json'),
         enableBackup: true
       })
     }
   }
   ```

3. **統一方法命名**:
   - `findAll()` - 取得所有資料
   - `findById(id)` - 根據 ID 取得資料  
   - `create(data)` - 建立新資料
   - `update(id, data)` - 更新資料
   - `delete(id)` - 刪除資料
   - `search(query)` - 搜尋資料（如果實作 SearchableService）
   - `findAllPaginated(options)` - 分頁查詢（如果實作 PaginatedService）

4. **向後相容性**:
   ```typescript
   // 建立適配器以相容舊介面
   class LegacyServiceAdapter {
     constructor(private service: INewService) {}
     
     async getItems() { return this.service.findAll() }
     async addItem(data) { return this.service.create(data) }
     // ... 其他舊方法對應
   }
   ```

### Learning the Codebase

- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing test patterns
- **參考現有 API 路由**: 查看 `/api/culture` 作為統一錯誤處理的範例
- **參考統一服務架構**: 查看 `src/services/v2/productService.ts` 作為新服務層的範例

### Tooling

- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification

## Quality Gates

### Definition of Done

- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] **No console.log/warn/error in production code** - Use project logger system
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### API 開發完成檢查清單

- [ ] 使用適當的錯誤處理中間件 (requireAuth/requireAdmin/optionalAuth/withErrorHandler)
- [ ] 所有錯誤使用標準錯誤類型 (ValidationError, NotFoundError, MethodNotAllowedError 等)
- [ ] 動態路由參數正確使用 await (Next.js 15+)
- [ ] 使用 apiLogger 而非 console.log
- [ ] 回應使用統一格式 (success, created, successWithPagination)
- [ ] TypeScript 類型檢查通過
- [ ] 處理不支援的 HTTP 方法時返回 MethodNotAllowedError
- [ ] 不要重複包裝權限中間件和 withErrorHandler

### Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic

## Important Reminders

**NEVER**:
- Use `--no-verify` to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn't compile
- Make assumptions - verify with existing code
- Use console.log/warn/error - use the project logger system instead

**ALWAYS**:
- Commit working code incrementally
- Update plan documentation as you go
- Learn from existing implementations
- Stop after 3 failed attempts and reassess
- Use appropriate logger (apiLogger, dbLogger, etc.) with proper context
- **檢查 console.* 使用**: 定期執行 `grep -r "console\." src/ --exclude-dir=node_modules` 確保沒有新的 console 使用

## API 開發準則

### 統一權限中間件系統（已實作）

**重要**：權限中間件已包含錯誤處理，無需重複包裝！

**使用新的權限中間件**，取代手動的 getCurrentUser() 檢查：

```typescript
// 舊的方式（不推薦）
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: '未認證' }, { status: 401 })
  }
  // 業務邏輯...
}

// 新的方式（推薦）
import { requireAuth } from '@/lib/api-middleware'

export const GET = requireAuth(async (req, { user }) => {
  // user 已保證存在，直接使用
  // 業務邏輯...
  return success(data, '查詢成功')
})
```

### 可用的權限中間件

- **requireAuth**: 需要使用者登入
- **requireAdmin**: 需要管理員權限
- **optionalAuth**: 可選認證（公開 API 但可能需要使用者資訊）

```typescript
// ✅ 正確：直接使用權限中間件
export const GET = requireAuth(handleGET)
export const POST = requireAdmin(handlePOST)
export const DELETE = optionalAuth(handleDELETE)

// ❌ 錯誤：重複包裝（會造成雙重錯誤處理）
export const GET = requireAuth(withErrorHandler(handleGET, { module: 'API' }))

// ✅ 正確：非權限相關的 API 使用 withErrorHandler
export const GET = withErrorHandler(handlePublicGET, { module: 'PublicAPI' })
```

**中間件優先級**：
1. 如果需要認證：使用 `requireAuth` 或 `requireAdmin`
2. 如果是公開 API 但可能有用戶：使用 `optionalAuth`
3. 如果是純公開 API：使用 `withErrorHandler`

### 新版本 API 結構（/api/v1/）

新的 API 應遵循版本化結構：

```typescript
// 檔案位置：src/app/api/v1/[resource]/route.ts
import { requireAuth, success, ValidationError } from '@/lib/api-middleware'
import { z } from 'zod'

// 1. 定義驗證架構
const CreateSchema = z.object({
  name: z.string().min(1, '名稱不能為空'),
  email: z.string().email('Email 格式不正確')
})

// 2. 實作處理函數
async function handlePOST(req: NextRequest, { user }: { user: any }) {
  const body = await req.json()
  const result = CreateSchema.safeParse(body)
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ')
    throw new ValidationError(`驗證失敗: ${errors}`)
  }
  
  // 業務邏輯
  const data = await service.create(result.data)
  return success(data, '建立成功')
}

// 3. 匯出處理器
export const POST = requireAuth(handlePOST)
```

### API 開發最佳實踐

1. **使用 Zod 驗證**：所有輸入都應該驗證
2. **統一回應格式**：使用 success(), created(), error() 等工具
3. **適當的日誌記錄**：使用 apiLogger 記錄重要操作
4. **錯誤處理**：拋出適當的錯誤類型（ValidationError, NotFoundError 等）
5. **類型安全**：使用 TypeScript 確保類型安全

### 參考範例

查看 `src/app/api/v1/example/route.ts` 了解完整的實作範例。

##
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.