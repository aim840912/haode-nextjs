# 產品服務層架構指南

## 📋 目錄結構

```
src/services/
├── core/product/
│   ├── productService.ts          # 統一產品服務入口
│   ├── pooledProductService.ts    # 連線池版本（高效能）
│   └── cachedProductService.ts    # 快取版本（一般使用）
├── factory/
│   └── serviceFactory.ts          # 服務工廠（動態選擇）
└── README.md                      # 本檔案
```

## 🎯 使用策略

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

**最後更新**: 2024-09-25
**版本**: v2.0
**負責人**: Claude Code Assistant