# 存儲系統模組

本目錄包含圖片上傳系統的存儲相關功能。

## 檔案結構

- `BlobURLManager.ts` - Blob URL 生命週期管理

## 功能概述

### BlobURLManager
- 管理 Blob URL 的建立和釋放
- 防止記憶體洩漏
- 自動追蹤和清理未使用的 Blob URLs

## 設計原則
- 簡化架構，移除不必要的抽象層
- 專注於核心功能：Blob URL 管理
- 避免過度工程化