import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    // 使用 happy-dom 模擬瀏覽器環境
    environment: 'happy-dom',

    // 全域測試設定檔
    setupFiles: ['./vitest.setup.ts'],

    // 測試覆蓋率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        'coverage/',
        '*.config.ts',
        '*.config.js',
        'scripts/',
        'public/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      // 目標覆蓋率
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },

    // 測試檔案匹配模式（只包含 .test.ts/tsx，.spec.ts 保留給 Playwright）
    include: ['**/*.test.{ts,tsx}'],

    // 排除檔案
    exclude: [
      'node_modules',
      '.next',
      'out',
      'dist',
      'build',
      'coverage',
      'playwright-report',
      'test-results',
      '**/e2e/**', // 排除 Playwright E2E 測試目錄
    ],

    // 全域變數（如 describe, it, expect）
    globals: true,

    // 測試超時時間（毫秒）
    testTimeout: 10000,

    // 並行執行測試
    threads: true,

    // 監看模式排除
    watchExclude: ['**/node_modules/**', '**/.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
