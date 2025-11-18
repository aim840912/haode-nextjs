/**
 * AuthButton - 向後兼容匯出
 *
 * **重構說明**:
 * - 原始 395 行已拆分為模組化架構
 * - 實際實作已移至 ./auth-button/ 目錄
 * - 此檔案僅用於維持向後兼容性
 *
 * **模組架構**:
 * - icons.tsx - SVG 圖示（移除 6 個未使用圖示）
 * - types.ts - 型別定義
 * - useAuthButton.ts - 業務邏輯 Hook
 * - UserDropdownMenu.tsx - 下拉選單元件
 * - AuthButtonStates.tsx - 載入/初始/登入狀態元件
 * - index.tsx - 主元件（~100 行）
 */
export { AuthButton } from './auth-button'
export type { AuthButtonProps } from './auth-button/types'
