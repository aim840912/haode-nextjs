# 專案改進計劃

> 生成日期：2025-01-14
> 專案：Haude (豪德農場)
> 技術棧：Next.js 15 + React 19 + TypeScript + Supabase

## 📊 專案現況分析

### 優點
- ✅ 使用最新的 Next.js 15 和 React 19
- ✅ 完整的錯誤處理和日誌系統
- ✅ 實施了快取機制和全文搜尋
- ✅ 有基本的安全措施（CSRF、認證中間件）
- ✅ TypeScript 類型檢查通過，無錯誤

### 待改進項目
- ⚠️ ESLint 配置錯誤，無法執行檢查
- ⚠️ 服務層架構不統一（混用多種模式）
- ⚠️ 有未使用和過時的依賴
- ⚠️ 部分元件過大，需要拆分
- ⚠️ 缺乏完整的監控系統

---

## 🎯 改進項目（按優先順序）

### 1. 🔧 **ESLint 配置問題修復**（優先度：🔴 高）

**問題描述：**
- ESLint 無法找到 TypeScript 相關規則
- `next lint` 已被棄用，需要遷移到 ESLint CLI

**具體改進步驟：**
```bash
# 方案一：安裝缺失的 TypeScript ESLint 套件
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser

# 方案二：遷移到新的 ESLint 配置
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**修改 .eslintrc.json：**
```json
{
  "extends": ["next/core-web-vitals"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

---

### 2. 📦 **依賴管理優化**（優先度：🟡 中）

**未使用的 devDependencies（可移除）：**
```bash
npm uninstall @eslint/eslintrc @tailwindcss/postcss autoprefixer postcss
```

**需要更新的套件：**
| 套件名稱 | 當前版本 | 最新版本 | 更新命令 |
|---------|---------|---------|---------|
| @next/bundle-analyzer | 15.5.2 | 15.5.3 | `npm update @next/bundle-analyzer` |
| @supabase/ssr | 0.6.1 | 0.7.0 | ⚠️ 有 breaking changes |
| react & react-dom | 19.1.0 | 19.1.1 | `npm update react react-dom` |
| zod | 4.1.5 | 4.1.8 | `npm update zod` |

**Supabase SSR 0.7.0 升級注意事項：**
- 檢查認證流程是否正常
- 測試 cookie 處理邏輯
- 參考[官方遷移指南](https://github.com/supabase/ssr/releases)

---

### 3. 🏗️ **服務層架構統一**（優先度：🔴 高）

**現況問題：**
- 混用三種服務模式：適配器模式、直接 Supabase 服務、v2 新架構
- 造成維護困難和程式碼重複

**改進方案：**
```typescript
// 統一使用 v2 服務架構
// 1. 將所有服務遷移到 src/services/v2/
// 2. 使用 AbstractSupabaseService 作為基礎類別

// 範例：統一的服務實作
import { AbstractSupabaseService } from '@/lib/abstract-supabase-service'

export class ProductServiceV2 extends AbstractSupabaseService<Product, CreateProductDTO, UpdateProductDTO> {
  constructor() {
    super({
      tableName: 'products',
      useAdminClient: false,
      enableCache: true,
      cacheConfig: {
        ttl: 300,
        keyPrefix: 'product'
      }
    })
  }
}

// 3. 移除舊的適配器檔案
// - cultureServiceAdapter.ts
// - farmTourServiceAdapter.ts
// - 等其他適配器...
```

---

### 4. 🚀 **效能優化**（優先度：🟡 中）

**4.1 實施 React Server Components：**
```typescript
// 將資料載入移到 Server Component
// app/products/page.tsx
async function ProductsPage() {
  const products = await productService.findAll() // 伺服器端載入

  return <ProductList products={products} />
}
```

**4.2 優化圖片載入：**
```typescript
// 使用 priority 屬性載入首屏圖片
<Image
  src={product.image}
  alt={product.name}
  priority={isAboveTheFold}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**4.3 實施路由預載入：**
```typescript
// 在 Link 元件中使用 prefetch
<Link href="/products" prefetch={true}>
  產品列表
</Link>
```

**4.4 減少 Bundle 大小：**
```bash
# 分析 bundle 大小
npm run analyze

# 實施動態導入
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

---

### 5. 🎨 **前端元件優化**（優先度：🟡 中）

**需要拆分的大型元件：**
- `AdminProductsTable.tsx` (25KB) → 拆分為：
  - `ProductTable.tsx`
  - `ProductTableRow.tsx`
  - `ProductTableActions.tsx`
  - `ProductTableFilters.tsx`

**建立元件庫結構：**
```
src/components/
├── ui/               # 基礎 UI 元件
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   └── Modal/
├── features/         # 功能元件
│   ├── products/
│   ├── orders/
│   └── auth/
└── layouts/          # 版面元件
    ├── AdminLayout/
    └── PublicLayout/
```

---

### 6. 🔒 **安全性增強**（優先度：🔴 高）

**6.1 實施 Content Security Policy：**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

**6.2 添加 Rate Limiting：**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

// 在 API 路由中使用
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }

  // 處理請求...
}
```

---

### 7. 📊 **監控與可觀測性**（優先度：🟡 中）

**7.1 整合 Sentry：**
```bash
npm install @sentry/nextjs

# 執行安裝精靈
npx @sentry/wizard@latest -i nextjs
```

**7.2 建立健康檢查端點：**
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    storage: await checkStorage(),
  }

  const healthy = Object.values(checks).every(v => v)

  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: healthy ? 200 : 503
  })
}
```

---

### 8. 🗂️ **資料庫優化**（優先度：🟡 中）

**8.1 實施連線池：**
```typescript
// lib/db-pool.ts
import { createClient } from '@supabase/supabase-js'

class SupabasePool {
  private pool: Map<string, any> = new Map()

  getClient(key: string) {
    if (!this.pool.has(key)) {
      this.pool.set(key, createClient(url, key))
    }
    return this.pool.get(key)
  }
}
```

**8.2 優化 N+1 查詢：**
```typescript
// 使用 join 而非多次查詢
const productsWithImages = await supabase
  .from('products')
  .select(`
    *,
    product_images (*)
  `)
```

---

### 9. 📱 **使用者體驗改進**（優先度：🟡 中）

**9.1 實施 PWA：**
```json
// public/manifest.json
{
  "name": "豪德農場",
  "short_name": "Haude",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/"
}
```

**9.2 添加骨架屏：**
```typescript
// components/ui/Skeleton.tsx
export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
```

---

### 10. 📝 **程式碼品質改進**（優先度：🟢 低）

**10.1 統一錯誤訊息：**
```typescript
// lib/i18n/errors.ts
export const errorMessages = {
  'auth.invalid_credentials': '帳號或密碼錯誤',
  'auth.session_expired': '登入已過期，請重新登入',
  'validation.required': '此欄位為必填',
  // ...
}
```

**10.2 標準化檔案命名：**
- 元件：PascalCase (`ProductCard.tsx`)
- 工具函數：camelCase (`formatDate.ts`)
- 常數：UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- 類型定義：PascalCase (`Product.types.ts`)

---

## 📅 執行計劃

### 第一階段（第 1 週）
- [ ] 修復 ESLint 配置
- [ ] 更新關鍵依賴
- [ ] 實施基本安全措施

### 第二階段（第 2 週）
- [ ] 統一服務層架構
- [ ] 實施效能優化
- [ ] 拆分大型元件

### 第三階段（第 3 週）
- [ ] 整合監控系統
- [ ] 優化資料庫查詢
- [ ] 改進使用者體驗

### 第四階段（持續改進）
- [ ] 程式碼品質改進
- [ ] 文檔完善
- [ ] 效能持續優化

---

## 📈 預期成效

- **效能提升**：頁面載入速度提升 30-40%
- **維護性**：統一架構後，新功能開發速度提升 50%
- **穩定性**：透過監控系統，問題發現時間縮短 80%
- **安全性**：降低安全風險，符合 OWASP 標準
- **使用者體驗**：行動裝置體驗顯著改善

---

## 🛠️ 工具與資源

- [Next.js 15 文檔](https://nextjs.org/docs)
- [Supabase 最佳實踐](https://supabase.com/docs/guides/getting-started)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [React 19 新特性](https://react.dev/blog)
- [Web Vitals 優化指南](https://web.dev/vitals/)

---

## 📝 備註

- 所有改進項目都應該漸進式進行，避免影響現有功能
- 每個改進都需要在開發環境充分測試
- 建議使用 Feature Flag 控制新功能的推出
- 保持與團隊的溝通，確保改進方向一致

---

*最後更新：2025-01-14*