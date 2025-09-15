import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置檔案
 *
 * 此配置針對 Haude 專案的 E2E 測試進行最佳化：
 * - 支援多瀏覽器測試（Chrome、Firefox、Safari）
 * - 響應式設計測試（桌面、平板、手機）
 * - 失敗時自動截圖和錄影
 * - 整合 Next.js 開發伺服器
 */
export default defineConfig({
  // 測試目錄
  testDir: './tests/e2e/specs',

  // 測試結果輸出目錄
  outputDir: './tests/e2e/results',

  // 全域測試設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 報告設定
  reporter: [
    ['html', { outputFolder: './tests/e2e/reports' }],
    ['json', { outputFile: './tests/e2e/results.json' }],
    ['junit', { outputFile: './tests/e2e/junit.xml' }],
  ],

  // 全域使用設定
  use: {
    // 基礎 URL
    baseURL: 'http://localhost:3001',

    // 瀏覽器設定
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 等待設定
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // 其他設定
    ignoreHTTPSErrors: true,
  },

  // 測試專案配置（不同瀏覽器和裝置）
  projects: [
    // 桌面瀏覽器
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // 行動裝置
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // 平板裝置
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],

  // Web Server 設定（如果需要啟動開發伺服器）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 分鐘
  },

  // 測試逾時設定
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // 測試檔案模式
  testMatch: ['**/tests/e2e/specs/**/*.spec.ts', '**/tests/e2e/specs/**/*.test.ts'],

  // 忽略的檔案
  testIgnore: [
    '**/node_modules/**',
    '**/tests/e2e/pages/**',
    '**/tests/e2e/fixtures/**',
    '**/tests/e2e/utils/**',
  ],
})
