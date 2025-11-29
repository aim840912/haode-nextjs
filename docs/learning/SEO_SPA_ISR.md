# SEO、SPA、ISR 完整指南

> 現代 Web 開發的三個核心概念

---

## 目錄

- [SEO (Search Engine Optimization)](#1-seo-search-engine-optimization)
- [SPA (Single Page Application)](#2-spa-single-page-application)
- [ISR (Incremental Static Regeneration)](#3-isr-incremental-static-regeneration)
- [渲染策略比較](#4-渲染策略比較)
- [如何選擇](#5-如何選擇)

---

## 1. SEO (Search Engine Optimization)

### 什麼是 SEO？

**搜尋引擎優化**（Search Engine Optimization）是提升網站在搜尋引擎（如 Google、Bing）中排名的技術和策略。

### 核心原理

```
用戶搜尋關鍵字
       ↓
搜尋引擎爬蟲抓取網頁
       ↓
分析頁面內容、結構、速度
       ↓
根據演算法排序結果
       ↓
顯示給用戶
```

### SEO 的關鍵因素

| 類別 | 因素 | 重要性 |
|------|------|--------|
| **技術 SEO** | 網站速度、行動裝置友善、HTTPS | ⭐⭐⭐⭐⭐ |
| **內容 SEO** | 標題、描述、關鍵字、內容品質 | ⭐⭐⭐⭐⭐ |
| **結構 SEO** | URL 結構、內部連結、Sitemap | ⭐⭐⭐⭐ |
| **外部 SEO** | 反向連結、社群分享 | ⭐⭐⭐ |

### 為什麼 SPA 對 SEO 不友善？

```html
<!-- 傳統 SSR 網頁 - 爬蟲看到完整內容 -->
<html>
  <head><title>商品列表</title></head>
  <body>
    <h1>熱門商品</h1>
    <div class="product">商品 A</div>
    <div class="product">商品 B</div>
  </body>
</html>

<!-- SPA 網頁 - 爬蟲只看到空殼 -->
<html>
  <head><title>Loading...</title></head>
  <body>
    <div id="root"></div>  <!-- 內容要等 JS 執行才會出現 -->
    <script src="app.js"></script>
  </body>
</html>
```

### Next.js SEO 最佳實踐

```typescript
// app/products/[id]/page.tsx
import { Metadata } from 'next'

// 動態生成 SEO metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id)

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  }
}
```

---

## 2. SPA (Single Page Application)

### 什麼是 SPA？

**單頁應用程式**（Single Page Application）是一種網頁應用架構，整個應用只有一個 HTML 頁面，透過 JavaScript 動態更新內容。

### SPA 運作流程

```
┌─────────────────────────────────────────────────────────┐
│                    傳統多頁應用 (MPA)                     │
├─────────────────────────────────────────────────────────┤
│  首頁 ──(點擊)──> 伺服器請求 ──> 載入新 HTML ──> 商品頁   │
│  商品頁 ─(點擊)──> 伺服器請求 ──> 載入新 HTML ──> 購物車  │
│                                                         │
│  每次導航 = 完整頁面重新載入 (白屏閃爍)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    單頁應用 (SPA)                        │
├─────────────────────────────────────────────────────────┤
│  首頁 ──(點擊)──> JS 攔截 ──> 只更新變化部分 ──> 商品頁   │
│  商品頁 ─(點擊)──> JS 攔截 ──> 只更新變化部分 ──> 購物車  │
│                                                         │
│  導航 = 局部更新 (流暢無閃爍)                             │
└─────────────────────────────────────────────────────────┘
```

### SPA 優缺點

| 優點 | 缺點 |
|------|------|
| ✅ 用戶體驗流暢，無頁面閃爍 | ❌ 首次載入較慢（需下載整個 JS） |
| ✅ 前後端分離，開發效率高 | ❌ SEO 不友善（內容靠 JS 生成） |
| ✅ 可離線運作（PWA） | ❌ 瀏覽器相容性問題 |
| ✅ 減少伺服器負載 | ❌ 記憶體管理較複雜 |

### 常見 SPA 框架

| 框架 | 特點 |
|------|------|
| **React** | 最大生態系，JSX 語法 |
| **Vue** | 易學，漸進式框架 |
| **Angular** | 企業級，完整解決方案 |
| **Svelte** | 編譯時框架，無虛擬 DOM |

---

## 3. ISR (Incremental Static Regeneration)

### 什麼是 ISR？

**增量靜態再生成**（Incremental Static Regeneration）是 Next.js 提出的渲染策略，結合了 SSG（靜態生成）和 SSR（伺服器渲染）的優點。

### 四種渲染策略詳解

#### CSR (Client-Side Rendering)

```
建置時: 生成空 HTML
請求時: 瀏覽器下載 JS → 執行 → 獲取資料 → 渲染

適用: 後台管理系統、不需要 SEO 的應用
代表: React SPA、Vue SPA
```

#### SSR (Server-Side Rendering)

```
建置時: 無預生成
請求時: 伺服器獲取資料 → 生成 HTML → 回傳給瀏覽器

適用: 即時資料、個人化內容
代表: Next.js (getServerSideProps)、Nuxt.js
```

#### SSG (Static Site Generation)

```
建置時: 預先生成所有靜態 HTML
請求時: 直接從 CDN 返回靜態檔案

適用: 部落格、文件網站、行銷頁面
代表: Next.js (getStaticProps)、Gatsby、Astro
```

#### ISR (Incremental Static Regeneration)

```
建置時: 預先生成靜態 HTML
請求時: 返回快取的靜態頁面
背景:   超過 revalidate 時間後，背景重新生成

適用: 電商產品頁、新聞網站、需要定期更新的內容
代表: Next.js (revalidate)
```

### ISR 運作流程圖

```
                    首次請求
                       │
                       ▼
              ┌────────────────┐
              │  有快取頁面？   │
              └────────────────┘
                 │          │
                 否          是
                 │          │
                 ▼          ▼
           ┌─────────┐  ┌──────────────┐
           │ SSR 生成 │  │ 返回快取頁面  │
           │ 並快取   │  └──────────────┘
           └─────────┘         │
                               ▼
                      ┌────────────────┐
                      │ 超過 revalidate │
                      │    時間？       │
                      └────────────────┘
                         │          │
                         否          是
                         │          │
                         ▼          ▼
                    保持快取    背景重新生成
                               (用戶無感知)
```

### Next.js ISR 程式碼範例

#### Pages Router

```typescript
// pages/products/[id].tsx
export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id)

  return {
    props: { product },
    revalidate: 60,  // 每 60 秒重新驗證一次
  }
}

export async function getStaticPaths() {
  const products = await fetchTopProducts()

  return {
    paths: products.map(p => ({ params: { id: p.id } })),
    fallback: 'blocking',  // 新頁面 SSR 後快取
  }
}
```

#### App Router (推薦)

```typescript
// app/products/[id]/page.tsx

// 設定 revalidate 時間
export const revalidate = 60  // 每 60 秒重新驗證

// 或在 fetch 層級設定
async function getProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, {
    next: { revalidate: 60 }
  })
  return res.json()
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id)
  return <ProductDetail product={product} />
}
```

#### 手動觸發 Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const { path, tag } = await request.json()

  // 方法 1: 重新驗證特定路徑
  if (path) {
    revalidatePath(path)
  }

  // 方法 2: 重新驗證特定標籤
  if (tag) {
    revalidateTag(tag)
  }

  return Response.json({ revalidated: true })
}
```

---

## 4. 渲染策略比較

### 總覽表

| 特性 | CSR (SPA) | SSR | SSG | ISR |
|------|-----------|-----|-----|-----|
| **SEO** | ❌ 差 | ✅ 好 | ✅ 最好 | ✅ 好 |
| **首次載入** | ❌ 慢 | ⚡ 中等 | ⚡⚡ 最快 | ⚡⚡ 快 |
| **伺服器負載** | ✅ 低 | ❌ 高 | ✅ 最低 | ✅ 低 |
| **內容即時性** | ✅ 即時 | ✅ 即時 | ❌ 建置時 | ⚡ 準即時 |
| **建置時間** | ✅ 快 | ✅ 快 | ❌ 慢 | ✅ 快 |
| **CDN 快取** | ⚡ 部分 | ❌ 困難 | ✅ 完全 | ✅ 完全 |

### 效能指標比較

| 指標 | CSR | SSR | SSG | ISR |
|------|-----|-----|-----|-----|
| **TTFB** | 快 | 慢 | 最快 | 最快 |
| **FCP** | 慢 | 快 | 最快 | 最快 |
| **TTI** | 慢 | 中等 | 快 | 快 |
| **LCP** | 慢 | 中等 | 最快 | 最快 |

> - TTFB: Time to First Byte（首位元組時間）
> - FCP: First Contentful Paint（首次內容繪製）
> - TTI: Time to Interactive（可互動時間）
> - LCP: Largest Contentful Paint（最大內容繪製）

---

## 5. 如何選擇

### 決策樹

```
需要 SEO 嗎？
    │
    ├── 否 → 是後台/Dashboard 嗎？
    │           │
    │           ├── 是 → CSR (SPA)
    │           │        React/Vue SPA
    │           │
    │           └── 否 → 考慮 SSR 或 ISR
    │
    └── 是 → 內容多久更新一次？
                │
                ├── 即時/個人化 → SSR
                │                 每次請求都重新渲染
                │
                ├── 幾乎不變 → SSG
                │              建置時生成，CDN 快取
                │
                └── 定期更新 → ISR ⭐ (推薦)
                               結合 SSG 速度和 SSR 即時性
```

### 場景建議

| 場景 | 推薦策略 | 原因 |
|------|----------|------|
| 後台管理系統 | CSR | 不需 SEO，互動性強 |
| 個人化 Dashboard | SSR | 每個用戶內容不同 |
| 部落格/文件 | SSG | 內容穩定，SEO 重要 |
| 電商產品頁 | ISR | 需要 SEO，庫存會變動 |
| 新聞網站 | ISR | 需要 SEO，內容定期更新 |
| 社群動態牆 | SSR + CSR | 即時性 + 互動性 |

### Next.js App Router 混合策略

```typescript
// 同一個頁面可以混合使用多種策略

// 靜態部分 - SSG
async function StaticHeader() {
  const config = await getConfig()  // 建置時獲取
  return <header>{config.siteName}</header>
}

// 動態部分 - SSR
async function DynamicContent() {
  const data = await fetch('/api/data', { cache: 'no-store' })
  return <main>{data}</main>
}

// ISR 部分
async function CachedSection() {
  const data = await fetch('/api/cached', {
    next: { revalidate: 3600 }  // 每小時更新
  })
  return <section>{data}</section>
}

// 客戶端部分 - CSR
'use client'
function InteractiveWidget() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

---

## 延伸閱讀

- [Next.js 官方文件 - Rendering](https://nextjs.org/docs/app/building-your-application/rendering)
- [Google SEO 入門指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Web Vitals](https://web.dev/vitals/)

---

*最後更新：2025-11-26*
