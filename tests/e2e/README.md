# E2E 測試系統

這是 Haude 專案的端到端（E2E）測試系統，使用 Playwright 框架建立。

## 📁 專案結構

```
tests/e2e/
├── specs/                 # 測試規格檔案
│   ├── homepage.spec.ts   # 首頁功能測試
│   ├── products.spec.ts   # 產品頁面測試
│   └── auth.spec.ts       # 認證功能測試
├── pages/                 # Page Object Models
│   ├── HomePage.ts        # 首頁 Page Object
│   ├── ProductsPage.ts    # 產品頁面 Page Object
│   └── LoginPage.ts       # 登入頁面 Page Object
├── fixtures/              # 測試資料
│   └── test-data.ts       # 測試用資料和配置
├── utils/                 # 輔助工具
│   └── test-helpers.ts    # 通用測試輔助函數
├── reports/               # 測試報告（自動生成）
└── results/               # 測試結果（自動生成）
```

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 執行測試

#### 執行所有測試
```bash
npm run test:e2e
```

#### 使用 UI 模式執行（推薦用於開發）
```bash
npm run test:e2e:ui
```

#### 除錯模式
```bash
npm run test:e2e:debug
```

#### 執行測試並顯示瀏覽器（頭模式）
```bash
npm run test:e2e:headed
```

#### 只在 Chrome 瀏覽器執行
```bash
npm run test:e2e:chrome
```

#### 只執行行動裝置測試
```bash
npm run test:e2e:mobile
```

#### 檢視測試報告
```bash
npm run test:e2e:report
```

## 📋 測試覆蓋範圍

### 首頁測試（homepage.spec.ts）
- ✅ 頁面載入和基本元素驗證
- ✅ 導航功能測試
- ✅ 產品和新聞區塊驗證
- ✅ 響應式設計測試
- ✅ 載入效能測試
- ✅ SEO 和可訪問性測試
- ✅ 錯誤處理測試

### 產品頁面測試（products.spec.ts）
- ✅ 產品列表載入和顯示
- ✅ 產品卡片內容驗證
- ✅ 搜尋功能測試
- ✅ 產品互動功能
- ✅ 響應式佈局測試
- ✅ 載入效能測試
- ✅ 錯誤狀況處理

### 認證功能測試（auth.spec.ts）
- ✅ 登入頁面基本功能
- ✅ 表單驗證測試
- ✅ 登入流程測試
- ✅ 響應式設計測試
- ✅ 頁面導航測試
- ✅ 安全性檢查
- ✅ 登入後狀態測試

## 🎯 測試最佳實踐

### Page Object Model（POM）
我們使用 Page Object Model 來組織測試程式碼：

```typescript
// 好的實踐
import { HomePage } from '../pages/HomePage'

test('首頁測試', async ({ page }) => {
  const homePage = new HomePage(page)
  await homePage.navigate()
  await homePage.waitForLoad()
  
  const pageElements = await homePage.verifyPageElements()
  expect(pageElements['主要區塊']).toBe(true)
})
```

### 使用測試資料
使用 `fixtures/test-data.ts` 中的測試資料：

```typescript
import { testUsers, testProducts } from '../fixtures/test-data'

// 使用預定義的測試使用者
await loginPage.login(testUsers.admin.email, testUsers.admin.password)
```

### 輔助函數
使用 `utils/test-helpers.ts` 中的輔助函數：

```typescript
import { waitForPageLoad, expectElementText } from '../utils/test-helpers'

await waitForPageLoad(page)
await expectElementText(page, '.title', '預期標題')
```

## 🔧 配置說明

### Playwright 配置（playwright.config.ts）
- 支援多瀏覽器（Chrome、Firefox、Safari）
- 響應式測試（桌面、平板、手機）
- 自動截圖和錄影（失敗時）
- 整合開發伺服器

### 重要設定
- **基礎 URL**: `http://localhost:3002`
- **超時設定**: 30秒
- **重試次數**: CI 環境 2次，本地 0次
- **並行執行**: 啟用

## 📊 測試報告

測試執行後會生成以下報告：
- **HTML 報告**: `tests/e2e/reports/index.html`
- **JSON 報告**: `tests/e2e/results.json`
- **JUnit 報告**: `tests/e2e/junit.xml`

## 🐛 故障排除

### 常見問題

#### 1. 瀏覽器未安裝
```bash
npx playwright install
```

#### 2. 測試超時
檢查網路連線和應用程式是否正在運行：
```bash
npm run dev  # 確保開發伺服器在運行
```

#### 3. 元素找不到
檢查選擇器是否正確，或者元素是否需要等待載入：
```typescript
await page.waitForSelector('.my-element', { timeout: 10000 })
```

#### 4. 測試不穩定
使用等待和重試機制：
```typescript
await expect(async () => {
  const element = page.locator('.dynamic-content')
  await expect(element).toBeVisible()
}).toPass({ timeout: 30000 })
```

### 除錯技巧

#### 1. 使用 UI 模式
```bash
npm run test:e2e:ui
```

#### 2. 使用除錯模式
```bash
npm run test:e2e:debug
```

#### 3. 檢視截圖和影片
失敗的測試會自動產生截圖和錄影，存在 `tests/e2e/results/` 目錄。

#### 4. 控制台日誌
```typescript
page.on('console', msg => console.log('頁面日誌:', msg.text()))
```

## 📝 撰寫新測試

### 1. 建立新的測試檔案
在 `tests/e2e/specs/` 目錄下建立新的 `.spec.ts` 檔案。

### 2. 建立對應的 Page Object
在 `tests/e2e/pages/` 目錄下建立對應的 Page Object 類別。

### 3. 使用測試範本
```typescript
import { test, expect } from '@playwright/test'
import { YourPage } from '../pages/YourPage'

test.describe('功能描述', () => {
  let yourPage: YourPage

  test.beforeEach(async ({ page }) => {
    yourPage = new YourPage(page)
    await yourPage.navigate()
    await yourPage.waitForLoad()
  })

  test('測試描述', async () => {
    // 測試步驟
    const result = await yourPage.someMethod()
    expect(result).toBe(true)
  })
})
```

## 🔄 持續整合

在 CI/CD 流程中執行測試：
```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run build
    npm run test:e2e
```

## 📚 相關資源

- [Playwright 官方文檔](https://playwright.dev/)
- [測試最佳實踐](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [測試選擇器](https://playwright.dev/docs/locators)