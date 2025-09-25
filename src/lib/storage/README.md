# 存儲系統模組

本目錄包含智慧上傳系統的存儲相關功能：

## 檔案結構

- `LocalImageCache.ts` - IndexedDB 本地圖片快取系統
- `CacheManager.ts` - 快取管理器，包含 LRU 清理策略
- `StorageEstimator.ts` - 存儲空間評估工具

## 功能概述

### LocalImageCache
- IndexedDB 初始化和管理
- 記憶體快取管理 (Memory Cache)
- 圖片元數據提取
- 預覽圖和縮圖生成
- LRU 清理策略

### 設計原則
- 優先使用 IndexedDB 進行持久化存儲
- 記憶體快取作為第二層快速存取
- 自動清理過期和超額數據
- 支援批量操作以提高性能