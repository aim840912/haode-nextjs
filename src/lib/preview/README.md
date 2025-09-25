# 預覽系統模組

本目錄包含智慧上傳系統的預覽功能：

## 檔案結構

- `ImagePreviewService.ts` - 圖片預覽服務
- `PreviewGenerator.ts` - 預覽圖生成器
- `ThumbnailGenerator.ts` - 縮圖生成器

## 功能概述

### ImagePreviewService
- 多種預覽尺寸生成
- WebP 格式轉換
- Blob URL 管理機制
- 預覽品質自動調整

### 支援格式
- 原生圖片格式 (JPEG, PNG, GIF, WebP)
- 自動格式轉換和優化
- 響應式預覽尺寸

### 設計原則
- 即時預覽生成
- 記憶體效率管理
- 品質與大小平衡
- 自動垃圾回收 (Blob URLs)