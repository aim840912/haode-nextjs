# 豪德農場 Haude Farm 🌱

> 傳承百年農業文化，品味自然好滋味

一個基於 Next.js + Supabase + TypeScript 開發的現代化農場詢價型電商平台，整合產品展示、詢價管理、客戶關係管理與營運分析，結合傳統農業文化與現代網路技術。

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25_Safe-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Latest-38B2AC?style=flat-square&logo=tailwind-css)

## 🌟 專案特色

### 📱 詢價型電商功能
- **產品展示系統** - 精美的農產品目錄與詳細資訊
- **詢價管理系統** - 完整的詢價流程與後台管理
- **客戶關係管理** - 詢價追蹤與客戶互動記錄
- **響應式設計** - 支援桌面、平板、手機等各種裝置

### 🎪 創新的營運模式
- **農場導覽預約** - 四季農場體驗活動管理
- **產品展示管理** - 動態產品資訊與庫存狀態
- **客戶服務系統** - 個人化詢價與服務體驗
- **文化景點導覽** - 在地文化與農業傳承介紹

### 🛠️ 強大的管理後台
- **詢價管理** - 批量操作、快速回覆、工作流程分配
- **產品管理** - 完整的商品資料維護與展示管理
- **客戶關係管理** - 詢價單處理與客戶互動記錄
- **內容管理** - 新聞、文化景點、農場資訊維護
- **審計系統** - 完整的操作記錄與安全監控
- **數據分析** - 營運數據統計與視覺化報表

### 🎨 企業級程式碼品質
- **100% TypeScript 類型安全** - 從 192 個類型錯誤降至 0 個
- **統一錯誤處理系統** - 40 個 API 路由完整覆蓋
- **結構化日誌系統** - 105 個 console.log 已全面遷移
- **現代化權限中間件** - requireAuth/requireAdmin/optionalAuth
- **完整安全配置** - CSP、HTTPS、安全標頭等企業級配置

## 🚀 快速開始

### 系統需求
- Node.js 20.0 或更高版本
- npm 10.0 或更高版本
- Supabase 帳戶（用於後端服務）

### 安裝與啟動

```bash
# 複製專案
git clone <repository-url>
cd haude

# 安裝相依套件
npm install

# 設定環境變數
cp .env.example .env.local
# 編輯 .env.local 填入您的 Supabase 設定

# 啟動開發伺服器（使用 Turbopack）
npm run dev

# 或進行型別檢查
npm run type-check
```

開啟 [http://localhost:3000](http://localhost:3000) 即可查看網站。

### 環境變數設定

在 `.env.local` 檔案中設定以下變數：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANALYZE=false  # 設為 true 啟用 Bundle 分析
```

## 📁 專案結構

```
src/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # 首頁
│   ├── products/          # 產品展示頁面
│   ├── farm-tour/         # 農場導覽頁面
│   ├── culture/           # 文化景點頁面
│   ├── news/              # 新聞資訊頁面
│   ├── inquiries/         # 詢價系統頁面
│   ├── admin/             # 管理後台
│   │   ├── dashboard/     # 儀表板
│   │   ├── products/      # 產品管理
│   │   ├── inquiries/     # 詢價管理
│   │   ├── news/          # 新聞管理
│   │   └── analytics/     # 數據分析
│   ├── api/               # API 路由
│   │   ├── v1/           # 版本化 API
│   │   ├── products/      # 產品 API
│   │   ├── inquiries/     # 詢價 API
│   │   ├── admin/         # 管理 API
│   │   └── upload/        # 檔案上傳 API
│   ├── layout.tsx         # 全域布局
│   └── globals.css        # 全域樣式
├── components/            # 可重用組件
│   ├── Header.tsx         # 共用導航組件
│   ├── ErrorBoundary.tsx  # 錯誤邊界
│   ├── LoadingManager.tsx # 載入狀態管理
│   ├── admin/            # 管理後台元件
│   └── ui/               # UI 基礎組件
├── lib/                   # 核心函式庫
│   ├── logger.ts          # 統一日誌系統
│   ├── error-handler.ts   # 錯誤處理中間件
│   ├── api-response.ts    # 標準化 API 回應
│   ├── supabase.ts        # Supabase 客戶端
│   └── auth-context.tsx   # 認證上下文
├── services/              # 業務邏輯層
│   ├── v2/               # 新版服務架構
│   ├── productService.ts  # 產品服務
│   ├── inquiryService.ts  # 詢價服務
│   └── auditLogService.ts # 審計日誌服務
├── types/                 # TypeScript 型別定義
│   ├── product.ts         # 產品型別
│   ├── inquiry.ts         # 詢價型別
│   └── database.ts        # 資料庫型別
├── contexts/              # React Context
└── hooks/                 # 自定義 React Hooks
```

## 🛠️ 技術架構

### 前端技術
- **[Next.js 15.5.2](https://nextjs.org/)** - React 全端框架，App Router 架構
- **[React 19](https://reactjs.org/)** - 使用最新的 React 功能
- **[TypeScript 5.0+](https://www.typescriptlang.org/)** - 100% 類型安全保障
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS 框架

### 後端服務
- **[Supabase](https://supabase.com/)** - 開源 Firebase 替代方案
  - PostgreSQL 資料庫
  - 即時訂閱功能
  - 檔案儲存服務
  - 行級別安全性 (RLS)
- **Next.js API Routes** - 伺服器端 API 端點

### 核心技術成就
- **100% TypeScript 類型安全** - 完整的類型系統覆蓋
- **統一錯誤處理** - 40+ API 路由標準化錯誤處理
- **結構化日誌系統** - apiLogger, dbLogger, cacheLogger
- **現代化權限系統** - JWT + Supabase Auth 整合
- **企業級安全防護** - CSRF 保護、Rate Limiting、CSP 政策

### 開發工具
- **ESLint** - 程式碼品質檢查與風格統一
- **Prettier** - 程式碼格式化
- **Turbopack** - 高速開發伺服器
- **Husky** - Git hooks 自動化

## 📄 頁面功能

### 🏠 首頁 (`/`)
- 品牌故事與價值主張展示
- 農場特色三大亮點介紹
- 精選農產品預覽
- 農場導覽活動預告
- 聯絡資訊與交通指引

### 🛒 產品展示 (`/products`)
- 農產品網格展示與分類
- 詳細產品資訊頁面
- 產品圖片展示
- 庫存狀態顯示
- 詢價按鈕整合

### 🌱 農場導覽 (`/farm-tour`)
- 四季體驗活動介紹
- 農場設施與特色展示
- 線上預約詢價系統
- 參觀資訊與注意事項
- 聯絡方式與地圖資訊

### 🏛️ 文化景點 (`/culture`)
- 在地文化景點介紹
- 歷史故事與農業傳承
- 參訪建議與路線規劃
- 圖片展示與詳細介紹

### 📰 新聞資訊 (`/news`)
- 農場最新動態發布
- 季節性農產品資訊
- 活動公告與報導
- 農業知識分享

### 💬 詢價系統 (`/inquiries`)
- 線上詢價表單提交
- 客製化需求表達
- 詢價進度即時追蹤
- 歷史詢價記錄查詢

### 🛠️ 管理後台 (`/admin`)
- **儀表板** - 營運數據總覽與關鍵指標監控
- **產品管理** - 商品資料維護、展示設定、圖片管理
- **詢價管理** - 客戶詢價處理、狀態更新、批量操作
- **客戶管理** - 客戶資料維護、互動記錄追蹤
- **內容管理** - 新聞發布、文化景點維護、網站內容更新
- **數據分析** - 營運報表、訪客統計、詢價轉換分析
- **系統監控** - 效能監控、錯誤追蹤、審計日誌

## 🎨 設計系統

### 色彩配置
```css
/* 主要色彩 - 農業主題 */
--amber-50: #fffbeb    /* 背景淺色 */
--amber-100: #fef3c7   /* 卡片背景 */
--amber-900: #92400e   /* 主要文字 */
--green-600: #16a34a   /* 操作按鈕 */
--orange-50: #fff7ed   /* 輔助背景 */
```

### 字體設定
- **中文內容** - 系統預設字體優化
- **品牌標題** - serif-display 字體系列
- **響應式字體** - 根據裝置螢幕大小自動調整

### 視覺特色
- **Utility-First CSS** - Tailwind 快速開發方法
- **響應式設計** - Mobile-first 設計原則
- **平滑動畫** - Framer Motion 動畫效果
- **圖片最佳化** - Next.js Image 組件優化

## 🚀 部署指南

### Vercel 部署 (推薦)
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署到 Vercel
vercel

# 設定環境變數
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 其他平台部署
```bash
# 建置生產版本
npm run build

# 啟動生產伺服器
npm run start
```

### Docker 部署
```bash
# 建置 Docker 映像
docker build -t haude-farm .

# 執行容器
docker run -p 3000:3000 haude-farm
```

### 生產環境檢查清單
- [ ] 設定正確的 Supabase 環境變數
- [ ] 配置適當的 CORS 政策
- [ ] 檢查 RLS 政策設定
- [ ] 測試圖片上傳功能
- [ ] 驗證 API 端點正常運作
- [ ] 確認錯誤處理正常工作

## 📈 專案發展與改進

### 📚 相關文檔
- **[專案改進機會文件](./PROJECT_IMPROVEMENT_OPPORTUNITIES.md)** - 完整的改進建議與實施計畫
- **[開發指南](./CLAUDE.md)** - 開發流程、程式碼標準與最佳實踐

### 🚀 已完成功能
- ✅ **完整的詢價型電商平台** - 產品展示、詢價管理、客戶關係管理
- ✅ **企業級管理後台** - 內容管理、客戶管理、數據分析
- ✅ **100% TypeScript 類型安全** - 完整的類型系統重構
- ✅ **統一日誌與錯誤處理** - 結構化日誌管理與監控
- ✅ **現代化權限系統** - JWT 整合與 RLS 安全控制
- ✅ **效能優化系統** - 快取策略與 Bundle 優化

### 🔄 持續改進計畫
- **使用者體驗優化** - 載入效能提升、互動體驗改善
- **SEO 與行銷強化** - 結構化資料、動態網站地圖
- **監控與分析** - 整合進階分析工具、效能指標追蹤
- **功能擴展** - 進階搜尋、個人化推薦、通知系統

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request 來改進這個專案！

### 開發流程
1. Fork 這個專案
2. 創建特性分支 (`git checkout -b feature/amazing-feature`)
3. 遵循程式碼標準（使用 Logger 系統，不使用 console.log）
4. 執行類型檢查 (`npm run type-check`)
5. 執行程式碼檢查 (`npm run lint`)
6. 提交變更 (`npm run commit`)
7. 推送分支 (`git push origin feature/amazing-feature`)
8. 開啟 Pull Request

### 開發標準
- 使用專案的 Logger 系統而非 console.log
- 遵循 TypeScript 嚴格模式
- 保持程式碼整潔與可讀性
- 為新功能添加適當的型別定義
- 確保所有 API 端點都有適當的錯誤處理

### 提交訊息格式
```
feat: 新增功能
fix: 修復問題
docs: 文檔更新
style: 程式碼格式調整
refactor: 重構程式碼
chore: 建置或輔助工具變動
```

## 📝 授權條款

此專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案以獲得詳細資訊。

## 📞 聯絡資訊

- **專案維護** - 豪德農場開發團隊
- **技術支援** - 建立 Issue 回報問題
- **專案倉庫** - GitHub Repository

---

> 🌱 **傳承百年農業文化，擁抱現代科技創新**
>
> Haude Farm - 讓傳統與現代完美融合

## 🔄 更新日誌

### v2.1.0 (2025-09-07)
- ✨ **技術債務清理完成** - 100% TypeScript 類型安全達成
- ✨ **日誌系統統一化** - 105 個 console.log 完全遷移
- ✨ **API 錯誤處理標準化** - 40+ API 路由統一錯誤處理
- ✨ **權限中間件現代化** - requireAuth/requireAdmin 系統重構
- 🔧 **架構健康度提升** - 專案評分達到 A- (85/100)
- 🔧 **開發體驗改善** - 完整的類型提示與錯誤檢查

### v2.0.0 (2024-08-30)
- ✨ **重大更新** - 從展示網站進化為完整詢價型電商平台
- ✨ **新增管理後台** - 完整的詢價管理系統與數據分析
- ✨ **客戶關係管理** - 詢價流程優化與客戶互動追蹤
- ✨ **統一日誌系統** - 結構化日誌管理與監控
- ✨ **審計追蹤** - 完整的操作記錄與安全監控
- 🔧 **架構重構** - 服務層分離、型別安全強化
- 🔧 **安全強化** - CSRF 保護、Rate Limiting、RLS 權限控制
- 🎨 **UI/UX 改進** - 載入狀態、錯誤處理、響應式優化

### v1.0.0 (2024-08-07)
- ✨ 完成基礎網站架構
- ✨ 實現產品展示功能
- ✨ 推出農場導覽體驗
- ✨ 建立共用 Header 組件
- 🎨 優化響應式設計
- 📱 改善行動裝置體驗# CI/CD 驗證

Sun Sep 14 17:53:44 CST 2025 - 觸發 GitHub Actions 驗證環境變數修復
