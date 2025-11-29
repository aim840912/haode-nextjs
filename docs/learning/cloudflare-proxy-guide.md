# Cloudflare Proxy 完整指南

## 目錄

- [什麼是 Proxy](#什麼是-proxy)
- [Cloudflare Proxy 運作原理](#cloudflare-proxy-運作原理)
- [Proxy 開啟 vs 關閉](#proxy-開啟-vs-關閉)
- [Proxy 提供的功能](#proxy-提供的功能)
- [何時應該開啟 Proxy](#何時應該開啟-proxy)
- [何時應該關閉 Proxy](#何時應該關閉-proxy)
- [與 Vercel 搭配使用](#與-vercel-搭配使用)
- [常見問題](#常見問題)

---

## 什麼是 Proxy

### 基本概念

**Proxy（代理）** 是一個位於用戶和目標伺服器之間的中間層，所有的網路請求都會先經過這個中間層處理，然後再轉發到目標伺服器。

### 生活化比喻

把 Proxy 想像成一個「保鏢」或「接待員」：

- **沒有保鏢**：訪客直接走進你家
- **有保鏢**：訪客先經過保鏢檢查，確認安全後才能進入

```
沒有 Proxy：
┌────────┐                    ┌────────────┐
│  用戶  │ ──────────────────→│  你的網站  │
└────────┘      直接連線       └────────────┘

有 Proxy：
┌────────┐     ┌─────────────┐     ┌────────────┐
│  用戶  │ ───→│  Cloudflare │ ───→│  你的網站  │
└────────┘     │   (Proxy)   │     └────────────┘
               └─────────────┘
                 檢查、過濾
                 快取、加速
```

---

## Cloudflare Proxy 運作原理

### DNS 層級的運作

當用戶訪問你的網站時：

#### Proxy 關閉（灰色雲朵）

1. 用戶瀏覽器查詢 `chronostorysearch.com` 的 IP
2. Cloudflare DNS 回傳**你網站的真實 IP**（Vercel 的 IP）
3. 用戶瀏覽器直接連接到 Vercel

```
DNS 查詢結果：chronostorysearch.com → 76.76.21.21 (Vercel IP)
```

#### Proxy 開啟（橘色雲朵）

1. 用戶瀏覽器查詢 `chronostorysearch.com` 的 IP
2. Cloudflare DNS 回傳 **Cloudflare 的 IP**（不是你的真實 IP）
3. 用戶瀏覽器連接到 Cloudflare
4. Cloudflare 處理請求後，再轉發到你的網站

```
DNS 查詢結果：chronostorysearch.com → 104.21.xx.xx (Cloudflare IP)
```

### 在 Cloudflare 介面中的識別

| 圖示 | 名稱 | 狀態 | 意義 |
|------|------|------|------|
| 🟠 橘色雲朵 | Proxied | 開啟 | 流量經過 Cloudflare |
| ⚪ 灰色雲朵 | DNS only | 關閉 | 僅 DNS 解析，直連源站 |

---

## Proxy 開啟 vs 關閉

### 完整比較表

| 項目 | Proxy 開啟 (橘色) | Proxy 關閉 (灰色) |
|------|-------------------|-------------------|
| **流量路徑** | 用戶 → Cloudflare → 源站 | 用戶 → 源站 |
| **真實 IP** | 隱藏 | 暴露 |
| **DDoS 防護** | 有 | 無 |
| **WAF 防火牆** | 有 | 無 |
| **快取加速** | 有 | 無 |
| **SSL 處理** | Cloudflare 處理 | 源站處理 |
| **Bot 管理** | 有 | 無 |
| **設定複雜度** | 較複雜 | 簡單 |
| **延遲** | 可能增加（多一跳） | 較低 |
| **相容性** | 可能有衝突 | 最佳相容 |

### 視覺化比較

```
Proxy 關閉（DNS Only）：
┌──────┐                              ┌──────────┐
│ 用戶 │ ─────────────────────────────│  Vercel  │
└──────┘         直接 HTTPS           └──────────┘
                 (Vercel SSL)

Proxy 開啟（Proxied）：
┌──────┐         ┌────────────┐         ┌──────────┐
│ 用戶 │ ────────│ Cloudflare │─────────│  Vercel  │
└──────┘  HTTPS  └────────────┘  HTTPS  └──────────┘
       (CF SSL)                (Origin SSL)
```

---

## Proxy 提供的功能

### 1. 安全防護

#### DDoS 防護
- 自動偵測和阻擋分散式阻斷服務攻擊
- 無需設定，開啟 Proxy 即生效
- 免費方案包含基本 DDoS 防護

#### WAF（Web Application Firewall）
- 阻擋 SQL Injection 攻擊
- 阻擋 XSS（跨站腳本）攻擊
- 阻擋常見的 Web 漏洞利用
- 可自訂安全規則

#### Bot 管理
- 識別惡意機器人
- 阻擋爬蟲和自動化攻擊
- 驗證碼挑戰（Turnstile）

### 2. 效能優化

#### 快取靜態資源
```
快取的檔案類型：
- 圖片：.jpg, .png, .gif, .webp, .svg
- 樣式：.css
- 腳本：.js
- 字型：.woff, .woff2, .ttf
```

#### CDN 加速
- 全球 300+ 個資料中心
- 自動選擇最近的節點
- 減少載入時間

#### 壓縮優化
- 自動 Gzip/Brotli 壓縮
- 圖片最佳化（Pro 方案以上）

### 3. 隱私保護

#### 隱藏源站 IP
```
用戶看到的 IP：104.21.xx.xx (Cloudflare)
真實 IP：76.76.21.21 (Vercel) ← 被隱藏
```

這可以防止：
- 直接對源站發動攻擊
- 繞過 Cloudflare 的防護

### 4. SSL/TLS 管理

#### SSL 模式選項

| 模式 | 說明 | 安全性 |
|------|------|--------|
| Off | 不加密 | 極低 |
| Flexible | 用戶↔CF 加密，CF↔源站 不加密 | 低 |
| Full | 兩段都加密，但不驗證源站憑證 | 中 |
| Full (Strict) | 兩段加密 + 驗證源站憑證 | 高（推薦） |

---

## 何時應該開啟 Proxy

### 適合開啟的場景

| 場景 | 說明 |
|------|------|
| **被 DDoS 攻擊** | 需要 Cloudflare 的攻擊防護 |
| **敏感應用** | 金融、醫療、電商等需要額外安全 |
| **高流量網站** | 利用快取減輕源站負擔 |
| **需要隱藏 IP** | 不希望暴露伺服器真實位置 |
| **全球用戶** | 利用 CDN 加速全球訪問 |
| **需要 WAF 規則** | 自訂安全規則阻擋特定攻擊 |

### 開啟 Proxy 的檢查清單

- [ ] 確認 SSL 模式設為 `Full (Strict)`
- [ ] 確認源站有有效的 SSL 憑證
- [ ] 測試網站功能是否正常
- [ ] 檢查是否有重定向迴圈
- [ ] 確認 WebSocket 等功能正常（如有使用）

---

## 何時應該關閉 Proxy

### 適合關閉的場景

| 場景 | 說明 |
|------|------|
| **部署在 Vercel/Netlify** | 這些平台已有 CDN 和基本防護 |
| **需要最低延遲** | 減少一跳網路跳轉 |
| **避免設定複雜度** | 簡單直接的 DNS 指向 |
| **WebSocket 應用** | 某些情況下 Proxy 會影響 WS |
| **串流/大檔案** | 避免 Cloudflare 的處理開銷 |
| **開發/測試環境** | 簡化除錯過程 |

### 你的楓之谷搜尋網站

**建議：關閉 Proxy**

原因：
1. Vercel 已提供 CDN 和 DDoS 防護
2. 雙重 CDN 可能造成問題
3. 設定更簡單
4. 流量規模不需要額外防護

---

## 與 Vercel 搭配使用

### 推薦設定：關閉 Proxy

```
Cloudflare DNS 設定：
類型: CNAME
名稱: @ 或 www
目標: cname.vercel-dns.com
Proxy: 關閉（灰色雲朵）
```

### 如果要開啟 Proxy

必須進行以下設定以避免衝突：

#### 1. SSL 模式設為 Full (Strict)

```
Cloudflare Dashboard → SSL/TLS → Overview
選擇：Full (Strict)
```

#### 2. 關閉 Cloudflare 的自動 HTTPS 重寫

```
Cloudflare Dashboard → SSL/TLS → Edge Certificates
關閉：Always Use HTTPS（讓 Vercel 處理）
```

#### 3. 設定 Page Rules（可選）

```
如果特定路徑需要繞過快取：
URL: chronostorysearch.com/api/*
設定: Cache Level = Bypass
```

### 雙重 CDN 的問題

```
開啟 Cloudflare Proxy + Vercel：

用戶 → Cloudflare CDN → Vercel CDN → Vercel 源站
          ↑                ↑
        快取層 1         快取層 2

可能的問題：
1. 快取不一致
2. 延遲增加
3. 除錯困難
4. SSL 設定衝突
```

---

## 常見問題

### Q1: 開啟 Proxy 後網站顯示錯誤怎麼辦？

**常見原因和解決方案：**

| 錯誤 | 原因 | 解決方案 |
|------|------|----------|
| 525 SSL handshake failed | 源站 SSL 問題 | 確認源站有有效 SSL |
| 522 Connection timed out | 源站無回應 | 檢查源站是否正常運行 |
| 521 Web server is down | 源站拒絕連線 | 確認 Cloudflare IP 未被阻擋 |
| 重定向迴圈 | SSL 模式錯誤 | 設為 Full (Strict) |

### Q2: Proxy 會增加延遲嗎？

**視情況而定：**

- 如果用戶靠近 Cloudflare 節點且有快取 → 延遲**減少**
- 如果沒有快取且多了一跳 → 延遲**增加** 5-50ms
- 對大多數應用影響不大

### Q3: 免費方案的 Proxy 功能有限制嗎？

**免費方案包含：**
- 基本 DDoS 防護
- 共享 SSL 憑證
- CDN 和快取
- 基本防火牆規則（5 條）

**需要付費的功能：**
- 進階 DDoS 防護
- WAF 受管規則
- 自訂 SSL 憑證
- 更多防火牆規則

### Q4: 如何檢查 Proxy 是否生效？

**方法 1：DNS 查詢**
```bash
nslookup chronostorysearch.com

# Proxy 開啟：會顯示 Cloudflare IP (104.21.x.x 或 172.67.x.x)
# Proxy 關閉：會顯示源站 IP (76.76.21.21 for Vercel)
```

**方法 2：HTTP Header 檢查**
```bash
curl -I https://chronostorysearch.com

# Proxy 開啟會有這些 Header：
# cf-ray: xxxxxxx
# cf-cache-status: HIT/MISS/DYNAMIC
# server: cloudflare
```

### Q5: 開啟 Proxy 會影響 SEO 嗎？

**不會負面影響，可能有正面影響：**

- 網站速度提升 → SEO 加分
- SSL 安全 → SEO 加分
- 正常運作時 Google 無法區分是否有 Proxy

---

## 總結

### 決策流程圖

```
開始
  │
  ▼
你的網站是否部署在已有 CDN 的平台？
（如 Vercel、Netlify、AWS CloudFront）
  │
  ├─ 是 → 建議關閉 Proxy（避免雙重 CDN）
  │
  └─ 否 → 你是否需要 DDoS 防護或 WAF？
           │
           ├─ 是 → 開啟 Proxy
           │
           └─ 否 → 關閉 Proxy（簡單最好）
```

### 針對你的網站

| 項目 | 建議 |
|------|------|
| 網站 | chronostorysearch.com |
| 平台 | Vercel |
| Proxy 設定 | **關閉**（灰色雲朵） |
| 原因 | Vercel 已有 CDN，雙重代理無益 |

---

## 參考資源

- [Cloudflare Proxy 官方文件](https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/)
- [Cloudflare SSL 模式說明](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)
- [Vercel 自訂網域設定](https://vercel.com/docs/projects/domains)

---

*最後更新：2025-11-26*
