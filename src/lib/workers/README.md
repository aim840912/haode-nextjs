# Web Workers 模組

本目錄包含智慧上傳系統的 Web Workers：

## 檔案結構

- `upload-worker.ts` - 上傳處理 Worker
- `compression-worker.ts` - 圖片壓縮 Worker
- `thumbnail-worker.ts` - 縮圖生成 Worker

## 功能概述

### Upload Worker
- 背景檔案上傳處理
- 多檔案並行處理
- 進度回報機制

### Compression Worker
- 圖片壓縮處理
- 格式轉換
- 品質最佳化

### Thumbnail Worker
- 縮圖生成
- 多尺寸處理
- 批量操作

## 設計原則
- 非阻塞主執行緒
- 記憶體高效處理
- 錯誤隔離和恢復
- 進度追蹤和回報