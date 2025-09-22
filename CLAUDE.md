The orignal prompt is from: https://www.dzombak.com/blog/2025/08/getting-good-results-from-claude-code/

# 開發指南

## 🚀 快速參考

### 5 個核心原則
1. **使用繁體中文** - 所有溝通均使用繁體中文
2. **避免不必要地建立檔案** - 優先編輯現有檔案
3. **使用專案日誌系統** - 永不使用 console.log（使用 apiLogger、dbLogger 等）
4. **執行開發前檢查清單** - 程式碼重用、依賴檢查、效能影響
5. **對複雜任務使用 TodoWrite** - 通過狀態更新追蹤進度

### 10 個必須遵循的規則
```bash
# Before any development
npm run type-check && npm run lint  # ✅ Required
grep -r "console\." src/             # ❌ Should be empty

# Before adding dependencies
npm ls | grep similar-package        # Check for duplicates
npm info package-name                # Check maintenance status
npx depcheck                         # Find unused dependencies

# Technical debt detection
🔴 Same logic appears 3+ times       → Extract to shared function
🔴 Component > 200 lines             → Split into smaller components
🔴 Function > 30 lines               → Consider breaking down
🔴 Build time increased > 30s        → Investigate and optimize
```

### 常用指令
```bash
# Development workflow
npm run dev                          # Start development (with Turbopack)
npm run type-check                   # Check TypeScript
npm run lint                         # Check code quality

# Maintenance checks
rm -rf .next/cache                   # Clear build cache
npm audit                            # Security check
npm run analyze                      # Bundle analysis
```

### API 開發模式
```typescript
import { requireAuth, success, ValidationError } from '@/lib/middleware/api-middleware'

export const POST = requireAuth(async (req, { user }) => {
  const data = await req.json()
  if (!isValid(data)) throw new ValidationError('驗證失敗')

  const result = await service.create(data, user.id)
  return success(result, '建立成功')
})
```

---

## 開發理念

### 核心信念

- **漸進式進展優於大爭霸式改變** - 小的變更能編譯並通過測試
- **從現有程式碼中學習** - 在實作前先研究和規劃
- **實用主義優於教條主義** - 適應專案現實
- **清晰意圖優於巧妙程式碼** - 保持無趣和明顯
- **使用繁體中文** - use this languague

### 只有你對答案的自信度大於90%的時候才回答，正確加1分，錯誤扣9分，回答不知道得到0分

### 簡潔的含義

- 每個函數/類別單一職責
- 避免過早抽象化
- 不用巧妙技巧 - 選擇無趣的解決方案
- 如果需要解釋，就太複雜了

## 開發流程

### 1. 規劃與階段分割

將複雜工作分解為 3-5 個階段。使用 TodoWrite 工具追蹤進度：

```typescript
TodoWrite({
  todos: [
    { content: "階段 1: [具體目標]", status: "pending", activeForm: "執行階段 1" },
    { content: "階段 2: [具體目標]", status: "pending", activeForm: "執行階段 2" },
    // ... 最多 5 個階段
  ]
})
```
- 隨著進度更新狀態 (pending → in_progress → completed)
- 每個階段都要有明確的成功標準和可測試的結果

### 2. 實作流程

1. **理解** - 研究程式碼庫中的現有模式
2. **測試** - 先寫測試 (紅燈)
3. **實作** - 最少程式碼通過 (綠燈)
4. **重構** - 在測試通過的情況下清理
5. **提交** - 使用清晰的訊息連結到計劃

### 3. 遇到困難時（嘗試 3 次後）

**重要**：每個問題最多嘗試 3 次，然後停止。

1. **記錄失敗原因**：
   - 你嘗試了什麼
   - 具體的錯誤訊息
   - 你認為為什麼失敗

2. **研究替代方案**：
   - 找到 2-3 個類似的實作
   - 記錄使用的不同方法

3. **質疑基本原則**：
   - 這是否正確的抽象層級？
   - 能否將其分解為更小的問題？
   - 是否有更簡單的方法？

4. **嘗試不同角度**：
   - 不同的函式庫/框架功能？
   - 不同的架構模式？
   - 移除抽象而不是添加？

## 技術標準

### 架構原則

- **組合優於繼承** - 使用依賴注入
- **介面優於單例模式** - 啟用測試和靈活性
- **明確優於隱含** - 清晰的資料流和依賴關係
- **盡可能使用測試驅動** - 永不停用測試，修復它們

### 程式碼品質

- **每次提交必須**：
  - 編譯成功
  - 通過所有現有測試
  - 包含新功能的測試
  - 遵循專案格式化/linting
  - 使用專案日誌系統 (不用 console.log)

- **提交前**：
  - 運行格式化工具/linter
  - 自我審查變更
  - 確保提交訊息解釋「為什麼」

### 日誌標準

**專案 console.log 替換 100% 完成** - 所有應用程式碼已使用統一 logger 系統 🎊 (已完成)
- ✅ 所有 API 路由 (9個檔案，35處)
- ✅ 所有核心服務 (1個檔案，1處)
- ✅ 所有 React 元件 (8個檔案，10處)
- ✅ 所有工具庫和設定 (9個檔案，25處)
- ✅ 所有頁面元件 (9個檔案，16處)
- 📊 總計：36個檔案，105處 console.* → 結構化 logger

- **永不使用 console.log/warn/error** - 使用專案的日誌系統代替
- **匯入適當的日誌系統**：
  ```typescript
  import { logger, apiLogger, dbLogger, cacheLogger, authLogger } from '@/lib/logger'
  ```
- **使用適當的日誌級別**：
  - `logger.debug()` - 開發除錯資訊
  - `logger.info()` - 一般資訊和用戶操作
  - `logger.warn()` - 不會中斷功能的警告
  - `logger.error()` - 可以復原的錯誤
  - `logger.fatal()` - 重大系統錯誤
- **提供上下文**：始終在日誌上下文中包含相關元數據
- **使用模組特定日誌器**：
  - `apiLogger` 用於 API 路由 (已廣泛應用)
  - `dbLogger` 用於資料庫操作
  - `cacheLogger` 用於快取操作
  - `authLogger` 用於認證邏輯
- **錯誤自動記錄**: 使用 `withErrorHandler` 中間件時，錯誤會自動記錄到適當級別

### API 錯誤處理標準

**專案 API 錯誤處理覆蓋率 100% 達成** - 所有 API 路由已使用統一錯誤處理系統 🎯 (已完成)
- ✅ 所有核心 API 路由 (35個檔案)
- ✅ 所有系統管理 API (5個檔案)
- 📊 總計：40個 API 路由檔案，從 58% → 100% 覆蓋率

**重要提醒**：
- requireAuth 和 requireAdmin 已內建 withErrorHandler，不要重複包裝
- 所有錯誤都會自動記錄到 apiLogger，無需手動記錄
- 使用 MethodNotAllowedError 處理不支援的 HTTP 方法

#### 日誌系統使用範例

**核心原則**: 使用對應的 logger (apiLogger, dbLogger, authLogger, logger)，永不使用 console.log

**API 路由範例**:
```typescript
import { apiLogger } from '@/lib/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  apiLogger.info('開始建立資源', { module: 'ResourceAPI', action: 'create' })
  const result = await service.create(data)
  return success(result, '建立成功')
}, { module: 'ResourceAPI' })
```

**資料庫操作範例**:
```typescript
import { dbLogger } from '@/lib/logger'

async findById(id: string) {
  const timer = dbLogger.timer('查詢產品')
  try {
    const result = await this.supabase.from('products').select('*').eq('id', id).single()
    timer.end({ metadata: { productId: id } })
    return result.data
  } catch (error) {
    timer.end()
    throw error
  }
}
```

### 資料庫優化標準

**專案已實施企業級資料庫優化** - 包含索引優化和全文搜尋功能 🎯 (已完成)

- **索引類型覆蓋**：
  - ✅ GIN 索引：全文搜尋 (products.name, products.description, news.title, news.content)
  - ✅ B-tree 索引：排序和範圍查詢 (created_at DESC, price, category)
  - ✅ 複合索引：多欄位查詢 (is_active + created_at, user_id + status)
  - ✅ 部分索引：條件式索引 (WHERE is_active = true)
  - ✅ HASH 索引：UUID 主鍵快速查找

- **全文搜尋函數**：從 `src/lib/full-text-search.ts` 匯入並使用統一搜尋服務
  ```typescript
  import { fullTextSearchService } from '@/lib/full-text-search'

  // 基本產品搜尋
  const results = await fullTextSearchService.searchProducts('有機蔬菜', {
    limit: 20,
    enableRanking: true
  })

  // 進階搜尋（價格、類別篩選）
  const advanced = await fullTextSearchService.searchProductsAdvanced(
    '有機蔬菜', '蔬菜', 10, 100, 20
  )
  ```

- **RPC 函數整合**：在服務層直接呼叫 PostgreSQL 函數
  ```typescript
  // 使用全文搜尋 RPC
  const { data } = await supabase.rpc('full_text_search_products' as any, {
    search_query: query,
    search_limit: 50,
    search_offset: 0
  }) as { data: any[] | null; error: any }

  // 搜尋建議
  const { data: suggestions } = await supabase.rpc('get_search_suggestions' as any, {
    prefix: partialQuery,
    max_results: 5
  })
  ```

- **後備機制設計**：永遠提供降級選項確保功能可用
  ```typescript
  try {
    // 嘗試使用高效能全文搜尋
    const results = await supabase.rpc('full_text_search_products', params)
    if (results.data) return results.data
  } catch (error) {
    dbLogger.warn('全文搜尋失敗，使用後備搜尋', { error })
    // 後備：使用傳統 ilike 搜尋
    return await supabase.from('products').select('*').ilike('name', `%${query}%`)
  }
  ```

- **效能基準**：
  - 全文搜尋：< 50ms (相比 ilike 的 500ms，提升 10 倍)
  - 搜尋建議：< 20ms
  - 進階搜尋：< 100ms
  - 索引覆蓋率：100% 核心查詢

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

### 統一載入狀態標準

**專案載入狀態統一化 100% 達成** - 所有頁面已使用統一載入元件 🎯 (已完成)

#### 核心載入元件

**使用 PageLoader 統一元件**，位於 `src/components/ui/loading/PageLoader.tsx`：
```typescript
import { MomentsPageLoader, NewsPageLoader, LocationsPageLoader,
         FarmTourPageLoader, AdminPageLoader, DetailPageLoader } from '@/components/ui/loading/PageLoader'

// ✅ 推薦：使用特定頁面載入器
if (loading) {
  return <MomentsPageLoader />
}

// ✅ 通用：使用基礎 PageLoader
if (loading) {
  return <PageLoader type="skeleton" message="載入資料中..." />
}
```

#### 載入類型選擇

- **skeleton**: 骨架屏（推薦，適合大部分頁面）
- **card**: 卡片骨架屏（適合產品、新聞列表）
- **list**: 列表骨架屏（適合管理後台）
- **spinner**: 旋轉載入器（適合簡單操作）

#### Next.js 15 loading.tsx 檔案

**所有主要路由都應有 loading.tsx**：
```typescript
// src/app/[route]/loading.tsx
import { SpecificPageLoader } from '@/components/ui/loading/PageLoader'

export default function Loading() {
  return <SpecificPageLoader />
}
```

#### 載入狀態最佳實踐

```typescript
// ✅ 正確：統一載入元件
if (loading) {
  return <PageLoader type="skeleton" message="載入中..." />
}

// ❌ 錯誤：自製載入樣式
if (loading) {
  return <div>載入中...</div>
}

// ✅ 正確：適當的載入訊息
<AdminPageLoader message="載入產品資料中..." />

// ❌ 錯誤：無意義的訊息
<PageLoader message="請稍候..." />
```

#### 管理後台載入

**管理後台必須包含 AdminProtection**：
```typescript
if (loading) {
  return (
    <AdminProtection>
      <AdminPageLoader message="載入管理資料中..." />
    </AdminProtection>
  )
}
```

### 響應式設計標準

**專案響應式設計覆蓋率 100% 達成** - 所有 UI 元件已支援多裝置響應式設計 🎯 (持續維護)

#### 統一斷點定義

**使用 Tailwind CSS 標準斷點**：
```typescript
// 專案標準斷點
const breakpoints = {
  sm: '640px',   // 大手機橫向 (≥640px)
  md: '768px',   // 平板直向 (≥768px)
  lg: '1024px',  // 筆電/平板橫向 (≥1024px)
  xl: '1280px',  // 桌面螢幕 (≥1280px)
  '2xl': '1536px' // 大螢幕 (≥1536px)
}
```

**目標裝置分類**：
- **手機版** (`< 768px`): iPhone, Android 手機
- **平板版** (`768px - 1024px`): iPad, Android 平板
- **桌面版** (`≥ 1024px`): 筆電、桌面螢幕

#### 開發原則

**核心策略**：
- ✅ **Mobile-First 開發** - 先設計手機版，再向上擴展
- ✅ **漸進增強** - 基礎功能在小螢幕可用，大螢幕增加功能
- ✅ **內容優先** - 確保內容在所有裝置上都清晰易讀
- ✅ **效能考量** - 行動裝置優先載入必要資源

**實作要求**：
```typescript
// ✅ 正確：Mobile-First 方式
const styles = `
  w-full          // 手機：全寬
  md:w-auto       // 平板：自動寬度
  lg:w-96         // 桌面：固定寬度
`

// ❌ 錯誤：Desktop-First 方式
const styles = `
  w-96            // 桌面優先
  md:w-auto       // 往下適配
  sm:w-full       // 最後才考慮手機
`
```

#### UI 元件響應式規範

**導航列 (Header)**：
- **手機版**: 漢堡選單、單欄布局
- **平板版**: 部分選單展開、雙欄布局
- **桌面版**: 全展開選單、多欄布局

**搜尋功能**：
- **手機版**: 全螢幕展開、fixed 定位
- **桌面版**: 右上角展開、absolute 定位

**表格和列表**：
```typescript
// 表格響應式處理
<div className="overflow-x-auto">          // 水平滾動
  <table className="min-w-full">           // 最小寬度
    <tbody>
      <tr className="md:table-row block">  // 平板以上：表格行，手機：區塊
        <td className="md:table-cell block">內容</td>
      </tr>
    </tbody>
  </table>
</div>
```

**彈出視窗和模態框**：
```typescript
// 模態框響應式
<div className={`
  fixed inset-0 z-50 overflow-auto
  p-4 md:p-6 lg:p-8              // 不同裝置的內距
`}>
  <div className={`
    w-full max-w-sm              // 手機：小寬度
    md:max-w-md                  // 平板：中寬度
    lg:max-w-lg                  // 桌面：大寬度
    mx-auto mt-8 lg:mt-24        // 置中和上邊距
  `}>
    {/* 內容 */}
  </div>
</div>
```

#### 必測裝置和尺寸

**5 個關鍵測試點**：
```bash
1. iPhone SE      (375×667)   # 小手機
2. iPhone 14 Pro  (393×852)   # 大手機
3. iPad           (768×1024)  # 標準平板
4. MacBook Air    (1280×832)  # 小筆電
5. Desktop 1440p  (1440×900)  # 桌面螢幕
```

**測試檢查清單**：
- [ ] 所有內容在最小寬度 (320px) 可正常顯示
- [ ] 觸控目標至少 44px×44px (符合無障礙標準)
- [ ] 橫向模式 (landscape) 下功能正常
- [ ] 字體大小在小螢幕上清晰可讀 (至少 16px)
- [ ] 圖片和媒體內容正確縮放

#### 效能最佳化

**圖片響應式**：
```typescript
// 使用 Next.js Image 組件
<Image
  src="/image.jpg"
  alt="描述"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isAboveTheFold}
/>
```

**CSS 載入策略**：
- 關鍵 CSS 內聯載入
- 非關鍵 CSS 延遲載入
- 使用 CSS Container Queries (現代瀏覽器)

**JavaScript Bundle 分割**：
- 行動版載入必要功能
- 桌面版延遲載入進階功能

#### 實作範例

**常見響應式模式**：
```typescript
// 卡片網格響應式
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// 側邊欄響應式
<div className="lg:flex">
  <aside className="lg:w-64 w-full">側邊欄</aside>
  <main className="flex-1">主內容</main>
</div>

// 按鈕組響應式
<div className="flex flex-col sm:flex-row gap-3">
  <button>主要動作</button>
  <button>次要動作</button>
</div>
```

**避免常見錯誤**：
```typescript
// ❌ 錯誤：固定像素值
const styles = 'width: 300px; height: 200px;'

// ✅ 正確：相對單位
const styles = 'w-full max-w-sm h-auto'

// ❌ 錯誤：忽略觸控友好
const styles = 'text-xs p-1'

// ✅ 正確：適合觸控
const styles = 'text-sm p-3 min-h-[44px]'
```

#### 開發前檢查

**每個新功能必須驗證**：
- [ ] 在 5 個關鍵尺寸下測試
- [ ] 觸控操作友好 (手機/平板)
- [ ] 載入效能符合標準 (< 3秒)
- [ ] 無水平滾動條 (內容寬度適中)
- [ ] 文字對比度符合 WCAG 2.1 標準

## 技術債防範

### 開發前檢查清單

Before implementing any feature, **ALWAYS** verify:

- [ ] **Code Reuse Check**: 搜尋是否有相似功能可以重用
  - 使用 `grep -r "function|class|const.*=" src/` 檢查現有功能
  - 檢查 `src/lib/` 和 `src/components/` 是否有相關工具
  - 優先擴展現有功能而非創建新的

- [ ] **Dependency Assessment**: 評估是否需要新依賴
  - 確認不會引入重複功能的套件
  - 檢查套件維護狀態：最後更新 < 1年、stars > 1000、active issues
  - 執行 `npm ls` 確認不會產生依賴衝突
  - **記錄為什麼需要此依賴** (在 commit message 中)

- [ ] **Architecture Consistency**: 確認遵循現有模式
  - API 路由使用統一錯誤處理中間件
  - 服務層使用 BaseService 或 AbstractService
  - 元件遵循現有的 props 和 state 管理模式

- [ ] **Performance Impact**: 評估效能影響
  - 新增功能不會增加建置時間 > 30 秒
  - 不會增加主要 bundle 大小 > 50KB
  - 避免引入會影響 Runtime 效能的重型套件

### 依賴管理

**新增依賴前必須執行**:

```bash
# 1. 檢查現有相似功能
grep -r "import.*from.*package-name" src/
npm ls | grep similar-functionality

# 2. 評估套件健康度
npm info package-name
npm audit package-name

# 3. 檢查 Bundle 影響
npm run analyze  # 記錄當前大小
npm install package-name
npm run analyze  # 比較差異

# 4. 檢查未使用依賴
npx depcheck
```

**依賴管理規則**:
- **禁止** 安裝功能重複的套件（如已有 lodash 不要加 ramda）
- **禁止** 安裝超過 6 個月未更新的套件（除非是穩定庫）
- **禁止** 安裝會增加 bundle > 100KB 的套件（除非是核心功能）
- **必須** 在 commit message 說明為什麼需要新依賴

### 效能指南

**建置效能監控**:
- `.next/cache` 大小不得超過 **200MB**
- 完整建置時間不得超過 **5 分鐘**
- 開發伺服器啟動時間不得超過 **30 秒**

**執行效能標準**:
- API 回應時間 < **200ms** (使用 `apiLogger.timer()` 監控)
- 頁面首次載入 < **3 秒**
- 資料庫查詢時間 < **100ms** (使用 `dbLogger.timer()` 監控)

**Bundle 大小警戒線**:
- JavaScript: **500KB** (壓縮後)
- CSS: **100KB** (壓縮後)
- 圖片: 單張 < **1MB**

### 程式碼品質保證

**重複程式碼檢測**:
- 相同邏輯出現 **3 次以上** 必須抽取為共用函數
- 使用命令檢查重複：`grep -r "similar-pattern" src/`
- 優先使用 `src/lib/` 中的現有工具函數

**元件大小控制**:
- 單一元件檔案不超過 **200 行**
- Props 數量不超過 **7 個** (考慮使用 composition)
- 避免在元件內直接調用 API (使用 custom hooks)

**函數複雜度控制**:
- 單一函數不超過 **30 行**
- 巢狀層數不超過 **3 層**
- 參數數量不超過 **5 個**

### 技術債檢測

**檢測技術債的信號**:
- 建置時間明顯增加
- TypeScript 編譯錯誤數量增加
- ESLint 警告數量持續上升
- 相似功能在多處重複實作
- 依賴套件版本過舊或有安全漏洞

**技術債分類**:
- 🔴 **Critical** - 影響系統穩定性、安全性或核心功能
- 🟡 **Major** - 影響開發效率、用戶體驗或維護成本
- 🟢 **Minor** - 程式碼整潔度、文檔或註解問題

**技術債記錄規範**:
```typescript
// TODO: [DEBT-YYYY-NNN] 🔴🟡🟢 描述問題 (預估: X小時)
// 原因: 為什麼產生這個技術債
// 影響: 對系統的影響
// 建議: 具體的解決方案
```

## 決策框架

當存在多種有效方法時，根據以下原則選擇：

1. **可測試性** - 我能輕易測試這個嗎？
2. **可讀性** - 6 個月後有人能理解這個嗎？
3. **一致性** - 這是否符合專案模式？
4. **簡潔性** - 這是否最簡單可行的解決方案？
5. **可逆性** - 後續更改有多困難？
6. **技術債影響** - 這會在後續產生技術債嗎？

## 專案整合

### API 路由開發

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

### 學習程式碼庫

- 找到 3 個類似的功能/元件
- 識別常見模式和慣例
- 盡可能使用相同的函式庫/工具
- 遵循現有的測試模式
- **參考現有 API 路由**: 查看 `/api/culture` 作為統一錯誤處理的範例
- **參考統一服務架構**: 查看 `src/services/v2/productService.ts` 作為新服務層的範例

### 開發工具

- 使用專案現有的建置系統
- 使用專案的測試框架
- 使用專案的格式化器/linter 設定
- 不要在沒有強烈理由的情況下引入新工具

## 品質閣門

### 完成定義

- [ ] 測試已寫並通過
- [ ] 程式碼遵循專案慣例
- [ ] 沒有 linter/格式化器警告
- [ ] **生產程式碼中無 console.log/warn/error** - 使用專案日誌系統
- [ ] 提交訊息清晰
- [ ] 實作符合計劃
- [ ] 沒有缺乏問題編號的 TODO

### API 開發完成檢查清單

- [ ] 使用適當的錯誤處理中間件 (requireAuth/requireAdmin/optionalAuth/withErrorHandler)
- [ ] 所有錯誤使用標準錯誤類型 (ValidationError, NotFoundError, MethodNotAllowedError 等)
- [ ] 動態路由參數正確使用 await (Next.js 15+)
- [ ] 使用 apiLogger 而非 console.log
- [ ] 回應使用統一格式 (success, created, successWithPagination)
- [ ] TypeScript 類型檢查通過
- [ ] 處理不支援的 HTTP 方法時返回 MethodNotAllowedError
- [ ] 不要重複包裝權限中間件和 withErrorHandler

### 測試指南

- 測試行為而非實作
- 盡可能每個測試一個斷言
- 清晰的測試名稱描述場景
- 使用現有的測試工具/助手
- 測試應該是確定性的

## 維護任務

### 開發前檢查

在開始任何開發工作前，**ALWAYS** 執行：

```bash
# 1. 檢查 TypeScript 類型安全
npm run type-check

# 2. 檢查程式碼品質
npm run lint

# 3. 確認沒有 console.log（在非開發環境）
grep -r "console\." src/ --exclude-dir=node_modules
```

**每次 commit 前必須**：
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查無警告
- [ ] 所有相關測試通過
- [ ] 沒有新的 console.log 或 debugger
- [ ] commit message 遵循規範

### 重大變更的維護

**執行重大變更時** 執行以下維護工作：

```bash
# 1. 清理建置快取
rm -rf .next/cache
echo "Cache size after cleanup: $(du -sh .next/ 2>/dev/null || echo "0B")"

# 2. 檢查未使用的依賴
npx depcheck

# 3. 檢查依賴安全性
npm audit

# 4. 分析 Bundle 大小
npm run analyze

# 5. 檢查 TODO 註解
grep -r "TODO" src/ --include="*.ts" --include="*.tsx"
```

**重大變更檢查清單**：
- [ ] 清理建置快取 (目標: < 200MB)
- [ ] 移除未使用依賴
- [ ] 修復安全漏洞 (high/critical)
- [ ] 審查並處理 TODO 項目
- [ ] 確認 Bundle 大小在標準內
- [ ] 檢查並更新 PROJECT_IMPROVEMENT_OPPORTUNITIES.md

### 版本發布維護

**版本發布前** 執行深度維護：

```bash
# 1. 依賴套件健康檢查
npm outdated

# 2. 檢查重複程式碼
# 使用工具如 jscpd 或手動檢查常見模式
grep -r "function.*{" src/ | sort | uniq -c | sort -nr

# 3. 資料庫效能檢查
# 檢查慢查詢日誌 (如果有的話)

# 4. 效能基準測試
npm run build
echo "Build time: $(date)"
```

**版本發布檢查清單**：
- [ ] 評估並更新依賴套件 (minor/patch 版本)
- [ ] 檢查並清理重複程式碼
- [ ] 審查資料庫查詢效能
- [ ] 運行完整的測試套件
- [ ] 檢查系統效能指標
- [ ] 更新文檔和 README

### 技術債審查流程

**技術債審查流程** (每月執行)：

1. **收集債務清單**：
   ```bash
   # 收集所有 TODO 註解
   grep -r "TODO.*DEBT" src/ > technical_debt_report.txt

   # 檢查建置警告
   npm run build 2>&1 | grep -i "warn"

   # 檢查 ESLint 問題
   npm run lint | grep -i "warn"
   ```

2. **優先排序**：
   - 🔴 Critical: 立即處理 (1 週內)
   - 🟡 Major: 近期處理 (1 月內)
   - 🟢 Minor: 計劃處理 (3 月內)

3. **制定處理計劃**：
   - 估算修復時間
   - 評估業務影響
   - 安排到開發週期中

4. **追蹤和報告**：
   - 更新 PROJECT_IMPROVEMENT_OPPORTUNITIES.md
   - 在團隊會議中報告進度
   - 慶祝債務清理成果 🎉

### 自動化健康檢查

**自動化健康檢查腳本** (建議加入 CI/CD)：

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Running automated health checks..."

# 1. 建置大小檢查
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
echo "📦 Build size: $BUILD_SIZE"

# 2. 依賴漏洞檢查
VULNERABILITIES=$(npm audit --audit-level moderate --format json | jq '.metadata.vulnerabilities.total')
echo "🔒 Security vulnerabilities: $VULNERABILITIES"

# 3. TypeScript 錯誤檢查
TS_ERRORS=$(npx tsc --noEmit --incremental false 2>&1 | grep -c "error TS")
echo "📝 TypeScript errors: $TS_ERRORS"

# 4. ESLint 警告檢查
LINT_WARNINGS=$(npm run lint 2>&1 | grep -c "warning")
echo "⚠️  ESLint warnings: $LINT_WARNINGS"

# 5. 設定警戒閾值
if [ "$TS_ERRORS" -gt 0 ]; then
  echo "❌ TypeScript errors detected!"
  exit 1
fi

if [ "$VULNERABILITIES" -gt 0 ]; then
  echo "⚠️  Security vulnerabilities detected!"
fi

echo "✅ Health check completed!"
```

### 效能監控

**效能監控指標** (每週檢查)：

```bash
# 1. 建置效能
time npm run build

# 2. Bundle 分析
npm run analyze

# 3. 開發伺服器啟動時間
time npm run dev &
sleep 10
kill %1

# 4. 記錄歷史數據
echo "$(date),$(du -sh .next | cut -f1)" >> performance_history.csv
```

**效能基準**：
- 建置時間: < 5 分鐘
- 開發伺服器啟動: < 30 秒
- Bundle 大小: JS < 500KB, CSS < 100KB

## 重要提醒

**永不**：
- 使用 `--no-verify` 繞過提交鉤子
- 停用測試而不是修復它們
- 提交不能編譯的程式碼
- 做假設 - 用現有程式碼驗證
- 使用 console.log/warn/error - 使用專案日誌系統代替
- **在沒有理由的情況下安裝依賴** - 始終在提交訊息中解釋原因
- **建立重複功能** - 先用 grep/搜尋檢查現有程式碼
- **忽略效能警告** - 解決套件大小和建置時間問題
- **跳過開發前檢查清單** - 始終驗證程式碼重用和架構一致性

**始終**：
- 漸進式提交可工作的程式碼
- 随時更新計劃文件
- 從現有實作中學習
- 3 次嘗試失敗後停止並重新評估
- 使用適當的日誌器 (apiLogger, dbLogger 等) 並提供適當的上下文
- **檢查 console.* 使用**: 定期執行 `grep -r "console\." src/ --exclude-dir=node_modules` 確保沒有新的 console 使用
- **執行開發前檢查清單** - 程式碼重用、依賴評估、架構一致性、效能影響
- **監控技術債信號** - 建置時間增加、TypeScript 錯誤、ESLint 警告、重複程式碼
- **適當記錄技術債** - 使用帶有 DEBT 標籤、分類和估計工作量的 TODO 註釋
- **執行每週維護** - 快取清理、依賴檢查、安全稽核、套件分析
- **追蹤效能指標** - 建置大小 < 200MB 快取、建置時間 < 5分鐘、套件 JS < 500KB

### 技術債警告信號

**遇到以下情況立即停止並重新評估**：
- 🚨 相同邏輯複製 3 次以上
- 🚨 函數/元件超過大小限制 (30 行 / 200 行)
- 🚨 為非核心功能添加超過 100KB 的依賴
- 🚨 建置時間增加超過 30 秒
- 🚨 TypeScript 錯誤增加
- 🚨 建立新模式而不遵循現有模式

**當你看到警告信號時**：
1. **記錄問題** 使用 TODO 註釋和 DEBT 標籤
2. **添加到 PROJECT_IMPROVEMENT_OPPORTUNITIES.md**
3. **考慮重構** 而不是增加問題
4. **參考現有類似實作** 的模式

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
import { requireAuth } from '@/lib/middleware/api-middleware'

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

### 搜尋功能整合標準

**專案已實施高效能搜尋系統** - 使用 PostgreSQL 全文搜尋 + 多層後備機制

- **搜尋 API 端點**：
  ```typescript
  // 搜尋建議 API
  GET /api/search/suggestions?q=關鍵字&limit=5

  // 搜尋統計 API
  GET /api/search/stats?days=7&limit=10

  // 回應格式
  {
    "success": true,
    "data": {
      "suggestions": ["有機蔬菜", "有機水果"],
      "query": "有機",
      "count": 2
    }
  }
  ```

- **服務層搜尋整合**：在產品服務中優先使用全文搜尋
  ```typescript
  async searchProducts(query: string): Promise<Product[]> {
    try {
      // 優先：使用高效能全文搜尋
      const { data } = await supabase.rpc('full_text_search_products' as any, {
        search_query: query,
        search_limit: 50
      })
      if (data) return data.map(this.transformFromDB)
    } catch (error) {
      dbLogger.warn('全文搜尋失敗，使用後備搜尋', { error })
    }

    // 後備：傳統 ilike 搜尋
    return await this.fallbackSearch(query)
  }
  ```

- **前端搜尋整合**：使用統一的搜尋服務
  ```typescript
  // React 元件中使用搜尋建議
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (query.length >= 2) {
      fetch(`/api/search/suggestions?q=${query}&limit=5`)
        .then(res => res.json())
        .then(data => setSuggestions(data.data.suggestions))
    }
  }, [query])
  ```

### API 開發結構

所有 API 應遵循統一的開發結構：

```typescript
// 檔案位置：src/app/api/[resource]/route.ts
import { requireAuth, success, ValidationError } from '@/lib/middleware/api-middleware'
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

查看現有的 API 路由（如 `src/app/api/inquiries/route.ts`）了解完整的實作範例。

## 最佳實踐範例

### 避免技術債

#### ✅ 好的做法：程式碼重用與抽象化

```typescript
// ✅ 好：抽取共用的驗證邏輯
const validateRequired = (fields: Record<string, any>, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !fields[field])
  if (missing.length > 0) {
    throw new ValidationError(`必填欄位: ${missing.join(', ')}`)
  }
}

// 在多個 API 路由中重用
export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await req.json()
  validateRequired(data, ['name', 'email'])  // 重用驗證邏輯

  const result = await service.create(data)
  return created(result, '建立成功')
}, { module: 'ProductAPI' })
```

#### ❌ 不好的做法：重複的驗證邏輯

```typescript
// ❌ 不好：重複的驗證邏輯
export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await req.json()
  if (!data.name) throw new ValidationError('名稱必填')
  if (!data.email) throw new ValidationError('Email必填')
  // ... 在其他地方又重複一遍相同邏輯
}, { module: 'ProductAPI' })
```

#### ✅ 好的做法：依賴管理

```typescript
// ✅ 好：檢查現有功能再決定是否需要新依賴
// Commit message: "feat: add date formatting using existing date-fns
// 檢查後發現專案已有 date-fns，無需新增 moment.js"

import { format } from 'date-fns'  // 使用現有依賴

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
```

#### ❌ 不好的做法：不必要的依賴

```typescript
// ❌ 不好：沒檢查就加新依賴
// npm install moment  // 專案已有 date-fns 卻又加 moment.js

import moment from 'moment'  // 增加 bundle 大小且功能重複

export function formatDate(date: Date): string {
  return moment(date).format('YYYY-MM-DD')
}
```

#### ✅ 好的做法：元件架構

```typescript
// ✅ 好：模組化元件設計
interface ProductCardProps {
  product: Product
  onSelect: (id: string) => void
  variant?: 'default' | 'compact'
}

export function ProductCard({ product, onSelect, variant = 'default' }: ProductCardProps) {
  return (
    <div className={cn('card', variant === 'compact' && 'card-compact')}>
      <ProductImage src={product.image} alt={product.name} />
      <ProductInfo product={product} />
      <ProductActions product={product} onSelect={onSelect} />
    </div>
  )
}

// 分離關注點，每個子元件職責單一
```

#### ❌ 不好的做法：巨型元件

```typescript
// ❌ 不好：單一巨型元件 (200+ 行)
export function ProductCard({ product, onSelect }: ProductCardProps) {
  // 100+ 行的 JSX，包含圖片處理、資訊顯示、操作邏輯等
  return (
    <div>
      {/* 混雜了太多責任的大量 JSX */}
    </div>
  )
}
```

#### ✅ 好的做法：效能意識程式碼

```typescript
// ✅ 好：使用 React.memo 避免不必要渲染
export const ProductList = React.memo(({ products, onSelect }: ProductListProps) => {
  const [filteredProducts, setFilteredProducts] = useState(products)

  // 使用 useCallback 避免子元件重渲染
  const handleSelect = useCallback((id: string) => {
    onSelect(id)
  }, [onSelect])

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
})
```

#### ❌ 不好的做法：效能問題

```typescript
// ❌ 不好：效能問題
export function ProductList({ products, onSelect }: ProductListProps) {
  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={(id) => onSelect(id)}  // 每次渲染都創建新函數
        />
      ))}
    </div>
  )
}
```

### 錯誤處理最佳實踐

#### ✅ 好的做法：結構化錯誤處理

```typescript
// ✅ 好：使用統一錯誤處理系統
export const POST = requireAuth(async (req, { user }) => {
  try {
    const data = await req.json()
    const validation = ProductSchema.safeParse(data)

    if (!validation.success) {
      throw new ValidationError(`驗證失敗: ${validation.error.message}`)
    }

    const result = await productService.create(validation.data, user.id)
    return created(result, '產品建立成功')

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error  // 讓中間件處理
    }
    throw ErrorFactory.fromSupabaseError(error, {
      module: 'ProductAPI',
      action: 'create'
    })
  }
})
```

#### ❌ 不好的做法：不一致的錯誤處理

```typescript
// ❌ 不好：不一致的錯誤處理
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.name) {
      return NextResponse.json({ error: '名稱必填' }, { status: 400 })  // 不一致的回應格式
    }

    const result = await productService.create(data)
    return NextResponse.json({ success: true, data: result })  // 不使用統一格式

  } catch (error) {
    console.error(error)  // 不應使用 console.error
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 維護與監控

#### ✅ 好的做法：主動的技術債管理

```typescript
// ✅ 好：主動技術債管理
// TODO: [DEBT-2025-001] 🟡 ProductService 過於複雜，需要拆分 (預估: 4小時)
// 原因: 單一服務處理產品 CRUD、搜尋、快取、統計等多個責任
// 影響: 難以測試、維護成本高、擴展困難
// 建議: 拆分為 ProductCRUDService、ProductSearchService、ProductStatsService
export class ProductService {
  // 當前複雜實作...

  // 計劃重構：
  // - ProductCRUDService: 基本 CRUD 操作
  // - ProductSearchService: 搜尋和篩選
  // - ProductStatsService: 統計和報表
}
```

#### ✅ 好的做法：效能監控

```typescript
// ✅ 好：效能監控
export class DatabaseService {
  async query(sql: string, params: any[]) {
    const timer = dbLogger.timer('資料庫查詢')

    try {
      const result = await this.client.query(sql, params)

      const duration = timer.end({
        metadata: {
          query: sql.substring(0, 100) + '...',
          rowCount: result.rows?.length
        }
      })

      // 效能警告
      if (duration > 200) {
        dbLogger.warn('慢查詢檢測', {
          module: 'DatabaseService',
          metadata: { duration, query: sql }
        })
      }

      return result
    } catch (error) {
      timer.end()
      throw error
    }
  }
}
```

#### ✅ 好的做法：搜尋功能整合

```typescript
// ✅ 好：多層後備搜尋機制
export class ProductSearchService {
  async searchProducts(query: string, options: SearchOptions = {}): Promise<Product[]> {
    const timer = dbLogger.timer('產品搜尋')

    try {
      // 第一層：高效能全文搜尋
      const fullTextResults = await this.tryFullTextSearch(query, options)
      if (fullTextResults) {
        timer.end({ metadata: { method: 'fulltext', resultCount: fullTextResults.length } })
        return fullTextResults
      }

      // 第二層：進階搜尋（價格、類別篩選）
      if (options.category || options.priceRange) {
        const advancedResults = await this.tryAdvancedSearch(query, options)
        if (advancedResults) {
          timer.end({ metadata: { method: 'advanced', resultCount: advancedResults.length } })
          return advancedResults
        }
      }

      // 第三層：基本 ilike 搜尋（後備）
      const basicResults = await this.basicSearch(query)
      timer.end({ metadata: { method: 'basic', resultCount: basicResults.length } })
      return basicResults

    } catch (error) {
      timer.end()
      throw error
    }
  }

  private async tryFullTextSearch(query: string, options: SearchOptions): Promise<Product[] | null> {
    try {
      const { data } = await this.supabase.rpc('full_text_search_products' as any, {
        search_query: query,
        search_limit: options.limit || 20,
        search_offset: options.offset || 0
      })

      return data ? data.map(this.transformFromDB) : null
    } catch (error) {
      dbLogger.warn('全文搜尋失敗', {
        module: 'ProductSearchService',
        metadata: { error: String(error), query: query.substring(0, 20) }
      })
      return null
    }
  }
}
```

#### ✅ 好的做法：搜尋 API 最佳實踐

```typescript
// ✅ 好：搜尋建議 API 設計
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20) // 限制上限

  // 輸入驗證
  if (!query || query.length < 2) {
    throw new ValidationError('搜尋關鍵字至少需要 2 個字元')
  }

  // 速率限制檢查
  const rateLimitKey = `search_suggestions:${request.ip}`
  if (await isRateLimited(rateLimitKey, 60, 100)) { // 每分鐘 100 次
    throw new ValidationError('請求過於頻繁，請稍後再試')
  }

  // 使用快取提升效能
  const cacheKey = `suggestions:${query}:${limit}`
  const cached = await cache.get(cacheKey)
  if (cached) {
    return success(cached, '搜尋建議成功（快取）')
  }

  // 執行搜尋
  const suggestions = await fullTextSearchService.getSearchSuggestions(query, 'products', limit)

  const result = {
    suggestions,
    query,
    count: suggestions.length,
    cached: false
  }

  // 快取結果 5 分鐘
  await cache.set(cacheKey, result, 300)

  return success(result, '搜尋建議成功')
}, { module: 'SearchAPI' })
```

#### ❌ 不好的做法：搜尋功能問題

```typescript
// ❌ 不好：沒有後備機制的搜尋
export async function searchProducts(query: string): Promise<Product[]> {
  // 直接調用可能失敗的 RPC，沒有錯誤處理
  const { data } = await supabase.rpc('full_text_search_products', { search_query: query })
  return data || []  // 失敗時返回空陣列，用戶不知道發生了什麼
}

// ❌ 不好：沒有驗證和限制的搜尋 API
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  // 沒有輸入驗證、速率限制、快取
  const results = await searchProducts(query)
  return Response.json(results)  // 沒有統一回應格式
}
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.


      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.