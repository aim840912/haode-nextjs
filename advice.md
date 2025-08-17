# 豪德茶業電商專案實戰指南

> **現實檢查：個人開發者的電商上線路徑**
>
> 基於專案實際狀況，專注於最快讓網站開始營運的實用建議

## 🎯 專案現況（真實評估）

### ✅ **已經能用的部分**
- **基礎架構** - Next.js 15 + TypeScript + Tailwind CSS
- **產品展示** - 可瀏覽產品、文化、農場導覽
- **UI/UX** - 響應式設計，載入動畫，錯誤處理
- **資料庫** - Supabase 配置完成，有 migrations
- **快取系統** - Vercel KV (Upstash Redis) 已設定
- **SEO 基礎** - 結構化資料，meta tags

### ⚠️ **還是假的部分**（30+ TODOs）
- **🚨 購物車** - 全部是 mock 資料，無法真正加入商品
- **🚨 訂單系統** - 無法創建真實訂單
- **🚨 支付系統** - Stripe/綠界都是假的 API
- **🚨 會員系統** - 登入註冊是 mock，無真實用戶管理
- **⚠️ 庫存管理** - 沒有實際庫存扣減
- **⚠️ 聯絡資訊** - 電話、地址、社群連結都是假的

### 💡 **關鍵發現**
專案有完整的「外觀」，但核心電商功能都需要重新實作。
目前只能當作「產品型錄」使用，無法實際銷售。

---

## 🚀 實用開發路線圖

### Phase 0: 準備工作（本週末）
**目標：設定混合資料架構，保護免費額度**

#### 🔧 **環境配置**
```javascript
// .env.local (開發環境)
NODE_ENV=development
USE_MOCK_DATA=true          // 使用 JSON 檔案
NEXT_PUBLIC_DEMO_MODE=true  // 展示模式

// .env.production (生產環境)
USE_MOCK_DATA=false         // 使用 Supabase
NEXT_PUBLIC_DEMO_MODE=false
```

#### 📁 **智慧資料策略**
```typescript
// src/lib/data-strategy.ts
export const dataStrategy = {
  // 靜態資料：永遠用 JSON（省流量）
  products: process.env.USE_MOCK_DATA ? 'json' : 'cache+json',
  culture: 'json',   // 永遠用 JSON
  locations: 'json', // 永遠用 JSON
  news: 'json',      // 永遠用 JSON

  // 動態資料：必須用 Supabase
  users: 'supabase',
  carts: 'supabase',
  orders: 'supabase',
  inventory: 'supabase', // 庫存需即時同步

  // 三層快取配置
  cache: {
    browser: 600,    // 10分鐘
    kv: 3600,        // 1小時
    products: 86400, // 24小時（很少變）
    inventory: 60,   // 1分鐘（需即時）
  }
}
```

### Phase 1: 能收錢（2週）
**目標：讓客戶能實際下單付款，同時保護免費額度**

#### Week 1: 混合資料架構
- [ ] **保留 JSON 資料** - 產品目錄、文化、據點（省 Supabase 流量）
- [ ] **建立關鍵 Tables** - 購物車、訂單、庫存、用戶
- [ ] **三層快取系統** - 瀏覽器 → Vercel KV → 資料來源
- [ ] **會員註冊** - Supabase Auth 整合
- [ ] **聯絡資訊** - 更新真實電話、地址、社群連結

#### Week 2: 綠界支付整合
- [ ] **申請綠界測試帳號** - 台灣本土支付（優於 Stripe）
- [ ] **購物車系統** - 存 Supabase，支援用戶綁定
- [ ] **訂單建立** - 生成真實訂單編號
- [ ] **支付流程** - 綠界 → callback → 更新訂單 → 扣庫存
- [ ] **完整測試** - 從瀏覽到付款的完整流程

### Phase 2: 能出貨（1-2週）
**目標：建立後台管理，能處理訂單**

#### Week 4: 後台管理
- [ ] **訂單管理** - 查看、更新訂單狀態
- [ ] **庫存管理** - 手動調整庫存
- [ ] **客戶管理** - 查看客戶訂單歷史
- [ ] **通知系統** - 新訂單通知（Email/LINE）

#### Week 5: 出貨流程
- [ ] **物流整合** - 7-11、全家或宅配
- [ ] **出貨通知** - 客戶收到出貨通知
- [ ] **訂單追蹤** - 客戶可查詢訂單狀態

### Phase 3: 能經營（依需求）
**目標：建立客戶關係，提升營收**

#### 功能優先級
1. **會員制度** - 累積購買記錄，VIP 折扣
2. **行銷工具** - 促銷活動，折扣碼
3. **客服系統** - LINE 客服，FAQ
4. **數據分析** - 銷售報表，客戶分析

### Phase 4: 效能優化（有流量後）
**目標：提升使用者體驗**

#### 只在必要時做
- **CDN 優化** - 圖片 CDN（Cloudinary）
- **API 快取** - 熱門產品快取
- **SEO 進階** - GA4，Search Console
- **A/B 測試** - 轉換率優化

---

## 📋 MVP 上線檢查清單

### 🚨 **必須完成**（不做就無法營運）
- [ ] 產品可以真實購買
- [ ] 支付可以真實收款
- [ ] 訂單可以真實出貨
- [ ] 庫存可以真實扣減
- [ ] 客戶可以聯絡到你

### ⚠️ **建議完成**（影響體驗但不阻止營運）
- [ ] 會員註冊登入
- [ ] 訂單歷史查詢
- [ ] 基本客服機制
- [ ] 手機端體驗

### ✨ **可以之後做**（優化功能）
- [ ] 產品推薦
- [ ] 會員等級制度
- [ ] 複雜的促銷活動
- [ ] 數據分析工具

---

## 🛠️ 技術實作優先順序

### 高優先級
```javascript
// 1. 資料庫 Schema（Supabase）
products: 產品表，庫存欄位
orders: 訂單表，狀態追蹤
order_items: 訂單明細
carts: 購物車表

// 2. API 端點（必須的）
POST /api/cart/add      // 加入購物車
POST /api/orders        // 建立訂單
POST /api/payment       // 支付處理
GET  /api/orders/[id]   // 查詢訂單
```

### 中優先級
```javascript
// 3. 後台管理
GET  /api/admin/orders    // 訂單管理
PUT  /api/admin/inventory // 庫存管理
POST /api/notifications   // 通知系統
```

### 低優先級
```javascript
// 4. 行銷功能
POST /api/coupons         // 優惠券
GET  /api/recommendations // 商品推薦
POST /api/reviews         // 商品評價
```

---

## ⏰ 現實時程預估

### 個人開發者（每週 20 小時）

#### 樂觀情況（一切順利）
- **Phase 1**: 3 週
- **Phase 2**: 2 週
- **總計**: 5 週可上線

#### 現實情況（遇到問題）
- **Phase 1**: 4-5 週
- **Phase 2**: 3 週
- **總計**: 6-8 週可上線

#### 悲觀情況（卡很久）
- **Phase 1**: 6-8 週
- **Phase 2**: 4 週
- **總計**: 10-12 週可上線

### 🎯 **關鍵里程碑**
1. **Week 3**: 能收到第一筆真實訂單
2. **Week 5**: 能出第一次真實貨
3. **Week 8**: 網站可以穩定營運

---

## 📊 Supabase 流量管理

### 免費額度詳細分析
```javascript
Supabase 免費方案：
✅ Database: 500 MB 儲存空間（絕對夠用）
✅ API Requests: 無限制（但有速率限制）
⚠️ Bandwidth: 2 GB/月（主要限制）
✅ File Storage: 1 GB
✅ Monthly Active Users: 50,000
✅ Edge Functions: 500,000 次調用/月
```

### 流量消耗計算機
| 使用情境        | 每日 API 請求 | 每月流量消耗 | 是否安全   |
| --------------- | ------------- | ------------ | ---------- |
| **個人測試**    | 100 次        | ~300 MB      | ✅ 安全     |
| **10 訪客/天**  | 100 次        | ~300 MB      | ✅ 安全     |
| **50 訪客/天**  | 500 次        | ~1.5 GB      | ⚠️ 接近上限 |
| **100 訪客/天** | 1000 次       | ~3 GB        | ❌ 超標     |

### 三層快取架構（節省流量）
```typescript
// src/lib/smart-cache.ts
class SmartCache {
  async get(key: string) {
    // 第一層：瀏覽器快取（最快）
    const browserCached = this.browserCache.get(key)
    if (browserCached && !this.isExpired(browserCached)) {
      return browserCached.data
    }

    // 第二層：Vercel KV 快取（中等）
    const kvCached = await kv.get(key)
    if (kvCached) {
      this.browserCache.set(key, kvCached)
      return kvCached
    }

    // 第三層：資料來源（最慢，消耗流量）
    const fresh = await this.fetchFromSource(key)

    // 更新所有快取層
    await kv.set(key, fresh, { ex: this.getTTL(key) })
    this.browserCache.set(key, fresh)

    return fresh
  }

  private fetchFromSource(key: string) {
    const [resource] = key.split(':')

    // 智慧路由：靜態資料用 JSON，動態資料用 Supabase
    if (['products', 'culture', 'locations'].includes(resource)) {
      return import(`/data/${resource}.json`) // 不消耗 Supabase 流量
    }

    return supabase.from(resource).select() // 消耗 Supabase 流量
  }
}
```

## 💰 成本分階段規劃

### Phase 0-1: 測試期（免費）
```
✅ Vercel Hobby: $0/月
✅ Supabase Free: $0/月（2GB 流量）
✅ 綠界測試: 免費
✅ 網域: $10/年
總計: $10/年
```

### Phase 2: 小流量（50 訪客/天）
```
✅ Vercel Hobby: $0/月（還夠用）
⚠️ Supabase Free: $0/月（接近上限）
✅ 綠界正式: 2.8% 手續費
✅ 網域: $10/年
總計: ~$10/年 + 手續費
```

### Phase 3: 中流量（100+ 訪客/天）
```
⚠️ Vercel Pro: $20/月（需要 Pro 功能）
❌ Supabase Pro: $25/月（必須升級）
✅ 綠界正式: 2.8% 手續費
✅ 網域: $10/年
總計: $45/月 + 手續費
```

### 升級決策點
```javascript
// 何時升級 Supabase Pro？
if (
  monthlyBandwidth > 1.5 * 1024 * 1024 * 1024 || // 1.5GB
  dailyActiveUsers > 30 ||
  monthlyRevenue > 5000 // 有收入了
) {
  upgradeToPro() // $25/月，值得投資
}

// 何時升級 Vercel Pro？
if (
  needTeamCollaboration ||
  needAdvancedAnalytics ||
  buildTimeouts ||
  customDomains > 1
) {
  upgradeVercel() // $20/月
}
```

---

## 🚨 常見陷阱提醒

### 不要做的事
❌ **過度優化** - 先讓基本功能能用
❌ **完美主義** - 80% 功能就可以上線
❌ **追求新技術** - 用熟悉的工具
❌ **複雜的會員制度** - 簡單的登入就夠
❌ **複雜的促銷** - 基本折扣就夠

### 要做的事
✅ **快速測試** - 每個功能都要實際測試
✅ **備份計畫** - 支付失敗的處理方式
✅ **客服準備** - 客戶問題的回應機制
✅ **庫存監控** - 避免超賣
✅ **資料備份** - 重要資料要備份

---

## 📊 成功指標

### 技術指標（Week 1-4）
- [ ] 網站載入速度 < 3 秒
- [ ] 手機端可正常使用
- [ ] 支付成功率 > 95%
- [ ] 零重大 bug

### 業務指標（Month 1-3）
- [ ] 第一筆真實訂單
- [ ] 轉換率 > 1%
- [ ] 客戶滿意度 > 4.0/5
- [ ] 月營收 > 成本

---

## 🎯 下一步行動

### 立即開始（本週）
1. **設定混合資料策略** - 實作 Phase 0 環境配置
2. **申請綠界測試帳號** - 開始支付整合
3. **建立 Supabase Tables** - orders, carts, inventory
4. **更新聯絡資訊** - 電話、地址、社群連結
5. **實作三層快取** - SmartCache 類別

### 本月目標
🎯 **免費測試到第一筆真實訂單成功**

### 關鍵成功指標
```javascript
// 測試期間目標
✅ 網站功能完整（購物車 → 訂單 → 支付）
✅ Supabase 流量 < 1GB/月
✅ 支付流程 100% 成功率
✅ 零重大 bug

// 營運期間目標
📈 第一筆真實訂單
📈 月營收 > 月成本
📈 客戶滿意度 > 4.0/5
📈 轉換率 > 1%
```

記住：**先免費測試完善，再付費規模化**。混合架構讓你可以最低成本驗證商業模式！

---

## 🔄 資料遷移路徑

### 測試階段（免費）
```
📁 /data/products.json    ← 產品目錄（不變）
📁 /data/culture.json     ← 文化內容（不變）
📁 /data/locations.json   ← 據點資訊（不變）
🗄️  Supabase: users, carts, orders, inventory
```

### 營運階段（付費）
```
🗄️  Supabase: 全部資料
📦 Vercel KV: 快取層
🌐 CDN: 圖片資源
```

**漸進式遷移，風險最小，成本最優！**

---

*最後更新：2025-08-17*
*整合 Supabase 免費額度策略，專注零成本測試到收費營運*