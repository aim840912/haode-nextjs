# 上傳系統模組

本目錄包含智慧上傳系統的核心上傳邏輯：

## 檔案結構

- `SmartUploadDecision.ts` - 智慧決策引擎
- `BackgroundUploadQueue.ts` - 背景上傳佇列系統
- `UploadStateManager.ts` - 上傳狀態管理器
- `UploadWorker.ts` - 上傳工作器

## 功能概述

### SmartUploadDecision
- 表單完成度評分算法
- 使用者行為分析
- 網路品質檢測
- 檔案大小評分邏輯
- 系統負載監控
- 加權評分系統

### BackgroundUploadQueue
- 優先權佇列系統
- 並行上傳控制 (最多3個)
- 智慧重試機制
- 指數退避策略
- 速率限制器
- 上傳進度追蹤

### 設計原則
- 條件式上傳決策
- 非阻塞背景處理
- 智慧重試和錯誤處理
- 頻寬自適應機制