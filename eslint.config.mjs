import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'
import importPlugin from 'eslint-plugin-import'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      // 依賴和建置產物
      'node_modules/',
      '.next/',
      'out/',
      'dist/',
      'build/',
      // PWA 生成檔案
      'public/sw.js',
      'public/workbox-*.js',
      // 快取和臨時檔案
      '.cache/',
      '*.tsbuildinfo',
      '.turbo/',
      // Service Worker 生成檔案
      '**/sw.js',
      '**/workbox-*.js',
      // 測試覆蓋率
      'coverage/',
      '.nyc_output/',
      // IDE 和編輯器
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      // 作業系統生成檔案
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      // 範例和備份檔案
      'src/components/examples/**/*.tsx',
      'src/**/*.backup.*',
      'src/**/*.old.*',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // ES2022 globals
        Promise: 'readonly',
        // JSX global
        JSX: 'readonly',
      },
    },
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      // 將 any 類型從錯誤降級為警告
      '@typescript-eslint/no-explicit-any': 'warn',
      // Import order 規則
      // 忽略以 _ 開頭的未使用變數（符合慣例的有意未使用參數）
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js 內建模組
            'external', // npm 套件
            'internal', // 專案內部模組（@/ 開頭）
            'parent', // 父層相對路徑
            'sibling', // 同層相對路徑
            'index', // 當前目錄 index
            'type', // TypeScript type imports
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: 'next/**',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': 'warn',
      'import/no-duplicates': 'error',
    },
  },
  // Worker files configuration
  {
    files: ['src/lib/workers/**/*.ts'],
    languageOptions: {
      globals: {
        self: 'readonly',
        importScripts: 'readonly',
        addEventListener: 'readonly',
        postMessage: 'readonly',
      },
    },
    rules: {
      'no-restricted-globals': 'off',
    },
  },
  // Scripts folder configuration
  {
    files: ['scripts/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

export default eslintConfig
