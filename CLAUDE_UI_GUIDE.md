# 🎨 Claude Code UI 美化完整指南

> 針對 money-manager 專案的 UI 美化參考手冊

---

## 📑 目錄

- [⚡ 快速開始](#-快速開始)
- [🔧 內建工具](#-內建工具)
- [🎯 實用提示範例](#-實用提示範例)
- [🔄 完整工作流程](#-完整工作流程)
- [💼 專案特定建議](#-專案特定建議)
- [📸 進階技巧](#-進階技巧)
- [🔌 MCP Servers 擴展](#-mcp-servers-擴展)
- [❓ 常見問題](#-常見問題)

---

## ⚡ 快速開始

### 最常用的美化指令 (複製即用)

```bash
# 🎨 快速美化
"請快速美化專案 UI,重點優化:
1. 顏色對比度 → 確保 WCAG AA 標準
2. 間距一致性 → 統一使用 Tailwind spacing
3. 圓角標準化 → 使用一致的 rounded classes
4. 陰影優化 → 改善深度感
5. 字體層級 → 清晰的視覺層次"

# 🌙 深色模式完善
"請完善所有元件的深色模式:
1. 檢查所有顏色在深色模式下的顯示
2. 確保對比度足夠
3. 優化陰影效果
4. 測試所有狀態 (hover, active, disabled)"

# 📱 響應式完善
"請確保所有頁面完美響應式:
1. Mobile (375px) → 單欄佈局
2. Tablet (768px) → 混合佈局
3. Desktop (1440px+) → 多欄佈局
4. 測試所有斷點的過渡"

# ✨ 動畫增強
"請為所有互動元件加入流暢動畫:
1. 頁面進場動畫 (fade + slide)
2. 卡片懸停效果 (shadow + scale)
3. 按鈕點擊回饋 (scale + ripple)
4. 載入狀態動畫 (skeleton + spinner)"
```

---

## 🔧 內建工具

### 1. Slash Commands (斜線指令)

#### 查看所有可用指令
```bash
/help
```

#### UI 相關指令

| 指令 | 功能 | 使用時機 |
|------|------|---------|
| `/code-review` | 程式碼審查 (含 UI) | 完成功能後 |
| `/feature-dev [描述]` | 功能開發 (含 UI 設計) | 開發新功能前 |
| `/pr-review-toolkit:review-pr` | PR 完整審查 | 提交 PR 前 |
| `/universal:code-quality:safereview` | 唯讀審查 | 了解程式碼品質 |
| `/universal:planning:ultraplan` | 深度規劃 | 重大改版前 |

#### 實際使用範例

```bash
# 開發前規劃
/universal:planning:ultraplan
"請規劃 Dashboard UI 改版方案"

# 完成後審查
/code-review
"請審查 Dashboard 的 UI 程式碼品質"

# PR 前檢查
/pr-review-toolkit:review-pr style-improvements
```

---

### 2. Claude Code Plugins

#### 已安裝的插件

| 插件 | 功能 | UI 相關 |
|------|------|--------|
| `pr-review-toolkit` | PR 審查工具 | ✅ 型別設計、程式碼品質 |
| `feature-dev` | 功能開發助手 | ✅ UI 架構規劃 |
| `code-review` | 程式碼審查 | ✅ UI 最佳實踐 |

#### 查看插件
```bash
/plugin
```

---

### 3. Playwright 瀏覽器工具 (內建)

#### 開啟瀏覽器並截圖
```bash
"請開啟瀏覽器訪問 localhost:3000 並截圖"
```

#### 截圖所有頁面
```bash
"請開啟瀏覽器,截圖以下頁面:
1. Dashboard (/)
2. Transactions (/transactions)
3. Budgets (/budgets)
4. Reports (/reports)
5. Profile (/profile)"
```

#### 互動測試
```bash
"請開啟瀏覽器:
1. 點擊新增交易按鈕
2. 測試表單填寫流程
3. 截圖各個狀態
4. 測試響應式佈局"
```

---

## 🎯 實用提示範例

### 全面 UI 審查

```bash
"請審查整個專案的 UI 設計,重點檢查:

**視覺設計**:
1. 顏色搭配與對比度 (WCAG AA)
2. 間距與對齊的一致性
3. 字體層級與可讀性
4. 圓角與陰影的統一性

**互動設計**:
5. 懸停狀態回饋
6. 點擊動畫效果
7. 載入狀態設計
8. 錯誤狀態提示

**響應式設計**:
9. Mobile/Tablet/Desktop 佈局
10. 斷點過渡流暢度

**深色模式**:
11. 所有元件深色模式支援
12. 深色模式對比度

**無障礙性**:
13. ARIA labels
14. 鍵盤導航
15. Focus 樣式

提供具體的改善建議和程式碼範例"
```

---

### 特定元件美化

#### Dashboard 頁面
```bash
"請美化 Dashboard 頁面:

**StatCard 元件**:
- 改善卡片陰影與圓角
- 優化數字動畫效果
- 增加懸停互動
- 改善圖示設計

**StreakCard 元件**:
- 優化連續天數顯示
- 改善里程碑視覺
- 增強煙火動畫效果
- 改善進度提示

**HealthScoreCard 元件**:
- 優化圓形進度條設計
- 改善顏色漸變
- 增強分數拆解視覺
- 改善建議展示

**整體佈局**:
- 優化卡片間距
- 改善資訊層級
- 確保響應式完美
- 統一視覺風格"
```

#### 成就系統
```bash
"請美化成就系統 UI:

**AchievementCard**:
- 改善解鎖/未解鎖狀態設計
- 優化成就圖示顯示
- 增強解鎖動畫
- 改善等級徽章設計

**AchievementGrid**:
- 優化網格佈局
- 改善篩選器設計
- 增加篩選動畫
- 改善空白狀態

**進度條**:
- 優化進度條視覺
- 增加漸變效果
- 改善百分比顯示
- 增強完成動畫"
```

---

### 設計系統建立

```bash
"請為 money-manager 建立完整的設計系統:

**1. 顏色系統**:
```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: '#...',
    100: '#...',
    // ... 完整色階
    900: '#...',
  },
  success: { ... },  // 收入、成功
  danger: { ... },   // 支出、錯誤
  warning: { ... },  // 警告、預算超標
  info: { ... },     // 提示、資訊
}
```

**2. 間距系統**:
- 元件內 padding: p-4, p-6
- 元件間距: space-y-4, gap-6
- 容器邊距: mx-auto max-w-7xl px-4

**3. 字體系統**:
- 大標題 (h1): text-3xl md:text-4xl font-bold
- 標題 (h2): text-2xl md:text-3xl font-bold
- 小標題 (h3): text-xl font-semibold
- 正文: text-base
- 小字: text-sm

**4. 圓角系統**:
- 按鈕/小元件: rounded-md (6px)
- 卡片: rounded-lg (8px)
- Modal: rounded-xl (12px)

**5. 陰影系統**:
- 卡片: shadow-sm
- 懸停: shadow-md
- Modal: shadow-xl

**6. 動畫系統**:
- 快速: duration-150
- 標準: duration-300
- 慢速: duration-500
- 緩動: ease-in-out

並將這些系統應用到所有現有元件"
```

---

### 深色模式優化

```bash
"請完善深色模式支援:

**檢查項目**:
1. 所有文字顏色:
   - text-gray-900 → dark:text-gray-100
   - text-gray-600 → dark:text-gray-400

2. 所有背景顏色:
   - bg-white → dark:bg-gray-800
   - bg-gray-100 → dark:bg-gray-700

3. 所有邊框:
   - border-gray-200 → dark:border-gray-700

4. 所有陰影:
   - shadow-md → dark:shadow-gray-900/50

5. 所有卡片:
   - 確保在深色模式下有足夠對比度
   - 調整陰影在深色背景上的顯示

6. 所有圖示:
   - 確保顏色在深色模式下可見
   - 調整 opacity 和 color

7. 特殊元件:
   - Chart 顏色配置
   - Progress bar 顏色
   - Badge 顏色

**測試場景**:
- 系統主題切換
- 手動切換主題
- 所有頁面和元件狀態"
```

---

### 響應式設計優化

```bash
"請確保完美的響應式設計:

**Mobile (375px - 639px)**:
- 所有內容單欄顯示
- 字體大小適當縮小
- 按鈕/表單元件易點擊 (min-h-10)
- 導航改為 Drawer 或 Bottom Nav
- 卡片 padding 縮小 (p-4)

**Tablet (640px - 1023px)**:
- 混合佈局 (部分兩欄)
- Dashboard 卡片 2 欄顯示
- 表格改為卡片列表
- 側邊欄收合

**Desktop (1024px+)**:
- 多欄佈局
- Dashboard 卡片 3-4 欄
- 完整表格顯示
- 側邊欄展開

**Large Desktop (1440px+)**:
- 最大寬度限制 (max-w-7xl)
- 居中顯示
- 充分利用空間

**測試所有斷點**:
- 平滑過渡
- 無破版
- 無橫向捲軸
- 圖片/圖表響應式"
```

---

### 動畫增強

```bash
"請為專案加入流暢的動畫效果:

**頁面動畫**:
```typescript
// Framer Motion 頁面進場
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
```

**卡片動畫**:
```typescript
// 懸停效果
<motion.div
  whileHover={{
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  }}
  transition={{ duration: 0.2 }}
>
```

**按鈕動畫**:
```typescript
// 點擊回饋
<motion.button
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.05 }}
>
```

**載入動畫**:
- Skeleton loading
- Spinner
- Progress bar

**互動回饋**:
- 成功提示 (綠色 Toast)
- 錯誤提示 (紅色 Toast)
- 資訊提示 (藍色 Toast)

**特殊動畫**:
- 成就解鎖煙火 (已有)
- 連續天數里程碑
- 數字計數動畫
- 圖表繪製動畫

確保所有動畫:
- 流暢 (60fps)
- 不過度
- 可關閉 (prefers-reduced-motion)
- 效能優良"
```

---

## 🔄 完整工作流程

### 標準 UI 美化流程

```bash
# ============================================
# 第一階段: 審查與分析
# ============================================

# 1. 開啟瀏覽器查看
"請開啟瀏覽器訪問 localhost:3000,
截圖以下頁面:
1. Dashboard
2. Transactions
3. Budgets
4. Reports
5. Profile

然後分析每個頁面的 UI 問題"

# 2. 程式碼審查
/universal:code-quality:safereview
"請審查 UI 相關程式碼品質"

# ============================================
# 第二階段: 規劃
# ============================================

# 3. 深度規劃
/universal:planning:ultraplan
"基於截圖分析,請規劃 UI 改善方案:
1. 優先級排序
2. 預估工作量
3. 依賴關係
4. 實作順序"

# ============================================
# 第三階段: 實作
# ============================================

# 4. 建立設計系統
"請先建立完整的設計系統 (顏色、間距、字體等)"

# 5. 逐步實作改善
"請按照規劃,從高優先級開始實作"

# ============================================
# 第四階段: 驗證
# ============================================

# 6. 視覺驗證
"請再次開啟瀏覽器截圖,比對改善前後差異"

# 7. 響應式測試
"請測試不同螢幕尺寸:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1440px"

# 8. 深色模式測試
"請切換深色模式,確認所有頁面正常顯示"

# 9. 程式碼審查
/code-review

# ============================================
# 第五階段: 提交
# ============================================

# 10. 提交變更
/commit-commands:commit
"UI 改善: [簡短描述]"

# 11. 建立 PR
/commit-commands:commit-push-pr
```

---

### 快速優化流程 (單一頁面)

```bash
# 1. 指定頁面優化
"請美化 Dashboard 頁面"

# 2. 瀏覽器驗證
"請開啟瀏覽器截圖驗證效果"

# 3. 提交
/commit-commands:commit
```

---

## 💼 專案特定建議

### money-manager 專案的 UI 優化重點

#### 1. Dashboard 頁面優化

```bash
"請優化 Dashboard 頁面 (src/app/(dashboard)/dashboard/page.tsx):

**統計卡片區域**:
- StatCard 元件視覺增強
- 優化圖示與數字顯示
- 增加數字計數動畫
- 改善懸停效果

**遊戲化功能區域**:
- StreakCard 視覺優化
- HealthScoreCard 圖表美化
- 卡片間距調整
- 響應式佈局優化

**整體佈局**:
- 改善資訊層級
- 優化空白狀態
- 增加載入狀態
- 確保深色模式完美"
```

#### 2. 成就系統優化

```bash
"請優化成就系統 UI (Profile 頁面):

**成就卡片**:
- 改善解鎖/未解鎖視覺差異
- 優化成就圖示顯示
- 增強解鎖動畫效果
- 改善進度條設計

**成就牆**:
- 優化網格佈局
- 改善篩選器 UI
- 增加篩選動畫
- 優化空白狀態

**統計資訊**:
- 改善完成度顯示
- 優化分類統計
- 增加視覺化圖表"
```

#### 3. 表單與互動優化

```bash
"請優化所有表單與互動元件:

**表單元件**:
- Input 統一樣式
- Select 下拉選單美化
- Textarea 優化
- DatePicker 改善

**按鈕**:
- 統一按鈕樣式
- 優化懸停效果
- 增加點擊動畫
- 改善載入狀態

**Modal/Dialog**:
- 優化 Modal 設計
- 改善背景遮罩
- 增加進出場動畫
- 改善關閉按鈕"
```

#### 4. 圖表與數據視覺化

```bash
"請優化圖表顯示 (Reports 頁面):

**Recharts 配置**:
- 優化顏色配置
- 改善 Tooltip 設計
- 增加圖表動畫
- 優化圖例顯示

**響應式**:
- 確保圖表在小螢幕正常顯示
- 優化觸控互動
- 改善載入狀態

**深色模式**:
- 調整圖表配色
- 優化網格線顯示
- 改善文字顏色"
```

---

## 📸 進階技巧

### 截圖分析法

#### 1. 競品分析

```bash
"這是競品 [名稱] 的截圖 (附截圖),
請分析他們的優點:
1. 佈局設計
2. 色彩運用
3. 互動細節
4. 視覺層次

並提供如何應用到 money-manager 的建議"
```

#### 2. 設計稿實作

```bash
"這是設計師的 Figma 設計稿 (附截圖),
請:
1. 分析設計稿的佈局結構
2. 識別顏色、字體、間距
3. 精確實作為 React + Tailwind 元件
4. 確保響應式設計
5. 確保深色模式支援"
```

#### 3. 風格參考

```bash
"這是我喜歡的設計風格 (附截圖),
請將 money-manager 改成類似風格:
- 相同的色彩風格
- 相似的佈局方式
- 類似的動畫效果
- 一致的視覺語言"
```

---

### 視覺回歸測試

```bash
# 1. 改善前截圖
"請截圖所有頁面,儲存為 'before-改善項目.png'"

# 2. 實作改善
"請實作 UI 改善"

# 3. 改善後截圖
"請再次截圖,儲存為 'after-改善項目.png'"

# 4. 對比分析
"請分析改善前後的差異,列出改善項目"
```

---

### 無障礙檢查

```bash
"請進行完整的無障礙檢查:

**WCAG 2.1 AA 標準**:
1. 顏色對比度 ≥ 4.5:1 (正文)
2. 顏色對比度 ≥ 3:1 (大文字)
3. 不依賴顏色傳達資訊

**鍵盤導航**:
4. 所有互動元件可用 Tab 導航
5. Focus 狀態清晰可見
6. Tab 順序合理

**語義化 HTML**:
7. 使用正確的 HTML 標籤
8. 適當的 heading 層級
9. 表單 label 關聯正確

**ARIA 屬性**:
10. 互動元件有 aria-label
11. 動態內容有 aria-live
12. Modal 有適當的 aria-modal

**其他**:
13. 圖片有 alt 文字
14. 連結有描述性文字
15. 錯誤提示清晰

提供具體的改善建議和程式碼"
```

---

## 🔌 MCP Servers 擴展

### Figma MCP Server (設計稿整合)

#### 安裝配置

```json
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_TOKEN": "你的-figma-token"
      }
    }
  }
}
```

#### 使用方式

```bash
# 從 Figma 讀取設計稿
"請從 Figma 專案 [專案ID] 讀取設計稿,
並實作為 React 元件"

# 同步設計 Tokens
"請從 Figma 提取 Design Tokens:
- Colors
- Typography
- Spacing
並更新到 Tailwind 配置"
```

---

### Storybook (元件展示)

#### 安裝

```bash
npx storybook@latest init
```

#### 建立 Story

```typescript
// src/components/ui/Card.stories.tsx
import Card from './Card'

export default {
  title: 'UI/Card',
  component: Card,
}

export const Default = () => (
  <Card>
    <p>預設卡片</p>
  </Card>
)

export const WithGradient = () => (
  <Card gradient="blue">
    <p>漸變卡片</p>
  </Card>
)
```

#### 啟動 Storybook

```bash
npm run storybook
```

訪問 `http://localhost:6006`

---

### Chromatic (視覺回歸測試)

#### 安裝

```bash
npm install --save-dev chromatic
```

#### 配置

```bash
npx chromatic --project-token=<your-token>
```

#### 使用

```bash
# 每次 UI 變更後執行
npm run chromatic
```

Chromatic 會自動:
- 截圖所有 Stories
- 與上次比對
- 標記視覺差異
- 需要人工審核

---

## ❓ 常見問題

### Q1: Claude 生成的 UI 程式碼品質如何保證?

**A**: 使用以下檢查流程:

```bash
# 1. 程式碼審查
/code-review

# 2. TypeScript 檢查
npm run type-check

# 3. ESLint 檢查
npm run lint

# 4. 瀏覽器實際測試
"請開啟瀏覽器測試所有互動功能"
```

---

### Q2: 如何確保響應式設計完美?

**A**:

```bash
# 使用 Playwright 測試不同尺寸
"請開啟瀏覽器,測試以下尺寸:
1. iPhone SE (375px)
2. iPad (768px)
3. MacBook Pro (1440px)
4. 4K Display (2560px)

截圖每個尺寸並標記問題"
```

---

### Q3: 深色模式如何快速測試?

**A**:

```bash
# 自動切換測試
"請開啟瀏覽器:
1. 淺色模式截圖所有頁面
2. 切換深色模式
3. 再次截圖所有頁面
4. 對比分析,標記顏色問題"
```

---

### Q4: 如何參考其他網站的設計?

**A**:

```bash
# 方法 1: 提供截圖
"這是 [網站名] 的設計 (附截圖),
請分析並應用類似風格"

# 方法 2: 提供 URL
"請開啟瀏覽器訪問 https://example.com,
分析他們的 UI 設計並提供建議"
```

---

### Q5: Claude 能處理複雜的動畫嗎?

**A**: 可以,Claude 熟悉:

- **Framer Motion** ✅ (專案已使用)
- **CSS Animations** ✅
- **Tailwind Animations** ✅
- **GSAP** ✅
- **Lottie** ✅

```bash
"請使用 Framer Motion 為 [元件]
加入以下動畫:
1. 進場動畫 (fade + slide)
2. 懸停動畫 (scale + shadow)
3. 點擊動畫 (ripple effect)
4. 離場動畫 (fade out)"
```

---

### Q6: 如何優化效能?

**A**:

```bash
"請優化 UI 效能:

**1. 動畫效能**:
- 使用 transform 而非 top/left
- 使用 will-change 提示
- 避免重新計算 layout

**2. 圖片優化**:
- 使用 Next.js Image 元件
- 設定適當的 sizes
- 使用 WebP 格式

**3. 減少重新渲染**:
- 使用 React.memo
- 使用 useMemo/useCallback
- 避免不必要的 state 更新

**4. CSS 優化**:
- 減少選擇器複雜度
- 使用 CSS containment
- 避免昂貴的 CSS 屬性

提供具體的優化程式碼"
```

---

### Q7: 如何建立設計系統?

**A**: 參考 [設計系統建立](#設計系統建立) 章節

---

### Q8: Claude 能幫忙做 A/B 測試嗎?

**A**: 可以協助建立 A/B 測試:

```bash
"請建立 A/B 測試系統:

**方案 A**: 當前設計
**方案 B**: 改善方案

建立:
1. Feature Flag 控制
2. 兩種 UI 版本
3. 埋點追蹤程式碼
4. 數據收集介面"
```

---

## 🎯 快速參考

### 最常用的 5 個指令

```bash
# 1. 快速美化
"請快速美化 [頁面/元件]"

# 2. 開啟瀏覽器查看
"請開啟瀏覽器訪問 localhost:3000 並截圖"

# 3. 響應式測試
"請測試 Mobile/Tablet/Desktop 響應式"

# 4. 深色模式測試
"請測試深色模式顯示"

# 5. 程式碼審查
/code-review
```

---

### 檢查清單

完成 UI 改善後,確認以下項目:

- [ ] 視覺設計:
  - [ ] 顏色對比度符合 WCAG AA
  - [ ] 間距一致使用 Tailwind spacing
  - [ ] 圓角統一
  - [ ] 陰影適當

- [ ] 互動設計:
  - [ ] 所有按鈕有懸停效果
  - [ ] 表單有 focus 樣式
  - [ ] 載入狀態清晰
  - [ ] 錯誤提示明確

- [ ] 響應式:
  - [ ] Mobile (375px) 顯示正常
  - [ ] Tablet (768px) 顯示正常
  - [ ] Desktop (1440px+) 顯示正常
  - [ ] 無橫向捲軸

- [ ] 深色模式:
  - [ ] 所有元件支援深色模式
  - [ ] 對比度足夠
  - [ ] 陰影在深色背景顯示正常

- [ ] 無障礙:
  - [ ] 鍵盤導航正常
  - [ ] Focus 樣式清晰
  - [ ] ARIA 標籤完整
  - [ ] 圖片有 alt 文字

- [ ] 效能:
  - [ ] 動畫流暢 (60fps)
  - [ ] 無不必要的重新渲染
  - [ ] 圖片優化

- [ ] 程式碼品質:
  - [ ] TypeScript 類型檢查通過
  - [ ] ESLint 檢查通過
  - [ ] 無 console 殘留
  - [ ] 程式碼有註解

---

## 💡 使用提示

### DO (推薦做法)

✅ **提供具體需求**
```bash
"請改善 Dashboard 的卡片陰影,
從 shadow-sm 改為 shadow-md,
並加入懸停時的 shadow-lg 效果"
```

✅ **使用截圖參考**
```bash
"這是設計參考 (附截圖),
請實作類似的卡片設計"
```

✅ **分階段進行**
```bash
"請先美化 Dashboard,
完成後再處理其他頁面"
```

✅ **測試驗證**
```bash
"請開啟瀏覽器驗證改善效果"
```

### DON'T (避免做法)

❌ **模糊要求**
```bash
"UI 不好看,改一下"  # 太模糊
```

❌ **一次改太多**
```bash
"請同時改善所有頁面、所有元件、
所有顏色、所有動畫..."  # 容易出錯
```

❌ **沒有驗證**
```bash
"改完就提交"  # 沒有測試
```

---

## 📚 延伸閱讀

- [Tailwind CSS 官方文檔](https://tailwindcss.com/docs)
- [Framer Motion 文檔](https://www.framer.com/motion/)
- [WCAG 無障礙指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Storybook 文檔](https://storybook.js.org/docs)
- [Claude Code 官方文檔](https://docs.claude.ai/)

---

## 🎉 總結

這份指南涵蓋了使用 Claude Code 美化網頁 UI 的所有要點:

1. ⚡ **快速開始** - 複製即用的指令
2. 🔧 **內建工具** - Slash Commands、Plugins、Playwright
3. 🎯 **實用範例** - 針對各種場景的提示詞
4. 🔄 **工作流程** - 標準化的美化流程
5. 💼 **專案建議** - money-manager 特定優化
6. 📸 **進階技巧** - 截圖分析、設計系統
7. 🔌 **擴展工具** - MCP Servers、Storybook
8. ❓ **常見問題** - 實用的 Q&A

**開始美化你的 UI 吧!** 🚀

有任何問題,隨時問 Claude!
