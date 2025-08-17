# Vercel 部署環境變數設定指南

## 概述

這個專案使用混合資料策略，可以根據環境自動選擇使用 JSON 檔案或 Supabase 作為資料來源。

## 環境變數設定

### 在 Vercel Dashboard 設定

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇你的專案
3. 進入 "Settings" → "Environment Variables"
4. 根據下面的場景設定環境變數

## 不同場景的設定

### 場景 1：純 JSON 模式（推薦用於初期測試）

適用於：剛開始部署，想先測試基本功能

```bash
# 基本設定
NODE_ENV=production

# 關閉 Supabase
USE_SUPABASE=false

# 其他選用
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**優點**：
- 部署簡單，不需要設定資料庫
- 完全免費
- 載入速度快

**限制**：
- 無法新增/修改產品
- 沒有用戶系統
- 無法處理訂單

### 場景 2：混合模式（推薦用於開發測試）

適用於：想要測試完整功能，但節省 Supabase 流量

```bash
# 基本設定
NODE_ENV=production
USE_SUPABASE=true

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel KV (選用，用於快取)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX2ASQaxxx...
```

**特色**：
- 產品資料使用 JSON（節省流量）
- 訂單、用戶使用 Supabase（完整功能）
- 智慧 fallback 機制

### 場景 3：完全 Supabase 模式（生產環境）

適用於：正式上線，需要完整的動態功能

```bash
# 基本設定
NODE_ENV=production
USE_SUPABASE=true

# Supabase 完整配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 快取層（推薦）
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX2ASQaxxx...

# 付款系統
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# 分析工具
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 環境變數說明

### 必要變數

| 變數名 | 說明 | 範例 |
|--------|------|------|
| `NODE_ENV` | 運行環境 | `production` |
| `USE_SUPABASE` | 是否啟用 Supabase | `true` 或 `false` |

### Supabase 相關（當 USE_SUPABASE=true 時必要）

| 變數名 | 說明 | 來源 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名金鑰 | Supabase Dashboard > Settings > API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | 服務角色金鑰 | Supabase Dashboard > Settings > API Keys |

### 選用變數

| 變數名 | 說明 | 用途 |
|--------|------|------|
| `UPSTASH_REDIS_REST_URL` | Redis 快取 URL | 提升效能 |
| `UPSTASH_REDIS_REST_TOKEN` | Redis 金鑰 | 提升效能 |
| `STRIPE_SECRET_KEY` | Stripe 私鑰 | 付款功能 |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 公鑰 | 付款功能 |
| `GOOGLE_ANALYTICS_ID` | GA 追蹤 ID | 網站分析 |

## 部署流程

### 首次部署

1. **選擇場景**：建議從場景 1 開始
2. **設定環境變數**：在 Vercel Dashboard 設定
3. **部署**：推送代碼或手動部署
4. **測試**：訪問網站確認功能正常

### 升級流程

```bash
場景 1 (純 JSON) → 場景 2 (混合) → 場景 3 (完全 Supabase)
```

每次升級：
1. 更新環境變數
2. 重新部署
3. 測試新功能

## 故障排除

### 常見錯誤

1. **"Missing environment variables"**
   - 檢查 Supabase 環境變數是否設定正確
   - 確認變數名稱沒有拼寫錯誤

2. **"Could not find table"**
   - 檢查 Supabase 資料庫是否已執行初始化 SQL
   - 確認表格 RLS 政策設定正確

3. **頁面載入緩慢**
   - 考慮啟用 Vercel KV 快取
   - 檢查 Supabase 查詢效能

### 檢查工具

部署後可以使用這些工具檢查狀態：

- **健康檢查**：`https://your-site.vercel.app/api/test-supabase`
- **策略資訊**：查看開發者工具控制台
- **Vercel 日誌**：Vercel Dashboard > Functions

## 最佳實踐

1. **漸進式部署**：從簡單場景開始，逐步升級
2. **環境隔離**：Production 和 Preview 使用不同的 Supabase 專案
3. **監控**：設定 Vercel Analytics 和 Supabase 監控
4. **備份**：定期備份 Supabase 資料

## 成本優化

- **開發階段**：使用 `USE_SUPABASE=false`
- **測試階段**：使用混合模式
- **生產階段**：啟用快取減少資料庫請求