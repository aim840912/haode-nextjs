# 豪德茶業 Haude Tea 🍃

> 傳承百年茶文化，品味東方茶韻

一個基於 Next.js 和 Tailwind CSS 開發的現代化農產品電商網站，結合傳統農業文化與現代網路技術。

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## 🌟 專案特色

### 📱 完整的電商功能
- **產品展示系統** - 精美的產品目錄與詳細資訊
- **購物車功能** - 模擬購物體驗（可擴展為真實電商）
- **響應式設計** - 支援桌面、平板、手機等各種裝置

### 🎪 創新的營運模式
- **擺攤行程管理** - 動態顯示各地市集與夜市行程
- **觀光果園體驗** - 四季農場導覽與體驗活動預約
- **門市據點資訊** - 完整的實體店面資訊

### 🎨 優雅的視覺設計
- **品牌色系** - 以琥珀色為主調，展現傳統茶業質感
- **文化元素** - 融入中華茶文化與農業傳承概念
- **現代體驗** - 流暢的動畫效果與互動設計

## 🚀 快速開始

### 系統需求
- Node.js 18.0 或更高版本
- npm 或 yarn 套件管理器

### 安裝與啟動

```bash
# 複製專案
git clone <repository-url>
cd my-nextjs-app

# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 或使用其他套件管理器
yarn dev
pnpm dev
bun dev
```

開啟 [http://localhost:3000](http://localhost:3000) 即可查看網站。

## 📁 專案結構

```
src/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # 首頁
│   ├── products/          # 產品展示頁面
│   ├── schedule/          # 擺攤行程頁面
│   ├── farm-tour/         # 觀光果園頁面
│   ├── layout.tsx         # 全域布局
│   └── globals.css        # 全域樣式
├── components/            # 可重用組件
│   └── Header.tsx         # 共用導航組件
└── messages/              # 多語言翻譯檔案（預留）
    ├── zh.json
    ├── en.json
    └── ja.json
```

## 🛠️ 技術架構

### 核心技術
- **[Next.js 15.4.6](https://nextjs.org/)** - React 全端框架
- **[TypeScript](https://www.typescriptlang.org/)** - 型別安全的 JavaScript
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first CSS 框架

### 開發工具
- **ESLint** - 程式碼品質檢查
- **PostCSS** - CSS 處理工具
- **Turbopack** - 高速打包工具

### 設計特色
- **Utility-First CSS** - 使用 Tailwind 快速開發
- **響應式設計** - 支援各種螢幕尺寸
- **漸層與動畫** - 豐富的視覺效果
- **可訪問性** - 遵循 Web 可訪問性標準

## 📄 頁面功能

### 🏠 首頁 (`/`)
- Hero 區塊 - 品牌故事與價值主張
- 農產探索 - 三大特色展示
- 茶文化典藏 - 歷史傳承介紹
- 經典產品 - 產品分類預覽
- 近期擺攤行程 - 活動預告
- 觀光果園體驗 - 四季農園介紹

### 🛒 產品展示 (`/products`)
- 產品網格展示
- 詳細產品資訊彈窗
- 評分與評論系統
- 購物車模擬功能
- 庫存狀態顯示

### 🎪 擺攤行程 (`/schedule`)
- 市集擺攤行程管理
- 固定門市據點資訊
- 狀態篩選功能
- 特別優惠顯示
- 天氣提醒功能

### 🌱 觀光果園 (`/farm-tour`)
- 四季體驗活動介紹
- 農場設施導覽
- 線上預約系統
- 參觀資訊說明
- 360度虛擬導覽

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
```

### 其他平台部署
```bash
# 建置生產版本
npm run build

# 啟動生產伺服器
npm run start
```

## 📈 電商化發展計畫

詳細的電商化發展藍圖請參考 [CLAUDE.md](./CLAUDE.md)，包含：

- **三階段發展計畫** - MVP → 客製化 → 進階功能
- **技術架構建議** - Shopify/Supabase/Stripe 整合
- **成本效益分析** - 自主開發 vs 外包開發
- **預算規劃** - 年成本 NT$ 15,000-30,000
- **營收平衡點** - 月營收 NT$ 4,000 即可打平

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request 來改進這個專案！

### 開發流程
1. Fork 這個專案
2. 創建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📝 授權條款

此專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案以獲得詳細資訊。

## 📞 聯絡資訊

- **專案維護** - 豪德茶業開發團隊
- **技術支援** - [建立 Issue](https://github.com/username/repo/issues)
- **商業合作** - info@dechuantea.com

---

> 🌿 **傳承百年農業文化，擁抱現代科技創新**
> 
> Haude Tea - 讓傳統與現代完美融合

## 🔄 更新日誌

### v1.0.0 (2024-08-07)
- ✨ 完成基礎網站架構
- ✨ 實現產品展示功能
- ✨ 新增擺攤行程管理
- ✨ 推出觀光果園體驗
- ✨ 建立共用 Header 組件
- 🎨 優化響應式設計
- 📱 改善行動裝置體驗