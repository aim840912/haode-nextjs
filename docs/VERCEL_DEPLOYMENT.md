# Vercel 部署指南

本指南將協助您將專案部署到 Vercel 免費版，並正確設定所有必要的環境變數，確保 CSRF 保護和其他安全功能正常運作。

## 🚀 部署步驟

### 1. 準備工作

確保您的專案已經推送到 GitHub/GitLab/Bitbucket。

### 2. 連接到 Vercel

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "New Project"
3. 選擇您的 Git 儲存庫
4. 選擇 "Framework Preset": **Next.js**
5. 點擊 "Deploy"

### 3. 獲取域名資訊

部署完成後，Vercel 會提供：
- **主域名**: `https://[專案名稱].vercel.app`
- **預覽域名**: `https://[專案名稱]-[分支]-[用戶名].vercel.app`

## 🔧 環境變數設定

### 必要環境變數

在 Vercel Dashboard → Settings → Environment Variables 中設定：

#### 1. Supabase 配置
```bash
# 從 Supabase Dashboard → Settings → API 獲取
NEXT_PUBLIC_SUPABASE_URL=https://[您的專案ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[您的 anon key]
SUPABASE_SERVICE_ROLE_KEY=[您的 service_role key]
```

**如何獲取 Supabase 金鑰**：
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 前往 Settings → API
4. 複製相應的金鑰

#### 2. 安全密鑰（必須生成）
```bash
# 使用以下指令生成 32 字元以上的安全密鑰
# openssl rand -base64 32

JWT_SECRET=[生成的 JWT 密鑰]
ADMIN_API_KEY=[生成的 Admin API 密鑰]
```

**生成方法**：
```bash
# 在本地終端執行
openssl rand -base64 32
```
每次執行會產生不同的隨機密鑰，請為 JWT_SECRET 和 ADMIN_API_KEY 分別生成。

### 可選環境變數

#### 3. CSRF 保護設定

**選項 A：自動配置（推薦）** ✅
```bash
# 不需要設定 CSRF_ALLOWED_ORIGINS
# 系統會自動使用 Vercel 提供的 VERCEL_URL
```

**選項 B：手動設定**
```bash
# 如果您想明確控制允許的來源
CSRF_ALLOWED_ORIGINS=https://[您的專案名].vercel.app
```

#### 4. 自訂域名（如果有）
```bash
# 如果您配置了自訂域名
NEXTAUTH_URL=https://您的自訂域名.com
```

#### 5. 其他可選服務
```bash
# Redis (如果使用)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# 支付服務 (如果需要)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Google Analytics (如果需要)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 📋 設定檢查清單

### 部署前檢查
- [ ] 程式碼已推送到 Git 儲存庫
- [ ] Supabase 專案已創建並配置完成
- [ ] 已生成 JWT_SECRET 和 ADMIN_API_KEY

### Vercel 設定檢查
- [ ] 專案已成功部署到 Vercel
- [ ] 已在 Environment Variables 中設定所有必要環境變數
- [ ] 已為 Production、Preview、Development 環境分別設定變數

### 功能測試檢查
- [ ] 網站可以正常載入
- [ ] CSRF token 可以正常獲取 (`/api/csrf-token`)
- [ ] Supabase 連接正常
- [ ] 管理員功能需要正確的 ADMIN_API_KEY
- [ ] 安全標頭正常設定

## 🔐 環境變數安全最佳實踐

### 1. 環境分離
- **Production**: 正式環境的實際金鑰
- **Preview**: 可以使用相同或測試用的金鑰  
- **Development**: 本地開發用的金鑰

### 2. 金鑰管理
- ✅ 使用強隨機密鑰（至少 32 字元）
- ✅ 定期輪換密鑰
- ❌ 不要在程式碼中硬編碼密鑰
- ❌ 不要在 public 儲存庫中暴露密鑰

### 3. Supabase RLS
確保 Supabase 中的 Row Level Security (RLS) 已正確配置：
```sql
-- 檢查 RLS 是否啟用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🚨 常見問題排除

### 問題 1: CSRF token 驗證失敗
**原因**: `CSRF_ALLOWED_ORIGINS` 設定錯誤或 Vercel URL 不匹配

**解決方法**:
1. 檢查 Vercel Dashboard 中的實際域名
2. 確保 `CSRF_ALLOWED_ORIGINS` 包含正確的域名
3. 或者移除 `CSRF_ALLOWED_ORIGINS` 讓系統自動偵測

### 問題 2: Supabase 連接失敗
**原因**: 環境變數設定錯誤

**解決方法**:
1. 確認 `NEXT_PUBLIC_SUPABASE_URL` 格式正確
2. 檢查 Supabase 專案是否處於暫停狀態
3. 驗證 API 金鑰是否正確

### 問題 3: 管理員功能無法使用
**原因**: `ADMIN_API_KEY` 未設定或格式錯誤

**解決方法**:
1. 確認已在 Vercel 中設定 `ADMIN_API_KEY`
2. 確保密鑰至少 32 字元
3. 檢查前端是否正確傳遞 `X-Admin-Key` 標頭

### 問題 4: 預覽部署 CSRF 錯誤
**原因**: 預覽 URL 未包含在允許清單中

**解決方法**:
移除 `CSRF_ALLOWED_ORIGINS` 環境變數，讓系統自動處理所有 Vercel 域名。

## 📊 監控和維護

### 1. 檢查部署狀態
- Vercel Dashboard → Deployments
- 查看構建日誌和錯誤訊息

### 2. 監控安全事件
- 檢查 Supabase Dashboard → Logs
- 監控異常的 API 調用

### 3. 定期維護
- 每季度輪換安全密鑰
- 檢查和更新依賴套件
- 審查 Supabase RLS 政策

## 🆘 需要幫助？

如果遇到問題：

1. **檢查 Vercel 函數日誌**:
   - Vercel Dashboard → Functions → View Function Logs

2. **檢查瀏覽器控制台**:
   - F12 → Console → 查看 CSRF 或 API 錯誤

3. **測試 API 端點**:
   ```bash
   # 測試 CSRF token 生成
   curl https://[您的域名].vercel.app/api/csrf-token
   
   # 測試 Supabase 連接
   curl https://[您的域名].vercel.app/api/products
   ```

---

**最後更新**: 2025-08-25  
**Vercel 版本**: Platform Version 2  
**Next.js 版本**: 15.4.6