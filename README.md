# 豪德農場 Haude Farm 🌱

> 傳承百年農業文化，品味自然好滋味

一個基於 Next.js + Supabase + TypeScript 開發的現代化農場管理平台，整合電商功能、內容管理、客戶關係管理與營運分析，結合傳統農業文化與現代網路技術。

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.55.0-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## 🌟 專案特色

### 📱 完整的電商功能
- **產品展示系統** - 精美的產品目錄與詳細資訊
- **購物車功能** - 完整的購物體驗與訂單管理
- **詢價系統** - 客製化詢價與報價流程
- **響應式設計** - 支援桌面、平板、手機等各種裝置

### 🎪 創新的營運模式
- **擺攤行程管理** - 動態顯示各地市集與夜市行程
- **觀光果園體驗** - 四季農場導覽與體驗活動預約
- **門市據點資訊** - 完整的實體店面資訊
- **文化景點導覽** - 在地文化與農業傳承介紹

### 🛠️ 強大的管理後台
- **產品管理** - 完整的商品資料維護與庫存管理
- **訂單管理** - 訂單處理與物流追蹤
- **客戶關係管理** - 詢價單處理與客戶互動記錄
- **內容管理** - 新聞、文化景點、行程資訊維護
- **審計系統** - 完整的操作記錄與安全監控
- **數據分析** - 營運數據統計與視覺化報表

### 🎨 優雅的視覺設計
- **品牌色系** - 以琥珀色為主調，展現傳統農業質感
- **文化元素** - 融入農業文化與在地特色概念
- **現代體驗** - 流暢的動畫效果與互動設計
- **圖片管理** - 整合 Supabase Storage 的圖片上傳與管理

## 🚀 快速開始

### 系統需求
- Node.js 20.0 或更高版本
- npm 10.0 或更高版本
- Supabase 帳戶（用於後端服務）

### 安裝與啟動

```bash
# 複製專案
git clone https://github.com/aim840912/haode-nextjs.git
cd haode-nextjs

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

# Google Analytics (選填)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 📁 專案結構

```
src/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # 首頁
│   ├── products/          # 產品展示頁面
│   ├── schedule/          # 擺攤行程頁面
│   ├── farm-tour/         # 觀光果園頁面
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
│   │   ├── products/      # 產品 API
│   │   ├── inquiries/     # 詢價 API
│   │   ├── admin/         # 管理 API
│   │   └── upload/        # 檔案上傳 API
│   ├── layout.tsx         # 全域布局
│   └── globals.css        # 全域樣式
├── components/            # 可重用組件
│   ├── Header.tsx         # 共用導航組件
│   ├── ErrorBoundary.tsx  # 錯誤邊界
│   ├── LoadingSpinner.tsx # 載入指示器
│   └── ui/                # UI 基礎組件
├── lib/                   # 核心函式庫
│   ├── logger.ts          # 統一日誌系統
│   ├── supabase.ts        # Supabase 客戶端
│   ├── auth-context.tsx   # 認證上下文
│   └── cache-server.ts    # 快取管理
├── services/              # 業務邏輯層
│   ├── productService.ts  # 產品服務
│   ├── inquiryService.ts  # 詢價服務
│   ├── auditLogService.ts # 審計日誌服務
│   └── cachedProductService.ts # 快取產品服務
├── types/                 # TypeScript 型別定義
│   ├── product.ts         # 產品型別
│   ├── inquiry.ts         # 詢價型別
│   ├── audit.ts           # 審計型別
│   └── database.ts        # 資料庫型別
├── config/                # 設定檔案
│   ├── logging.ts         # 日誌配置
│   └── rate-limits.ts     # API 速率限制
├── hooks/                 # 自定義 React Hooks
│   ├── useApi.ts          # API 調用 Hook
│   └── useCSRFToken.ts    # CSRF Token Hook
└── messages/              # 多語言翻譯檔案
    ├── zh.json            # 繁體中文
    ├── en.json            # 英文
    └── ja.json            # 日文
```

## 🛠️ 技術架構

### 前端技術
- **[Next.js 15.4.6](https://nextjs.org/)** - React 全端框架，App Router 架構
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - 型別安全的 JavaScript
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first CSS 框架
- **[React 19](https://reactjs.org/)** - 使用最新的 React 功能

### 後端服務
- **[Supabase](https://supabase.com/)** - 開源 Firebase 替代方案
  - PostgreSQL 資料庫
  - 即時訂閱功能
  - 檔案儲存服務
  - 行級別安全性 (RLS)
- **Next.js API Routes** - 伺服器端 API 端點

### 開發工具
- **ESLint** - 程式碼品質檢查與風格統一
- **PostCSS** - CSS 處理工具
- **Turbopack** - 高速打包工具（開發環境）
- **統一日誌系統** - 結構化日誌管理與監控

### 核心功能
- **認證系統** - 基於 Supabase Auth
- **檔案上傳** - 整合 Supabase Storage
- **快取策略** - Vercel KV + 記憶體快取
- **安全防護** - CSRF 保護、Rate Limiting
- **審計系統** - 完整的操作記錄追蹤

### 設計特色
- **Utility-First CSS** - 使用 Tailwind 快速開發
- **響應式設計** - 支援各種螢幕尺寸
- **漸層與動畫** - 豐富的視覺效果
- **可訪問性** - 遵循 Web 可訪問性標準
- **圖片優化** - Next.js Image 組件最佳化

## 📄 頁面功能

### 🏠 首頁 (`/`)
- Hero 區塊 - 品牌故事與價值主張
- 農產探索 - 三大特色展示
- 文化典藏 - 歷史傳承介紹
- 經典產品 - 產品分類預覽
- 近期擺攤行程 - 活動預告
- 觀光果園體驗 - 四季農園介紹

### 🛒 產品展示 (`/products`)
- 產品網格展示與篩選
- 詳細產品資訊頁面
- 購物車完整功能
- 庫存狀態即時顯示
- 產品圖片畫廊

### 🎪 擺攤行程 (`/schedule`)
- 市集擺攤行程管理
- 固定門市據點資訊
- 狀態篩選與搜尋功能
- 特別優惠顯示
- 行程預約系統

### 🌱 觀光果園 (`/farm-tour`)
- 四季體驗活動介紹
- 農場設施導覽
- 線上預約系統
- 參觀資訊與交通指南
- 聯絡資訊與地圖

### 🏛️ 文化景點 (`/culture`)
- 在地文化景點介紹
- 歷史故事與特色
- 參訪資訊與建議
- 圖片展示與介紹

### 📰 新聞資訊 (`/news`)
- 農場最新動態
- 活動公告與報導
- 農業知識分享
- 季節性資訊更新

### 💬 詢價系統 (`/inquiries`)
- 線上詢價表單
- 客製化需求提交
- 詢價進度追蹤
- 歷史詢價記錄

### 🛠️ 管理後台 (`/admin`)
- **儀表板** - 營運數據總覽與關鍵指標
- **產品管理** - 商品資料維護、庫存管理、圖片上傳
- **詢價管理** - 客戶詢價處理、狀態更新、回覆系統
- **訂單管理** - 訂單處理、物流追蹤、狀態管理
- **內容管理** - 新聞發布、文化景點維護、行程管理
- **數據分析** - 營運報表、訪客統計、銷售分析
- **審計日誌** - 系統操作記錄、安全監控

## 🎨 設計系統

### 色彩配置
```css
/* 主要色彩 */
--amber-50: #fffbeb    /* 背景淺色 */
--amber-100: #fef3c7   /* 卡片背景 */
--amber-900: #92400e   /* 主要文字 */
--orange-50: #fff7ed   /* 輔助背景 */
--green-600: #16a34a   /* 按鈕色彩 */
```

### 字體設定
- **中文內容** - 系統預設字體
- **英文品牌** - 追蹤間距優化
- **響應式字體** - 根據螢幕大小調整

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
- [ ] 配置 Google Analytics ID（如需要）
- [ ] 設定適當的 CORS 政策
- [ ] 檢查 RLS 政策設定
- [ ] 測試圖片上傳功能
- [ ] 驗證 API 端點正常運作

## 📈 專案發展與改進

### 📚 相關文檔
- **[專案改進建議](./PROJECT_IMPROVEMENT_RECOMMENDATIONS.md)** - 完整的改進建議與實施計畫
- **[日誌遷移指南](./LOGGING_MIGRATION_EXAMPLES.md)** - Logger 系統使用範例與遷移步驟
- **[開發指南](./CLAUDE.md)** - 開發流程、程式碼標準與最佳實踐

### 🚀 已完成功能
- ✅ **完整的農產品電商平台** - 產品展示、購物車、詢價系統
- ✅ **強大的管理後台** - 內容管理、訂單處理、數據分析
- ✅ **統一日誌系統** - 結構化日誌管理與監控
- ✅ **審計追蹤系統** - 完整的操作記錄與安全監控
- ✅ **圖片管理系統** - Supabase Storage 整合
- ✅ **快取優化** - 多層快取策略提升效能

### 🔄 持續改進計畫
- **程式碼品質提升** - ESLint 規則優化、TypeScript 嚴格模式
- **效能優化** - Bundle 分析、圖片壓縮、CDN 整合
- **SEO 強化** - 結構化資料、動態網站地圖
- **使用者體驗** - 載入優化、錯誤處理改善
- **監控與分析** - 整合 Sentry、效能指標追蹤

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request 來改進這個專案！

### 開發流程
1. Fork 這個專案
2. 創建特性分支 (`git checkout -b feature/amazing-feature`)
3. 遵循程式碼標準（使用 Logger 系統，不使用 console.log）
4. 執行類型檢查 (`npm run type-check`)
5. 執行程式碼檢查 (`npm run lint`)
6. 提交變更 (`git commit -m 'feat: Add amazing feature'`)
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
- **技術支援** - [建立 Issue](https://github.com/aim840912/haode-nextjs/issues)
- **專案倉庫** - [GitHub Repository](https://github.com/aim840912/haode-nextjs)

---

> 🌱 **傳承百年農業文化，擁抱現代科技創新**
> 
> Haude Farm - 讓傳統與現代完美融合

## 🔄 更新日誌

### v2.0.0 (2024-08-30)
- ✨ **重大更新** - 從展示網站進化為完整農場管理平台
- ✨ **新增管理後台** - 完整的內容管理系統與數據分析
- ✨ **詢價系統** - 客製化詢價流程與客戶關係管理
- ✨ **統一日誌系統** - 結構化日誌管理與監控
- ✨ **審計追蹤** - 完整的操作記錄與安全監控
- ✨ **圖片管理** - Supabase Storage 整合與圖片上傳
- ✨ **文化景點** - 在地文化導覽與特色介紹
- ✨ **快取優化** - 多層快取策略提升效能
- 🔧 **架構重構** - 服務層分離、型別安全強化
- 🔧 **安全強化** - CSRF 保護、Rate Limiting、RLS 權限控制
- 🎨 **UI/UX 改進** - 載入狀態、錯誤處理、響應式優化

### v1.0.0 (2024-08-07)
- ✨ 完成基礎網站架構
- ✨ 實現產品展示功能
- ✨ 新增擺攤行程管理
- ✨ 推出觀光果園體驗
- ✨ 建立共用 Header 組件
- 🎨 優化響應式設計
- 📱 改善行動裝置體驗