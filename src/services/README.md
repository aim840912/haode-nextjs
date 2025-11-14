# 服務層架構指南

> 最後更新：2025-11-14
> 版本：v4.1

## 📋 目錄結構

```
src/services/
├── base/                          # 抽象層（可選使用）
│   ├── base-service.ts            # 服務介面定義
│   ├── abstract-supabase-service.ts  # Supabase 抽象層
│   └── abstract-pooled-service.ts    # 連線池抽象層
├── core/                          # 核心業務服務
│   ├── product/
│   │   └── productService.ts      # 產品服務
│   ├── inquiry/
│   │   ├── InquiryQueryService.ts    # 詢價查詢服務 (CQRS)
│   │   ├── InquiryCommandService.ts  # 詢價命令服務 (CQRS)
│   │   └── inquiryTemplateService.ts # 詢價範本服務
│   ├── order/
│   │   ├── OrderQueryService.ts      # 訂單查詢服務 (CQRS)
│   │   └── OrderCommandService.ts    # 訂單命令服務 (CQRS)
│   ├── content/
│   │   ├── farmTourService.ts        # 農場體驗服務
│   │   ├── scheduleServiceSimple.ts  # 市集排程服務
│   │   └── locationServiceSimple.ts  # 地點服務
│   └── user/
│       └── userInterestsService.ts   # 使用者興趣服務
└── infrastructure/                # 基礎設施服務
    ├── auditLogService.ts
    ├── email-service.ts
    ├── monitoring/                # 統一監控服務
    │   ├── types/                 # 監控類型定義
    │   │   ├── monitoring-types.ts        # 核心監控類型
    │   │   ├── rate-limit-collector.ts    # Rate Limit Collector 類型
    │   │   ├── kpi-collector.ts           # KPI Collector 類型
    │   │   └── audit-collector.ts         # Audit Collector 類型
    │   ├── collectors/            # Collector 實作
    │   │   ├── RateLimitCollectorImpl.ts  # Rate Limit 指標收集器
    │   │   ├── KPICollectorImpl.ts        # KPI 指標收集器
    │   │   ├── AuditCollectorImpl.ts      # 審計指標收集器
    │   │   └── index.ts
    │   ├── MonitoringServiceImpl.ts       # 統一監控服務實作
    │   └── index.ts               # 統一導出入口
    ├── rateLimitMonitoringService.ts  # (內部) Rate Limit 監控實作
    ├── kpiMonitoringService.ts        # (內部) KPI 監控實作
    └── auditStatsService.ts            # (內部) 審計統計實作
```

## 🏗 架構原則

### 核心信念
1. **實用主義優於教條主義** - 不強制使用抽象層
2. **簡單優於複雜** - 避免過度設計
3. **統一優於混亂** - 統一錯誤處理和日誌記錄

### 設計決策（2025-11-14）
經過深入分析和持續優化，我們採用**實用主義架構策略**：
- ✅ 保留但不強制使用抽象層（使用率 10.7%）
- ✅ 移除完全未使用的 AbstractJsonService（654行）
- ✅ **移除 Service Factory 間接層**（29行，直接從服務檔案 import）
- ✅ 採用 CQRS 模式分離查詢和命令（Order、Inquiry 服務）
- ✅ 規範 Simple/Adapter 命名約定
- ✅ 統一錯誤處理（ErrorFactory）和日誌系統（apiLogger/dbLogger）

## 📝 命名規範

### 服務命名約定

#### 標準服務（無後綴）
```typescript
// 例：productService.ts, orderService.ts
// 用途：標準實作，可能使用或不使用抽象層
export class ProductService { }
```

#### Simple 服務（後綴 Simple）
```typescript
// 例：inquiryServiceSimple.ts
// 用途：直接實作版本，不使用抽象層繼承
// 特點：簡單直接，完全控制實作細節
export class InquiryServiceSimple implements InquiryService { }
```

#### Adapter 服務（後綴 Adapter）
```typescript
// 例：inquiryServiceAdapter.ts
// 用途：適配器模式，提供向後相容性
// 特點：橋接舊版 API 到新版服務
export class InquiryServiceAdapter implements InquiryService {
  constructor(private serviceV2: InquiryServiceSimple) {}
}
```

#### Pooled 服務（後綴 Pooled）
```typescript
// 例：pooledProductService.ts
// 用途：使用連線池的高效能版本
// 特點：適合高併發場景
export class PooledProductService extends AbstractPooledService { }
```

#### Cached 服務（後綴 Cached）
```typescript
// 例：cachedProductService.ts
// 用途：帶快取的版本
// 特點：適合讀取密集場景
export class CachedProductService implements ProductService { }
```

## 🎯 使用抽象層的指南

### 何時使用抽象層？

#### ✅ 建議使用（以下情況）
1. **需要統一的 CRUD 模式**
   - 標準的 findAll, findById, create, update, delete
   - 需要分頁和搜尋功能

2. **複雜的資料轉換邏輯**
   - DB 欄位名稱與 DTO 不一致
   - 需要多層資料轉換

3. **需要內建功能**
   - 軟刪除支援
   - 自動錯誤處理
   - 統一日誌記錄

#### ❌ 不建議使用（以下情況）
1. **簡單的服務** - 只有 2-3 個方法
2. **特殊業務邏輯** - 不符合標準 CRUD 模式
3. **效能敏感場景** - 需要最大化控制

### 抽象層對比

| 特性 | AbstractSupabaseService | AbstractPooledService | 直接實作 |
|------|------------------------|----------------------|---------|
| 程式碼行數 | -200~-300 行 | -100~-150 行 | 基準 |
| 靈活性 | 中 | 中 | 高 |
| 學習曲線 | 陡峭 | 中等 | 平緩 |
| 適用場景 | 標準 CRUD | 高併發 | 特殊邏輯 |

### 實作範例

#### 使用抽象層
```typescript
// 優點：程式碼簡潔，統一模式
// 缺點：學習曲線，靈活性受限
export class InquiryService extends AbstractSupabaseService<
  InquiryWithItems,
  CreateInquiryRequest,
  UpdateInquiryRequest
> {
  constructor() {
    super(
      { tableName: 'inquiries', useAdminClient: true },
      new InquiryTransformer()
    )
  }

  // 只需實作特殊方法，CRUD 自動處理
  async getInquiryStats(): Promise<InquiryStats[]> {
    // 特殊業務邏輯
  }
}
```

#### 直接實作
```typescript
// 優點：完全控制，簡單直接
// 缺點：需要自行處理錯誤和日誌
export class ProductService {
  private supabase = createServiceSupabaseClient()

  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

      if (error) {
        throw ErrorFactory.fromSupabaseError(error, {
          module: 'ProductService',
          action: 'getProducts'
        })
      }

      return data.map(this.transformFromDB)
    } catch (error) {
      dbLogger.error('取得產品失敗', error as Error)
      throw error
    }
  }
}
```

## 🎯 服務選擇策略

### 1. API 路由中的服務選擇

#### 公開 API (高流量)
```typescript
// 使用快取版本
import { productService } from '@/services/core/product/productService'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const products = await productService.getProducts()
  return success(products)
}, { module: 'PublicProductAPI' })
```

#### 管理 API (即時性要求)
```typescript
// 使用工廠動態選擇
import { getProductService } from '@/services/factory/serviceFactory'

export const POST = requireAdmin(async (req, { user }) => {
  const service = await getProductService()
  const product = await service.createProduct(data)
  return created(product, '產品建立成功')
})
```

#### 高併發場景
```typescript
// 直接使用連線池版本
import { PooledProductService } from '@/services/core/product/pooledProductService'

const pooledService = new PooledProductService()

export const GET = withErrorHandler(async (req: NextRequest) => {
  const products = await pooledService.findAll()
  return success(products)
}, { module: 'HighTrafficAPI' })
```

### 2. 服務選擇決策樹

```
需要即時資料？
├── 是 → 使用 pooledProductService（繞過快取）
└── 否 → 一般用途？
    ├── 是 → 使用 productService（預設快取）
    └── 否 → 高效能需求？
        └── 是 → 使用 serviceFactory（動態選擇）
```

### 3. 效能對比

| 服務類型 | 查詢延遲 | 記憶體使用 | 適用場景 |
|---------|---------|----------|---------|
| cachedProductService | ~10ms | 中等 | 公開API、列表頁 |
| pooledProductService | ~50ms | 高 | 管理功能、即時數據 |
| productService | ~15ms | 低 | 一般用途 |

## 📚 最佳實踐

### ✅ 推薦做法

1. **預設使用快取服務**
   ```typescript
   import { productService } from '@/services/core/product/productService'
   ```

2. **管理功能使用工廠**
   ```typescript
   const service = await getProductService()
   ```

3. **高併發使用連線池**
   ```typescript
   const pooledService = new PooledProductService()
   ```

4. **統一錯誤處理**
   ```typescript
   try {
     const result = await service.operation()
     return success(result)
   } catch (error) {
     throw ErrorFactory.fromSupabaseError(error, {
       module: 'ProductService',
       action: 'operation'
     })
   }
   ```

### ❌ 避免做法

1. **不要混用多種服務**
   ```typescript
   // ❌ 避免
   const cached = await productService.getProducts()
   const fresh = await pooledService.findAll()
   ```

2. **不要在組件中直接使用服務**
   ```typescript
   // ❌ 避免
   function Component() {
     const [products, setProducts] = useState([])
     useEffect(() => {
       productService.getProducts().then(setProducts)
     }, [])
   }

   // ✅ 使用 API 路由
   function Component() {
     const [products, setProducts] = useState([])
     useEffect(() => {
       fetch('/api/products').then(res => res.json()).then(setProducts)
     }, [])
   }
   ```

3. **不要跳過錯誤處理中間件**
   ```typescript
   // ❌ 避免
   export async function GET(req: NextRequest) {
     return Response.json(await productService.getProducts())
   }

   // ✅ 使用中間件
   export const GET = withErrorHandler(async (req: NextRequest) => {
     const products = await productService.getProducts()
     return success(products)
   }, { module: 'ProductAPI' })
   ```

## 📊 監控服務架構

### 設計原則
採用 **Collector 模式** 實現統一的監控服務架構：
- ✅ **統一介面**：所有 Collector 實作 `MetricsCollector` 介面
- ✅ **職責分離**：每個 Collector 負責特定類型的指標收集
- ✅ **可擴展性**：輕鬆新增新的 Collector 而不影響現有功能
- ✅ **統一入口**：透過 `MonitoringService` 統一管理和協調

### 架構層次

```
API Routes (外部使用層)
    ↓
MonitoringService (統一協調層)
    ↓
Collectors (指標收集層)
    ├── RateLimitCollector
    ├── KPICollector
    └── AuditCollector
    ↓
Legacy Services (內部實作層)
    ├── rateLimitMonitoringService
    ├── kpiMonitoringService
    └── auditStatsService
```

### 使用方式

#### ✅ 推薦：使用 Collector
```typescript
// API Route 中使用 Collector
import { rateLimitCollector, kpiCollector, auditCollector } from '@/services/infrastructure/monitoring'

// 1. Rate Limit 統計
const stats = await rateLimitCollector.getRateLimitStats()

// 2. KPI 報告
const report = await kpiCollector.generateKPIReport()

// 3. 審計統計
const auditStats = await auditCollector.getAuditStats({ days: 30 })
```

#### ✅ 進階：使用 MonitoringService
```typescript
// 統一監控入口
import { monitoringService } from '@/services/infrastructure/monitoring'

// 收集所有指標
const allMetrics = await monitoringService.collectAllMetrics()

// 生成摘要報告
const report = await monitoringService.generateReport('summary', { days: 7 })

// 取得活躍警報
const alerts = await monitoringService.getAlerts()
```

#### ❌ 不推薦：直接使用舊服務
```typescript
// ❌ 避免直接使用內部實作
import { getRateLimitStats } from '@/services/infrastructure/rateLimitMonitoringService'
import { generateKPIReport } from '@/services/infrastructure/kpiMonitoringService'

// 這些檔案已標記為內部使用，應透過 Collector 存取
```

### 可用的 Collectors

#### 1. RateLimitCollector
```typescript
import { rateLimitCollector } from '@/services/infrastructure/monitoring'

// 取得 Rate Limit 統計
const stats = await rateLimitCollector.getRateLimitStats()

// 取得被封鎖的 IP 列表
const blockedIPs = await rateLimitCollector.getBlockedIPs()

// 檢查 IP 是否被封鎖
const blockInfo = await rateLimitCollector.checkIPBlock('1.2.3.4')
```

#### 2. KPICollector
```typescript
import { kpiCollector } from '@/services/infrastructure/monitoring'

// 生成完整 KPI 報告
const report = await kpiCollector.generateKPIReport()

// 測量特定 KPI
const measurement = await kpiCollector.measureKPI('api_response_time_avg')

// 取得 KPI 歷史
const history = await kpiCollector.getKPIHistory('api_error_rate', 100)
```

#### 3. AuditCollector
```typescript
import { auditCollector } from '@/services/infrastructure/monitoring'

// 取得審計統計
const stats = await auditCollector.getAuditStats({ days: 30 })

// 取得使用者活動統計
const userStats = await auditCollector.getUserActivityStats({ days: 7 })

// 取得資源存取統計
const resourceStats = await auditCollector.getResourceAccessStats({ days: 7 })
```

### 監控服務優勢

| 特性 | 舊架構 (3個獨立服務) | 新架構 (Collector 模式) |
|------|---------------------|----------------------|
| 程式碼重用 | 低（重複邏輯） | 高（統一介面） |
| 可維護性 | 中（分散管理） | 高（集中協調） |
| 擴展性 | 低（需修改多處） | 高（註冊新 Collector） |
| 一致性 | 低（各自實作） | 高（統一規範） |
| 警報管理 | 無 | 有（統一警報系統） |
| 健康評分 | 無 | 有（自動計算） |

## 🔄 服務升級路徑

### 階段 1: 統一入口 (已完成)
- ✅ 統一的 productService 入口
- ✅ 工廠模式動態選擇
- ✅ 三種服務實作並存

### 階段 2: 效能優化 (進行中)
- 🔄 連線池服務優化
- 🔄 快取策略調整
- ⏳ 監控和指標收集

### 階段 3: 服務整合 (規劃中)
- ⏳ 統一 API 介面
- ⏳ 自動服務選擇
- ⏳ 效能基準測試

## 🛠 開發指引

### 新增 API 路由時

1. **選擇合適的服務**
   - 讀取密集：使用 `productService` (快取)
   - 寫入操作：使用 `getProductService()` (工廠)
   - 高併發：使用 `PooledProductService` (連線池)

2. **使用統一中間件**
   ```typescript
   export const GET = withErrorHandler(handleGET, { module: 'YourAPI' })
   ```

3. **添加適當的日誌**
   ```typescript
   apiLogger.info('執行產品操作', {
     module: 'ProductAPI',
     metadata: { action: 'create', productId }
   })
   ```

### 服務更新時

1. **向後相容** - 保持現有 API 不變
2. **逐步遷移** - 一次更新一個端點
3. **效能測試** - 確保新版本不影響效能
4. **監控指標** - 觀察錯誤率和回應時間

## 📊 監控與除錯

### 服務健康檢查
```bash
# 檢查服務匯入
grep -r "productService\|ProductService" src/app/api --include="*.ts"

# 檢查錯誤處理
grep -r "withErrorHandler\|requireAuth" src/app/api --include="*.ts"

# 檢查日誌記錄
grep -r "apiLogger" src/app/api --include="*.ts"
```

### 效能指標
- API 回應時間 < 200ms
- 資料庫查詢時間 < 100ms
- 快取命中率 > 80%
- 錯誤率 < 1%

---

---

**變更記錄**：
- 2025-11-14 v4.1: 監控服務架構重構（Collector 模式，統一監控入口）
- 2025-11-14 v4.0: 移除 Service Factory 間接層
- 2025-10-01 v3.0: 服務層架構統一（移除未使用的 AbstractJsonService，規範命名約定）
- 2024-09-25: 產品服務層重構

**版本**: v4.1
**最後更新**: 2025-11-14