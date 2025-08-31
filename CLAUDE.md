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

**專案已完成 console.log 替換** - 主要 API 路由已使用統一 logger 系統

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

### Error Handling

**專案已實施統一錯誤處理系統** - 請使用現有系統而不要建立新的錯誤處理機制

- **使用統一錯誤類別**: 從 `@/lib/errors` 匯入標準錯誤類別
- **使用錯誤處理中間件**: 在 API 路由中使用 `withErrorHandler`
- **使用統一回應格式**: 從 `@/lib/api-response` 匯入回應工具
- **整合 logger 系統**: 所有錯誤自動記錄到適當的日誌級別
- **包含除錯上下文**: 每個錯誤都有追蹤 ID 和詳細上下文
- **Never silently swallow exceptions** - 所有例外都應適當處理和記錄

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
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

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

##
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

      
      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.