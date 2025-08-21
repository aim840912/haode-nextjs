# 豪德茶業 - 生產部署指南

> 基於現有 Supabase 整合的最佳部署方案

## 🚀 推薦配置（生產就緒）

### 核心技術棧
```yaml
平台: Vercel (Next.js 原生支援)
資料庫: Supabase PostgreSQL (已整合)
快取: Vercel KV (Redis)
檔案儲存: Vercel Blob Storage
認證: Supabase Auth
分析: Vercel Analytics
CDN: Vercel Edge Network (全球)
```

### 環境變數配置
```bash
# Supabase (已設定)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel KV (快取)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token

# 支付整合
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ECPAY_MERCHANT_ID=your_merchant_id
ECPAY_HASH_KEY=your_hash_key

# 第三方服務
RESEND_API_KEY=re_...
GOOGLE_MAPS_API_KEY=your_maps_key
GOOGLE_ANALYTICS_ID=G-...
```

## 📦 立即部署步驟

### 1. 準備部署
```bash
# 確保建置成功
npm run build
npm run lint

# 推送到 GitHub
git add .
git commit -m "feat: 準備生產部署"
git push origin main
```

### 2. Vercel 部署
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 登入
3. 點擊 "Import Project"
4. 選擇 `haude` repository
5. 配置環境變數
6. 點擊 "Deploy"

### 3. 設定 Vercel KV
```bash
# 在 Vercel Dashboard 中
1. 進入專案設定
2. Storage > Create Database
3. 選擇 "KV" (Redis)
4. 自動產生環境變數
```

### 4. 配置自定義域名
```bash
# 在 Vercel 專案設定中
1. Domains > Add Domain
2. 輸入自定義域名 (例: haudetea.com)
3. 設定 DNS 記錄:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com
```

## 🎯 效能優化配置

### Vercel 專案設定
```javascript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["hkg1", "tpe1"], // 亞洲節點優化
  "functions": {
    "app/api/**": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=300, stale-while-revalidate" }
      ]
    }
  ]
}
```

### 快取策略實施
```typescript
// lib/cache.ts
import { kv } from '@vercel/kv'

export async function getCachedData<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl = 300
): Promise<T> {
  // 檢查快取
  const cached = await kv.get<T>(key)
  if (cached) return cached
  
  // 獲取新資料
  const data = await fetcher()
  await kv.set(key, data, { ex: ttl })
  
  return data
}

// 使用範例
export async function getProducts() {
  return getCachedData(
    'products:all',
    () => supabase.from('products').select('*'),
    600 // 10分鐘快取
  )
}
```

## 🔧 資料庫最佳化

### Supabase 生產設定
```sql
-- 建立必要的索引
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 啟用 Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策
CREATE POLICY "Users can view own data" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 連線池配置
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'haude-tea' },
  },
})
```

## 📊 監控與分析

### Vercel Analytics 設定
```bash
# 安裝 Vercel Analytics
npm install @vercel/analytics

# 在 app/layout.tsx 中添加
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 錯誤監控
```bash
# 安裝 Sentry
npm install @sentry/nextjs

# 配置 sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

## 🔐 安全性配置

### 安全標頭設定
```javascript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 環境變數驗證
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  KV_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test'])
})

export const env = envSchema.parse(process.env)
```

## 💰 成本優化

### Vercel 方案選擇
- **Hobby (免費)**: 個人專案，適合 MVP
- **Pro ($20/月)**: 商業使用，無限頻寬
- **Team ($99/月)**: 團隊協作，進階功能

### Supabase 方案
- **Free**: 500 MB 資料庫，50K 每月 API 請求
- **Pro ($25/月)**: 8 GB 資料庫，500K 每月請求
- **Team ($599/月)**: 企業級功能

### 最佳實踐建議
```typescript
// 減少 API 呼叫
- 實施適當快取策略
- 使用 Supabase Realtime 減少輪詢
- 批次處理資料庫操作
- 優化圖片大小和格式

// 監控使用量
- 設定 Vercel 使用量警告
- 監控 Supabase 資料庫大小
- 定期清理過期資料
```

## 🚀 部署後檢查清單

### 必要檢查
- [ ] 所有頁面正常載入
- [ ] API 端點回應正常
- [ ] 資料庫連線成功
- [ ] 圖片正常顯示
- [ ] 行動裝置體驗良好
- [ ] SEO 基礎設定完成

### 效能檢查
- [ ] Lighthouse 分數 > 90
- [ ] Core Web Vitals 通過
- [ ] 圖片最佳化完成
- [ ] 快取策略生效

### 安全檢查
- [ ] HTTPS 強制啟用
- [ ] 環境變數安全設定
- [ ] RLS 政策生效
- [ ] API 端點保護

## 📞 支援資源

### 官方文件
- [Vercel 部署指南](https://vercel.com/docs)
- [Supabase 文件](https://supabase.com/docs)
- [Next.js 部署最佳實踐](https://nextjs.org/docs/deployment)

### 社群支援
- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

## 🏗️ 後期擴展最佳實踐

### 企業級架構演進 (6-12個月後)

#### 微服務化重構
```yaml
# 大規模架構升級
前端層: Next.js (Vercel) + React Native App
API層: Node.js + GraphQL (Railway/Render)
資料層: PostgreSQL主庫 + Redis快取 + Elasticsearch搜尋
檔案層: Cloudinary + 全球CDN
支付層: 多元金流整合 (Stripe + 綠界 + LINE Pay)
```

#### 智慧快取策略
```typescript
// 多層快取架構
interface CacheStrategy {
  L1: 'Browser ServiceWorker'    // 客戶端快取
  L2: 'Vercel Edge Cache'        // 邊緣快取
  L3: 'Redis Application Cache'  // 應用快取
  L4: 'PostgreSQL Query Cache'   // 資料庫快取
}

// 智慧快取管理
export class SmartCache {
  static async invalidateByPattern(pattern: string) {
    const keys = await kv.keys(pattern)
    await Promise.all(keys.map(key => kv.del(key)))
  }
  
  static async warmupPopularProducts() {
    const popular = await this.getPopularProducts()
    await Promise.all(
      popular.map(p => this.preloadProduct(p.id))
    )
  }
}
```

### 進階監控與可觀測性

#### 全方位監控架構
```typescript
const MonitoringStack = {
  infrastructure: 'Vercel Analytics + Supabase Metrics',
  application: 'Sentry + DataDog',
  business: 'Mixpanel + Google Analytics 4',
  userExperience: 'Hotjar + FullStory',
  performance: 'Core Web Vitals + Lighthouse CI'
}

// 業務指標監控
export class BusinessMetrics {
  static async getDashboard() {
    return {
      // 即時營收指標
      revenue: await this.getRevenueMetrics(),
      conversion: await this.getConversionRate(),
      inventory: await this.getStockStatus(),
      
      // 技術健康度
      performance: await this.getPerformanceScore(),
      errorRate: await this.getErrorMetrics(),
      uptime: await this.getUptimeStatus()
    }
  }
}
```

#### 智慧警報系統
```typescript
export class AlertManager {
  static async monitorHealth() {
    const metrics = await this.collectMetrics()
    const thresholds = await this.getDynamicThresholds()
    
    // 即時警報
    if (metrics.errorRate > thresholds.critical) {
      await this.triggerCriticalAlert(metrics)
      await this.enableFallbackMode()
    }
    
    // 預測性警報
    const prediction = await this.predictIssues(metrics)
    if (prediction.probability > 0.8) {
      await this.sendPreventiveAlert(prediction)
    }
  }
}
```

### 企業級安全實踐

#### 多層安全防護
```typescript
// 進階安全配置
export class SecurityManager {
  // 智慧速率限制
  static createAdaptiveRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: (req) => this.calculateUserLimit(req),
      keyGenerator: (req) => this.getClientFingerprint(req),
      skip: (req) => this.isWhitelistedUser(req)
    })
  }
  
  // 進階 CSRF 保護
  static validateCSRF(token: string, session: string): boolean {
    const expected = crypto
      .createHmac('sha256', process.env.CSRF_SECRET)
      .update(session)
      .digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(token), Buffer.from(expected)
    )
  }
  
  // 資料加密與隱私
  static encryptSensitiveData(data: any): string {
    const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY)
    return cipher.update(JSON.stringify(data), 'utf8', 'hex') + cipher.final('hex')
  }
}

// GDPR 合規
export class PrivacyManager {
  static async handleDataRequest(userId: string, type: 'export' | 'delete') {
    switch (type) {
      case 'export':
        return await this.exportUserData(userId)
      case 'delete':
        return await this.anonymizeUserData(userId)
    }
  }
}
```

### 效能極限優化

#### 智慧預載與優化
```typescript
// AI 驅動的使用者行為預測
export class IntelligentOptimization {
  static async predictUserBehavior(userId: string) {
    const history = await this.getUserHistory(userId)
    const predictions = await this.mlPredict(history)
    
    // 預載可能感興趣的內容
    await Promise.all(
      predictions.map(p => this.preloadContent(p.id))
    )
  }
  
  // 進階圖片優化
  static createAdaptiveImage(src: string) {
    return {
      placeholder: this.generateBlurHash(src),
      formats: {
        avif: this.generateAVIF(src),
        webp: this.generateWebP(src),
        jpeg: this.optimizeJPEG(src)
      },
      sizes: ['320w', '640w', '1280w', '1920w']
    }
  }
}

// 資料庫查詢極限優化
export class QueryOptimizer {
  static async optimizedProductSearch(filters: SearchFilters) {
    // 使用 materialized views 和智慧索引
    const query = supabase
      .from('products_optimized_view')
      .select('*')
    
    // 動態查詢優化
    if (filters.category) {
      query.eq('category', filters.category)
    }
    
    // 分頁和預載優化
    const { data, count } = await query
      .range(filters.offset, filters.limit)
      .order(filters.sortBy, { ascending: filters.asc })
    
    // 預載下一頁
    this.preloadNextPage(filters)
    
    return { data, count, hasMore: count > filters.offset + filters.limit }
  }
}
```

### DevOps 自動化升級

#### 進階 CI/CD 管道
```yaml
# .github/workflows/enterprise.yml
name: Enterprise Deployment Pipeline
on:
  push:
    branches: [main, staging]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Multi-layer Testing
        run: |
          npm run lint
          npm run type-check
          npm run test:unit
          npm run test:integration
          npm run test:e2e
          npm run test:performance
          npm run security:scan
          npm run accessibility:test
      
      - name: Performance Budget
        run: npm run lighthouse:ci
      
      - name: Visual Regression
        run: npm run test:visual:percy
  
  staging-deploy:
    if: github.ref == 'refs/heads/staging'
    needs: quality-gates
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: vercel --target staging
      
      - name: Smoke Tests
        run: npm run test:smoke:staging
  
  production-deploy:
    if: github.ref == 'refs/heads/main'
    needs: quality-gates
    runs-on: ubuntu-latest
    steps:
      - name: Blue-Green Deployment
        run: |
          vercel --prod --target production-blue
          npm run test:production:health-check
          vercel alias production-blue haudetea.com
      
      - name: Post-deployment Monitoring
        run: npm run monitor:post-deploy
```

#### 自動化運維
```typescript
// 自動擴展和負載管理
export class AutoScaling {
  static async monitorAndScale() {
    const metrics = await this.getSystemMetrics()
    
    if (metrics.cpuUsage > 80) {
      await this.scaleUp()
    }
    
    if (metrics.memoryUsage > 85) {
      await this.optimizeMemory()
    }
    
    // 預測性擴展
    const forecast = await this.forecastLoad()
    if (forecast.peakExpected) {
      await this.preemptiveScale(forecast.expectedLoad)
    }
  }
}
```

### 業務智能與進階分析

#### 多維度商業洞察
```typescript
export class BusinessIntelligence {
  static async generateInsights() {
    return {
      // 客戶分析
      customerSegmentation: await this.analyzeCustomerSegments(),
      lifetimeValue: await this.calculateCLV(),
      churnPrediction: await this.predictChurn(),
      
      // 產品洞察
      productPerformance: await this.analyzeProductMetrics(),
      inventoryOptimization: await this.optimizeStock(),
      dynamicPricing: await this.calculateOptimalPricing(),
      
      // 市場分析
      seasonalTrends: await this.analyzeSeasonality(),
      competitorAnalysis: await this.monitorCompetitors(),
      marketingROI: await this.calculateROI()
    }
  }
  
  // AI 驅動的個人化推薦
  static async getSmartRecommendations(userId: string) {
    const [collaborative, contentBased, trending, seasonal] = await Promise.all([
      this.collaborativeFiltering(userId),
      this.contentBasedFiltering(userId),
      this.getTrendingProducts(),
      this.getSeasonalRecommendations()
    ])
    
    return this.hybridRecommendation({
      collaborative, contentBased, trending, seasonal
    })
  }
}
```

### 企業級部署檢查清單

#### 技術債務管理
- [ ] **代碼健康度監控** - SonarQube 整合，定期重構
- [ ] **依賴安全掃描** - 自動化安全更新與漏洞修復
- [ ] **效能基準測試** - 每月效能回歸測試
- [ ] **資料庫優化** - 查詢分析與索引調整

#### 高可用性設計
- [ ] **多區域部署** - 災難恢復與負載分散
- [ ] **自動備份策略** - 每日備份與恢復測試
- [ ] **服務監控** - 24/7 監控與警報機制
- [ ] **降級機制** - 服務故障時的優雅降級

#### 資料治理
- [ ] **資料品質監控** - 自動化資料驗證
- [ ] **隱私合規** - GDPR/個資法合規檢查
- [ ] **資料備份** - 多層備份與恢復策略
- [ ] **審計追蹤** - 完整的操作日誌記錄

#### 團隊協作優化
- [ ] **代碼審查** - 強制 PR 審查流程
- [ ] **文檔維護** - 自動化文檔生成
- [ ] **知識管理** - 技術知識庫建立
- [ ] **培訓體系** - 新人訓練與技能提升

### 成本與 ROI 優化

#### 智慧成本管理
```typescript
export class CostOptimizer {
  static async optimizeResources() {
    // 分析使用模式
    const usage = await this.analyzeUsagePatterns()
    
    // 建議優化措施
    const recommendations = {
      serverless: usage.trafficPattern === 'spiky',
      reserved: usage.trafficPattern === 'steady',
      spot: usage.toleratesInterruption
    }
    
    // 成本預測
    const forecast = await this.forecastMonthlyCost(recommendations)
    return { recommendations, forecast }
  }
}
```

#### 投資回報率追蹤
- **技術投資 ROI** - 開發效率提升度量
- **基礎設施 ROI** - 效能改善與成本比較
- **安全投資 ROI** - 風險降低與投資成本分析

---

> 💡 **建議**: 先使用免費方案部署和測試，確認一切正常後再升級到付費方案。後期可根據業務增長逐步實施進階最佳實踐，優先關注效能和安全性。