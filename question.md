## Q: 通常圖片會存在哪裡？

**回答：**

在 Next.js 專案中，圖片通常存放在以下位置：

### 1. `/public` 目錄（最常見）
```
/public
├── images/
│   ├── news/        # 農產新聞圖片
│   ├── culture/     # 茶文化典藏圖片
│   ├── farm-tour/   # 觀光果園體驗圖片
│   ├── schedule/    # 擺攤行程圖片
│   ├── locations/   # 門市據點圖片
│   └── hero/        # 首頁英雄區塊背景圖
├── products/        # 產品圖片
├── icons/           # 圖標
└── logo.png         # Logo 等
```

### 2. 雲端存儲服務
- Cloudinary
- AWS S3
- Vercel Blob
- Google Cloud Storage

### 3. 外部 CDN
- 第三方圖片服務
- 內容分發網路

### 使用方式：
```jsx
// 導航列頁面圖片範例
<img src="/images/news/news-banner.jpg" alt="農產新聞" />
<img src="/images/culture/tea-ceremony.jpg" alt="茶文化典藏" />
<img src="/images/farm-tour/farm-landscape.jpg" alt="觀光果園" />
<img src="/images/schedule/market-stall.jpg" alt="擺攤行程" />
<img src="/images/locations/store-front.jpg" alt="門市據點" />

// 產品圖片
<img src="/products/red-plum.jpg" alt="紅肉李" />
<img src="/products/premium-coffee.jpg" alt="精品咖啡" />
```

### 專案現況：
- 類型定義中已包含 `images: string[]` 欄位
- 建議創建 `/public/images/` 和 `/public/products/` 目錄存放圖片
- 目前 `/public` 目錄僅包含 Next.js 預設的 SVG 圖標檔案

---

## Q: 圖片有命名規範嗎？

**回答：**

是的，建議遵循以下圖片命名規範：

### 1. 基本規範
- **小寫字母**：全部使用小寫
- **連字符**：使用 `-` 分隔單字，避免使用空格或底線
- **英文命名**：使用英文，避免中文檔名
- **有意義的名稱**：檔名能清楚表達內容

### 2. 命名格式
```
[類別]-[描述]-[規格].[副檔名]
```

### 3. 各類別命名範例

#### 產品圖片 (`/public/products/`)
```
red-plum-main.jpg           # 紅肉李主圖
red-plum-detail-01.jpg      # 紅肉李細節圖1
coffee-beans-premium.jpg    # 精品咖啡豆
vegetables-organic-mix.jpg  # 有機蔬菜組合
```

#### 新聞圖片 (`/public/images/news/`)
```
news-harvest-2024.jpg       # 2024年收穫新聞
news-market-opening.jpg     # 市場開幕新聞
news-award-ceremony.jpg     # 頒獎典禮新聞
```

#### 文化典藏 (`/public/images/culture/`)
```
culture-tea-ceremony.jpg    # 茶道儀式
culture-vintage-tools.jpg   # 古董工具
culture-history-timeline.jpg # 歷史時間軸
```

#### 觀光果園 (`/public/images/farm-tour/`)
```
farm-landscape-spring.jpg   # 春季農場風景
farm-activity-picking.jpg   # 採摘活動
farm-facilities-barn.jpg    # 農場設施-穀倉
```

#### 擺攤行程 (`/public/images/schedule/`)
```
schedule-night-market.jpg   # 夜市擺攤
schedule-weekend-fair.jpg   # 週末市集
schedule-festival-booth.jpg # 節慶攤位
```

#### 門市據點 (`/public/images/locations/`)
```
store-taipei-exterior.jpg   # 台北店外觀
store-taichung-interior.jpg # 台中店內裝
store-kaohsiung-counter.jpg # 高雄店櫃檯
```

#### 首頁背景 (`/public/images/hero/`)
```
hero-main-bg.jpg           # 主背景圖
hero-seasonal-spring.jpg   # 春季背景
hero-harvest-autumn.jpg    # 秋收背景
```

#### 圖標 (`/public/icons/`)
```
icon-tea-leaf.svg          # 茶葉圖標
icon-coffee-bean.svg       # 咖啡豆圖標
icon-fruit-basket.svg      # 水果籃圖標
```

### 4. 技術規範
- **格式**：網頁用 `.jpg`、`.png`、`.webp`；圖標用 `.svg`
- **尺寸**：在檔名中標註特殊尺寸 (如 `-thumb`、`-large`)
- **版本**：使用數字編號 (`-01`, `-02`) 而非 (`-v1`, `-v2`)

### 5. 避免的命名
❌ `IMG_1234.jpg` - 無意義
❌ `紅肉李.jpg` - 中文檔名
❌ `red plum.jpg` - 包含空格
❌ `Red_Plum.JPG` - 大寫和底線

✅ `red-plum-main.jpg` - 清楚明確

---

## Q: 為什麼有時候更改之後重整不會改變，要把終端機全部關掉之後重開才會有變化？

**回答：**

這個問題通常有幾個可能原因：

### 最常見原因：

1. **瀏覽器快取** - 按 `Ctrl+F5` 或 `Cmd+Shift+R` 強制重新整理
2. **CSS/樣式更改** - Tailwind CSS 需要重新編譯，特別是新增的 class
3. **檔案監看失效** - Next.js 的 Hot Reload 機制卡住

### 快速解決方法：
```bash
# 不用關閉終端機，試試看：
# 1. 先按 Ctrl+C 停止 dev server
# 2. 清除 .next 資料夾
rm -rf .next
# 3. 重新啟動
npm run dev
```

### 其他可能原因：
- WSL2 檔案系統監看問題（你在 Windows WSL 環境）
- TypeScript 型別錯誤阻止重新編譯
- 記憶體不足導致監看程序失效

### 預防方法：
- 定期清除瀏覽器快取
- 使用無痕視窗測試
- 確保檔案儲存成功（有時編輯器延遲儲存）

---

*記錄時間：2025-08-10*