# 🚀 Vercel 免費版快速部署指南

專為 Vercel 免費版用戶設計的快速設定指南。5 分鐘內完成部署！

## ⚡ 快速步驟

### 1. 生成安全密鑰
在本地終端執行：
```bash
npm run generate:keys
```
複製顯示的 JWT_SECRET 和 ADMIN_API_KEY。

### 2. 部署到 Vercel
1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "New Project" → 選擇您的 GitHub 儲存庫
3. Framework 選擇 "Next.js" → 點擊 "Deploy"

### 3. 設定環境變數
在 Vercel Dashboard → Settings → Environment Variables 添加：

#### 必須設定 (4 個變數)：
```bash
# 從 Supabase Dashboard → Settings → API 複製
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# 使用 npm run generate:keys 生成的密鑰
JWT_SECRET=[生成的密鑰]
ADMIN_API_KEY=[生成的密鑰]
```

#### CSRF 保護設定：
```bash
# 🌟 通常不需要設定！
# 系統會自動使用 your-project.vercel.app

# 如果需要明確設定：
# CSRF_ALLOWED_ORIGINS=https://your-project.vercel.app
```

### 4. 重新部署
設定環境變數後，在 Vercel Dashboard → Deployments → 點擊最新部署旁的三點選單 → "Redeploy"

## ✅ 驗證部署成功

訪問以下 URL 測試：
- `https://[your-project].vercel.app/` - 主頁
- `https://[your-project].vercel.app/api/csrf-token` - CSRF token
- `https://[your-project].vercel.app/api/products` - 產品 API

## 🎯 您的答案：CSRF_ALLOWED_ORIGINS 設定

**推薦做法：不設定 CSRF_ALLOWED_ORIGINS** ✅

系統會自動：
- 使用 `VERCEL_URL` (Vercel 自動設定)
- 支援主域名：`https://[專案名].vercel.app`
- 支援預覽域名：`https://[專案名]-[分支]-[用戶名].vercel.app`

**如果您想明確控制：**
```bash
CSRF_ALLOWED_ORIGINS=https://your-project-name.vercel.app
```

## 🆘 常見問題

### Q: 我的專案名稱是什麼？
A: 就是您 GitHub 儲存庫的名稱，或在 Vercel 部署時設定的名稱。

### Q: 如何知道我的 Vercel URL？
A: 部署完成後，在 Vercel Dashboard → Domains 查看。

### Q: CSRF 錯誤怎麼辦？
A: 移除 `CSRF_ALLOWED_ORIGINS` 環境變數，讓系統自動處理。

### Q: 管理員功能無法使用？
A: 確認已設定 `ADMIN_API_KEY` 且至少 32 字元。

## 📞 需要詳細說明？
查看完整指南：`docs/VERCEL_DEPLOYMENT.md`

---
**設定完成！您的專案現在有完整的 CSRF 保護和安全功能** 🔒