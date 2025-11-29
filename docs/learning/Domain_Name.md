# 網域名稱 (Domain Name) 完整指南

> 網站在網路上的「地址」系統

---

## 目錄

- [什麼是網域名稱](#1-什麼是網域名稱)
- [網域名稱結構](#2-網域名稱結構)
- [DNS 運作原理](#3-dns-運作原理)
- [網域與 Web 開發](#4-網域與-web-開發)
- [網域購買與管理](#5-網域購買與管理)
- [子網域 vs 子目錄](#6-子網域-vs-子目錄)
- [HTTPS 與 SSL 憑證](#7-https-與-ssl-憑證)

---

## 1. 什麼是網域名稱？

**網域名稱**（Domain Name）是網站在網路上的「地址」，讓人們可以用好記的文字（而非數字 IP）來訪問網站。

```
人類友善的網址          實際的 IP 地址
───────────────        ──────────────────
google.com      →      142.250.185.46
facebook.com    →      157.240.1.35
example.com     →      93.184.216.34
```

### 為什麼需要網域名稱？

| IP 地址 | 網域名稱 |
|---------|----------|
| 難以記憶 (142.250.185.46) | 容易記憶 (google.com) |
| 可能變動 | 固定不變 |
| 無法表達品牌 | 可建立品牌識別 |

---

## 2. 網域名稱結構

### 完整結構圖

```
           完整網域名稱 (FQDN - Fully Qualified Domain Name)
┌────────────────────────────────────────────────────────────┐
│                                                            │
│     https://www.shop.example.com/products?id=123           │
│     ──┬──  ─┬─ ──┬─ ───┬─── ─┬─  ────┬────  ──┬──          │
│       │     │    │     │     │       │        │            │
│    協定  子網域 子網域  二級   頂級   路徑     查詢參數       │
│  (Protocol)         網域   網域   (Path)   (Query)         │
│                    (SLD)  (TLD)                            │
└────────────────────────────────────────────────────────────┘
```

### 各部分詳解

| 部分 | 英文 | 範例 | 說明 |
|------|------|------|------|
| **頂級網域** | TLD (Top-Level Domain) | `.com`, `.tw`, `.org` | 最高層級，由 ICANN 管理 |
| **二級網域** | SLD (Second-Level Domain) | `example`, `google` | 你購買/註冊的名稱 |
| **子網域** | Subdomain | `www`, `shop`, `api` | 自己設定，免費無限制 |

### 頂級網域 (TLD) 分類

```
┌─────────────────────────────────────────────────────────────┐
│                    頂級網域 (TLD) 分類                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  通用頂級網域 (gTLD)          國家代碼頂級網域 (ccTLD)         │
│  ─────────────────          ──────────────────────          │
│  .com  - 商業組織            .tw  - 台灣                     │
│  .org  - 非營利組織          .jp  - 日本                     │
│  .net  - 網路服務            .cn  - 中國                     │
│  .edu  - 教育機構            .uk  - 英國                     │
│  .gov  - 政府機關            .de  - 德國                     │
│  .info - 資訊網站            .kr  - 韓國                     │
│                                                             │
│  新通用頂級網域 (new gTLD)                                   │
│  ─────────────────────────                                  │
│  .app    - 應用程式          .dev    - 開發者                │
│  .shop   - 購物網站          .blog   - 部落格                │
│  .io     - 科技公司常用      .ai     - AI 相關               │
│  .cloud  - 雲端服務          .tech   - 科技網站              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 特殊二級網域

某些國家有特殊的二級網域結構：

```
台灣 (.tw)
──────────
.com.tw  - 商業組織
.org.tw  - 非營利組織
.gov.tw  - 政府機關
.edu.tw  - 教育機構

英國 (.uk)
──────────
.co.uk   - 商業組織
.org.uk  - 非營利組織
.gov.uk  - 政府機關
```

---

## 3. DNS 運作原理

### 什麼是 DNS？

**DNS**（Domain Name System，網域名稱系統）是網際網路的「電話簿」，將網域名稱轉換成 IP 地址。

### DNS 查詢完整流程

```
用戶在瀏覽器輸入 www.example.com
                    │
                    ▼
            ┌─────────────┐
         1. │  瀏覽器快取  │ ← 檢查瀏覽器是否有快取
            └─────────────┘
                    │ 沒有
                    ▼
            ┌─────────────┐
         2. │ 作業系統快取 │ ← 檢查 OS DNS 快取
            └─────────────┘
                    │ 沒有
                    ▼
            ┌─────────────┐
         3. │  hosts 檔案  │ ← 檢查本機 hosts 設定
            └─────────────┘
                    │ 沒有
                    ▼
            ┌─────────────┐
         4. │  DNS 解析器  │ ← 向 ISP 或公共 DNS 查詢
            │  (Resolver) │   (如 8.8.8.8, 1.1.1.1)
            └─────────────┘
                    │
                    ▼
            ┌─────────────┐
         5. │   根伺服器   │ ← "去問 .com 的伺服器"
            │   (Root)    │   全球 13 組根伺服器
            └─────────────┘
                    │
                    ▼
            ┌─────────────┐
         6. │  TLD 伺服器  │ ← ".com 伺服器說：
            │   (.com)    │    去問 example.com 的 NS"
            └─────────────┘
                    │
                    ▼
         ┌─────────────────┐
      7. │  權威 DNS 伺服器 │ ← "example.com 的 IP 是
         │ (Authoritative) │    93.184.216.34"
         └─────────────────┘
                    │
                    ▼
            返回 IP 給瀏覽器
            瀏覽器建立 TCP 連線
```

### 常見 DNS 記錄類型

| 記錄類型 | 用途 | 範例值 |
|----------|------|--------|
| **A** | 網域指向 IPv4 地址 | `93.184.216.34` |
| **AAAA** | 網域指向 IPv6 地址 | `2606:2800:220:1:248:1893:25c8:1946` |
| **CNAME** | 網域別名（指向另一個網域） | `www.example.com → example.com` |
| **MX** | 郵件伺服器 | `mail.example.com` (優先級 10) |
| **TXT** | 文字記錄（驗證、SPF、DKIM） | `v=spf1 include:_spf.google.com ~all` |
| **NS** | 指定 DNS 伺服器 | `ns1.cloudflare.com` |
| **SOA** | 區域授權起始（Zone 資訊） | 包含主要 NS、管理員郵件等 |
| **CAA** | 授權的 SSL 憑證頒發機構 | `letsencrypt.org` |

### DNS 記錄設定範例

```
; A 記錄 - 網站指向 IP
example.com.        A       93.184.216.34

; CNAME 記錄 - www 指向主網域
www.example.com.    CNAME   example.com.

; MX 記錄 - 郵件伺服器
example.com.        MX      10 mail.example.com.
example.com.        MX      20 mail2.example.com.

; TXT 記錄 - SPF 郵件驗證
example.com.        TXT     "v=spf1 include:_spf.google.com ~all"

; NS 記錄 - DNS 伺服器
example.com.        NS      ns1.cloudflare.com.
example.com.        NS      ns2.cloudflare.com.
```

### 常用公共 DNS

| 提供者 | IPv4 | IPv6 | 特點 |
|--------|------|------|------|
| **Google** | 8.8.8.8, 8.8.4.4 | 2001:4860:4860::8888 | 穩定、快速 |
| **Cloudflare** | 1.1.1.1, 1.0.0.1 | 2606:4700:4700::1111 | 最快、注重隱私 |
| **Quad9** | 9.9.9.9 | 2620:fe::fe | 阻擋惡意網站 |

---

## 4. 網域與 Web 開發

### Next.js 專案的網域設定

#### 圖片來源網域白名單

```javascript
// next.config.js
module.exports = {
  images: {
    // 舊語法（仍支援）
    domains: ['cdn.example.com', 'images.unsplash.com'],

    // 新語法（推薦）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],
  },
}
```

#### 環境變數中的網域

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://www.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CDN_URL=https://cdn.example.com

# 伺服器端使用（不暴露給客戶端）
DATABASE_URL=postgres://user:pass@db.example.com:5432/mydb
REDIS_URL=redis://cache.example.com:6379
```

#### CORS 設定

```typescript
// app/api/data/route.ts
export async function GET(request: Request) {
  const data = { message: 'Hello' }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      // 允許特定網域跨域請求
      'Access-Control-Allow-Origin': 'https://www.example.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

#### Middleware 網域限制

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const allowedDomains = ['example.com', 'www.example.com']
  const hostname = request.headers.get('host') || ''

  if (!allowedDomains.some(domain => hostname.includes(domain))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}
```

---

## 5. 網域購買與管理

### 常見網域註冊商比較

| 註冊商 | 優點 | 缺點 | 適合 |
|--------|------|------|------|
| **Cloudflare** | 成本價、整合 CDN/DNS | 介面較技術 | 開發者 |
| **Namecheap** | 便宜、介面友善、WhoisGuard 免費 | 續約價略高 | 一般用戶 |
| **Google Domains** | 整合 Google 服務、簡潔 | 2023 年賣給 Squarespace | Google 用戶 |
| **GoDaddy** | 市佔率最高、常有促銷 | 續約貴、推銷多 | 企業用戶 |
| **Gandi** | 隱私保護好、透明定價 | 價格較高 | 注重隱私者 |
| **PChome** | 台灣本地、中文支援 | .tw 專門 | 台灣用戶 |

### 網域價格參考

| TLD | 首年價格 | 續約價格 | 備註 |
|-----|----------|----------|------|
| `.com` | $8-12 USD | $12-15 USD | 最通用 |
| `.io` | $30-50 USD | $50-60 USD | 科技公司愛用 |
| `.dev` | $12-15 USD | $12-15 USD | 開發者專用，強制 HTTPS |
| `.app` | $12-15 USD | $12-15 USD | 應用程式，強制 HTTPS |
| `.tw` | ~$20 USD | ~$20 USD | 台灣網域 |
| `.ai` | $70-100 USD | $70-100 USD | AI 相關，較貴 |

### 網域選擇建議

```
┌─────────────────────────────────────────────────────────────┐
│                    網域名稱選擇原則                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ 推薦                          ❌ 避免                   │
│  ──────                          ──────                    │
│  • 簡短好記                       • 太長難記                │
│  • 容易拼寫                       • 容易拼錯                │
│  • 與品牌相關                     • 數字和連字號混用        │
│  • .com 優先                      • 侵犯商標                │
│  • 容易口述                       • 容易與他人混淆          │
│                                                             │
│  範例：                                                     │
│  ✅ stripe.com                   ❌ best-online-shop-2024.com │
│  ✅ notion.so                    ❌ my-app123.io            │
│  ✅ vercel.com                   ❌ xn--abc123.com          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 子網域 vs 子目錄

### 結構比較

```
子網域 (Subdomain)                子目錄 (Subdirectory)
──────────────────                ────────────────────
blog.example.com                  example.com/blog
shop.example.com                  example.com/shop
api.example.com                   example.com/api
docs.example.com                  example.com/docs
```

### 優缺點比較

| 面向 | 子網域 | 子目錄 |
|------|--------|--------|
| **SEO 權重** | 分散（各自獨立） | 集中（共享主網域） |
| **SSL 憑證** | 需萬用字元或各自申請 | 單一憑證即可 |
| **技術棧** | 可完全不同 | 通常需統一 |
| **部署** | 獨立部署 | 通常耦合 |
| **Cookie** | 需設定 domain 共享 | 自動共享 |
| **管理複雜度** | 較高 | 較低 |

### 何時使用子網域？

```
┌─────────────────────────────────────────────────────────────┐
│                    使用子網域的情況                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ 完全不同的應用程式                                       │
│     • 主站: www.example.com (Next.js)                       │
│     • API:  api.example.com (Go/Rust)                       │
│     • 後台: admin.example.com (Vue)                         │
│                                                             │
│  ✅ 需要獨立擴展和部署                                       │
│     • 主站和 API 分開部署和擴展                              │
│                                                             │
│  ✅ CDN 或靜態資源                                          │
│     • cdn.example.com                                       │
│     • static.example.com                                    │
│                                                             │
│  ✅ 多租戶 SaaS                                             │
│     • tenant1.example.com                                   │
│     • tenant2.example.com                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 何時使用子目錄？

```
┌─────────────────────────────────────────────────────────────┐
│                    使用子目錄的情況                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ SEO 是主要考量                                          │
│     • 部落格: example.com/blog                              │
│     • 產品頁: example.com/products                          │
│                                                             │
│  ✅ 內容類型相似，同一個應用                                 │
│     • 所有頁面都用 Next.js                                  │
│                                                             │
│  ✅ 多語言版本                                              │
│     • example.com/zh-TW                                     │
│     • example.com/en                                        │
│     • example.com/ja                                        │
│                                                             │
│  ✅ 簡化管理                                                │
│     • 單一部署、單一 SSL                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### SEO 影響

Google 官方說法：子網域和子目錄在 SEO 上沒有絕對優劣，但實務上：

- **子目錄**：權重集中，連結效益共享
- **子網域**：被視為獨立網站，需各自累積權重

**建議**：除非有技術隔離需求，否則優先使用子目錄。

---

## 7. HTTPS 與 SSL 憑證

### 為什麼需要 HTTPS？

```
HTTP (不安全)                     HTTPS (安全)
─────────────                     ────────────
資料明文傳輸                      資料加密傳輸
可被中間人攻擊                    防止竊聽和篡改
瀏覽器顯示「不安全」              瀏覽器顯示鎖頭圖示
SEO 不利                          SEO 加分
無法使用 HTTP/2                   支援 HTTP/2, HTTP/3
```

### SSL 憑證類型

| 類型 | 全名 | 驗證內容 | 價格 | 適用 |
|------|------|----------|------|------|
| **DV** | Domain Validation | 僅驗證網域所有權 | 免費~$50 | 個人/小型網站 |
| **OV** | Organization Validation | 驗證組織身份 | $50-200 | 企業網站 |
| **EV** | Extended Validation | 嚴格驗證組織 | $100-500 | 金融/電商 |

### 憑證涵蓋範圍

| 類型 | 涵蓋範圍 | 價格 |
|------|----------|------|
| **單網域** | 只有 example.com | 最便宜 |
| **萬用字元** | *.example.com（所有子網域） | 中等 |
| **多網域 (SAN)** | 多個不同網域 | 較貴 |

### 免費 SSL 選項

```
┌─────────────────────────────────────────────────────────────┐
│                      免費 SSL 憑證                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Let's Encrypt                                              │
│  ─────────────                                              │
│  • 最廣泛使用的免費 CA                                       │
│  • 90 天有效期，需自動續約                                   │
│  • 支援萬用字元憑證                                          │
│  • 使用 Certbot 或 ACME 客戶端管理                          │
│                                                             │
│  Cloudflare                                                 │
│  ──────────                                                 │
│  • 使用 Cloudflare 服務即免費提供                           │
│  • 自動管理，無需手動續約                                    │
│  • 支援完整或彈性 SSL 模式                                   │
│                                                             │
│  部署平台自動提供                                            │
│  ────────────────                                           │
│  • Vercel - 部署即自動設定                                  │
│  • Netlify - 部署即自動設定                                 │
│  • AWS Certificate Manager - AWS 服務內免費                 │
│  • Google Cloud - GCP 服務內免費                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Next.js + Vercel 的 SSL

使用 Vercel 部署 Next.js 時，SSL 完全自動：

1. 部署時自動申請 Let's Encrypt 憑證
2. 自動續約，無需任何設定
3. 支援自訂網域，自動設定 SSL
4. 強制 HTTPS（自動重導向）

```bash
# 只需要在 Vercel 設定自訂網域
# DNS 指向 Vercel 後，SSL 自動生效
```

---

## 延伸閱讀

- [Cloudflare Learning - What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Google - 如何選擇網域名稱](https://domains.google/learn/how-to-pick-the-right-domain-name/)
- [Let's Encrypt - Getting Started](https://letsencrypt.org/getting-started/)
- [Vercel - Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

---

*最後更新：2025-11-26*
