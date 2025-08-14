# Vercel 部署注意事項指南

## 📋 部署前檢查清單

### ✅ 必須完成的項目
- [ ] **環境變數設定** - 在 Vercel Dashboard 中配置所有必要變數
- [ ] **資料持久化方案** - 將本地 JSON 檔案遷移至資料庫
- [ ] **圖片資源檢查** - 確保所有圖片都已提交到 Git
- [ ] **構建測試** - 本地執行 `npm run build` 確保無錯誤
- [ ] **API 路由測試** - 確認所有 API 端點正常運作

---

## 🔧 環境變數配置

### 在 Vercel Dashboard 中設定以下環境變數：

#### 必要變數
```bash
# JWT 設定（生產環境務必更換）
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long

# 環境標識
NODE_ENV=production
```

#### 可選變數
```bash
# API 速率限制
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# 安全性配置
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000
```

#### 如果使用 Supabase（未來升級）
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 設定步驟
1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 前往 **Settings** → **Environment Variables**
4. 逐一新增上述變數

---

## ⚠️ 重要：本地檔案儲存問題

### 目前的限制
專案目前使用本地 JSON 檔案儲存資料：
```
src/data/
├── culture.json
├── farm-tour.json  
├── locations.json
├── news.json
├── products.json
├── schedule.json
├── visitor-stats.json  ⚠️ 這會有問題
└── visitors.json       ⚠️ 這會有問題
```

### 問題說明
- **Vercel 是無狀態的** - 每次部署都會重置檔案系統
- **無法寫入檔案** - Serverless Functions 無法永久寫入檔案
- **訪客統計會失效** - `visitors.json` 和 `visitor-stats.json` 無法更新

### 解決方案

#### 方案一：使用 Vercel KV（推薦）
```bash
npm install @vercel/kv
```

修改 `src/lib/file-storage.ts`：
```typescript
import { kv } from '@vercel/kv'

export async function readVisitorStats() {
  return await kv.get('visitor-stats') || defaultStats
}

export async function writeVisitorStats(stats: any) {
  await kv.set('visitor-stats', stats)
}
```

#### 方案二：暫時停用訪客統計
在 `src/components/VisitorTracker.tsx` 中添加環境檢查：
```typescript
if (process.env.NODE_ENV === 'production') {
  // 暫時停用統計功能
  return null
}
```

---

## 🚀 部署步驟

### 1. 準備 Git Repository
```bash
# 確保所有變更都已提交
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Vercel 部署
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 **"New Project"**
4. 選擇您的 GitHub Repository
5. **框架預設**: Next.js (自動偵測)
6. **根目錄**: `.` (保持預設)
7. 點擊 **"Deploy"**

### 3. 設定環境變數
部署完成後：
1. 前往專案 **Settings**
2. 選擇 **Environment Variables**
3. 新增所有必要的環境變數
4. 重新部署專案

---

## 📸 圖片和靜態資源

### 目前狀態
- ✅ 圖片檔案未被 `.gitignore` 忽略
- ✅ 存放在 `public/` 目錄下
- ✅ 使用相對路徑引用

### 優化建議

#### 啟用 Vercel Image Optimization
已在專案中使用 Next.js `Image` 元件，Vercel 會自動優化。

#### 大型圖片處理
如果圖片檔案過大，考慮：
```bash
# 安裝圖片壓縮工具
npm install sharp
```

---

## 🔧 Vercel 設定檔案

目前的 `vercel.json` 配置：
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 🌍 區域部署限制

#### 免費版 (Hobby Plan) 限制
- **單一區域部署** - 通常部署到美國東岸 (iad1)
- **無法選擇區域** - Vercel 自動決定最佳區域
- **延遲較高** - 台灣用戶約 150-200ms 延遲

#### 升級 Pro 版後的好處
```json
{
  "regions": ["hkg1", "sin1", "nrt1"],  // 香港、新加坡、東京
}
```
- **多區域部署** - 就近服務用戶
- **低延遲** - 亞洲用戶約 30-50ms
- **高可用性** - 區域故障自動切換

---

## ⚡ Serverless Functions 注意事項

### 限制
- **執行時間**: 最長 10 秒 (Hobby 方案)
- **記憶體**: 最多 1024MB
- **檔案大小**: 50MB (壓縮後)
- **冷啟動**: 第一次請求可能較慢

### 最佳實踐
```typescript
// API 路由中添加錯誤處理
export async function GET(request: NextRequest) {
  try {
    // 你的邏輯
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

---

## 🐛 常見問題與解決方案

### 問題 1: 環境變數未生效
**症狀**: 本地正常，部署後 API 報錯
**解決**: 
1. 檢查 Vercel Dashboard 中的環境變數拼寫
2. 重新部署專案
3. 查看 Vercel Function Logs

### 問題 2: 檔案寫入失敗
**症狀**: 訪客統計、內容更新失效
**解決**: 
1. 改用 Vercel KV 或資料庫
2. 或暫時停用相關功能

### 問題 3: 圖片載入失敗
**症狀**: 圖片無法顯示
**解決**:
1. 確認圖片檔案已提交到 Git
2. 檢查路徑是否正確 (以 `/` 開頭)
3. 使用 `next/image` 元件

### 問題 4: 構建失敗
**症狀**: Deployment failed
**解決**:
1. 本地執行 `npm run build` 檢查錯誤
2. 修復 TypeScript/ESLint 錯誤
3. 檢查 Node.js 版本相容性

---

## 🔄 部署後測試

### 功能測試清單
- [ ] 首頁載入正常
- [ ] 產品頁面圖片顯示
- [ ] 管理介面登入功能
- [ ] API 端點回應正常
- [ ] 文化典藏頁面運作
- [ ] 購物車功能 (如適用)

### 效能測試
1. 使用 [PageSpeed Insights](https://pagespeed.web.dev/)
2. 檢查 Core Web Vitals
3. 測試不同裝置的載入速度

---

## 🎯 後續升級建議

### 短期 (1週內)
1. **修正檔案儲存問題**
   - 整合 Vercel KV
   - 或暫時停用訪客統計

### 中期 (1個月內)  
1. **升級到 Supabase**
   - 真實資料庫
   - 用戶認證系統
   - 即時資料同步

### 長期 (3個月內)
1. **效能優化**
   - 圖片 CDN
   - 快取策略
   - 監控告警

---

## 📞 支援資源

### 官方文件
- [Vercel 部署指南](https://vercel.com/docs/deployments)
- [Next.js 部署文件](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel KV 文件](https://vercel.com/docs/storage/vercel-kv)

### 監控工具
- [Vercel Analytics](https://vercel.com/analytics)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)

---

## 🎉 完成！

恭喜！按照這個指南，您的豪德茶業網站應該能成功部署到 Vercel。記住：

1. **先部署，再優化** - 不要追求完美，先讓網站上線
2. **監控錯誤** - 定期檢查 Vercel Dashboard 的 Functions 日誌  
3. **逐步升級** - 隨著業務成長，再整合更多功能

祝您部署順利！🚀