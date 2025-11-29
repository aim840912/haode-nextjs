# 專案架構簡化重構計劃

> 建立日期：2025-01-29
> 更新日期：2025-11-29
> 預估總工時：35-50 小時

## 執行狀態摘要

| 階段 | 狀態 | 成果 |
|------|------|------|
| 1. 清理未使用功能 | ✅ 完成 | 刪除 test-toast, diagnosis, dev-notes 等 |
| 2. 替換 FullCalendar | ✅ 完成 | 移除 7 個套件，改用 react-calendar |
| 3. 替換 @dnd-kit | ✅ 完成 | 移除 4 個套件，改用按鈕排序 |
| 4. 簡化快取系統 | ✅ 完成 | 刪除未使用的 cache-keys.ts、api-cache-middleware.ts |
| 5. 簡化監控系統 | ✅ 評估完成 | 核心功能保留，發現模擬資料問題 |
| 6. 簡化 Hooks | ✅ 部分完成 | 移除 3 個未使用 hooks (~877 行) |
| 7. API 客戶端遷移 | ✅ 完成 | 建立 4 個 Server Actions (products, locations, farm-tour, site-settings) |
| 8. 移除 'use client' | ✅ 完成 | 審查 161 個檔案，移除 1 個不必要的 'use client' |

### 已實現的減少量

- **套件移除**: 11 個（7 FullCalendar + 4 @dnd-kit）
- **程式碼減少**: ~2,200+ 行
- **快取系統**: 1,633 行 → 1,384 行（-15%）
- **Hooks**: 8,344 行 → 7,467 行（-10%）
- **Server Actions**: 建立 4 個新 Actions（products, locations, farm-tour, site-settings）
- **'use client' 審查**: 161 個檔案審查完成，移除 1 個不必要的標記

---

## 概述

本計劃旨在透過**漸進式重構**簡化專案中過度工程化的架構，分 8 個階段執行。

### 用戶確認的決策

| 項目 | 決策 | 影響 |
|------|------|------|
| 簡化範圍 | 全面重構 | 包含 API 層、快取、Hooks 等全面簡化 |
| 開發筆記 | 沒在使用 | 直接刪除，含資料庫表 |
| FullCalendar | 只需簡單查看 | 改用輕量日曆元件 (react-calendar) |
| @dnd-kit | 可以簡化 | 改用上下箭頭按鈕排序 |

---

## 預期效益

| 領域 | 當前 | 目標 | 減少 |
|------|------|------|------|
| API 客戶端代碼 | 2,971 行 | ~500 行 | 83% |
| 快取系統 | 1,633 行 (10 檔案) | ~400 行 (3 檔案) | 75% |
| 監控系統 | 953 行 | ~300 行 | 68% |
| Hooks 數量 | 60+ 個 | ~30 個 | 50% |
| Bundle 大小 | - | 減少 ~600-800KB | - |
| 移除依賴 | - | 10 個套件 | - |

---

## 實施順序總覽

```
階段    風險    時間      內容                      依賴
────────────────────────────────────────────────────────
1       低     2-3h     清理未使用功能             無
2       中     4-6h     替換 FullCalendar          無
3       中     3-4h     替換 @dnd-kit              無
4       中     4-6h     簡化快取系統               無
5       低     2-3h     簡化監控系統               無
6       中     6-8h     整合重複 Hooks             無
7       高     10-15h   API 客戶端遷移             6 完成後
8       低     3-4h     移除 'use client'          7 完成後
────────────────────────────────────────────────────────
總計           35-50h
```

**建議**：階段 1-5 可並行開發（不同人員），階段 6-8 需依序執行。

---

## 階段 1：清理未使用功能 [低風險]

**預估時間**: 2-3 小時
**獨立 PR**: 是

### 1.1 刪除頁面和相關檔案

```
刪除清單：
src/app/test-toast/page.tsx
src/app/diagnosis/page.tsx
src/app/admin/dev-notes/page.tsx
src/app/api/admin/dev-notes/route.ts
src/app/api/admin/dev-notes/[id]/route.ts
src/app/api/admin/dev-notes/stats/route.ts
src/hooks/useDevNotesReducer.ts
src/types/devNote.ts
```

### 1.2 ~~移除未使用依賴~~ [已取消]

> ⚠️ **發現 `browser-image-compression` 實際上有在使用**
>
> 這個套件被 `compressImage` 函數使用，該函數被產品圖片上傳功能調用。
> **不能移除此依賴**，否則圖片上傳會壞掉。
>
> 使用位置：
> - `src/lib/utils/image-utils.ts:142`
> - `src/hooks/useImageUpload.ts:147`
> - `src/components/features/products/ImageUploader/useImageUpload.ts:110`

### 1.3 清理資料庫

```sql
-- 備份後刪除 dev_notes 表
DROP TABLE IF EXISTS dev_notes;
```

### 1.4 驗證

```bash
grep -r "test-toast\|diagnosis\|dev-notes\|DevNote" src/
npm run type-check && npm run build
```

---

## 階段 2：替換 FullCalendar [中等風險]

**預估時間**: 4-6 小時
**獨立 PR**: 是

### 2.1 安裝替代庫

```bash
npm install react-calendar
npm uninstall @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/list @fullcalendar/react @fullcalendar/timegrid
```

### 2.2 需要修改的檔案

```
src/components/features/calendar/farm-tour-calendar/index.tsx
src/components/features/calendar/schedule-calendar/CalendarView.tsx
src/hooks/useFarmTourCalendar.ts
src/hooks/useScheduleCalendar.ts
```

### 2.3 建立簡單日曆元件

新建 `src/components/ui/calendar/SimpleCalendar.tsx`，提供：
- 月曆視圖
- 日期點擊事件
- 事件標記顯示

### 2.4 驗證

```bash
npm run build
npm run analyze  # 確認 Bundle 減少
# 手動測試 /admin/schedule 和 /admin/farm-tour/calendar
```

---

## 階段 3：替換 @dnd-kit [中等風險]

**預估時間**: 3-4 小時
**獨立 PR**: 是

### 3.1 移除依賴

```bash
npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3.2 需要修改的檔案

```
src/components/ui/image/sortable-image-gallery/SortableImageGallery.tsx
src/hooks/useSiteSettingsReducer.ts
```

### 3.3 實作按鈕排序替代方案

將拖拽排序改為上下箭頭按鈕：
- 每張圖片旁顯示「上移」「下移」按鈕
- 使用 array move 邏輯處理排序

### 3.4 驗證

```bash
npm run build
# 手動測試產品圖片編輯頁面
```

---

## 階段 4：簡化快取系統 [中等風險]

**預估時間**: 4-6 小時
**獨立 PR**: 是

### 4.1 目標結構

```
src/lib/cache/
├── index.ts              # 統一導出
├── cache-manager.ts      # 核心邏輯 (get/set/delete/invalidate)
├── cache-keys.ts         # 快取鍵定義（簡化版）
└── cache.types.ts        # 類型定義
```

### 4.2 刪除檔案

```
src/lib/cache/cache-advanced.ts       # 預熱/背景刷新（無服務器不適用）
src/lib/cache/cache-metrics.ts        # 詳細指標（Sentry 足夠）
src/lib/cache/cache-stats-helpers.ts  # 統計輔助
src/lib/cache/cache-storage.ts        # 多餘的儲存層抽象
```

### 4.3 簡化後的快取 API

```typescript
// src/lib/cache/cache-manager.ts
export const cache = {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }): Promise<void>
  delete(key: string): Promise<void>
  invalidateByTags(tags: string[]): Promise<void>
}
```

### 4.4 驗證

```bash
grep -r "UnifiedCacheManager\|from.*cache" src/
npm run type-check && npm run build
# 測試產品搜尋等使用快取的 API
```

---

## 階段 5：簡化監控系統 [低風險]

**預估時間**: 2-3 小時
**獨立 PR**: 是

### 5.1 保留功能

- `rate-limit.ts` - 限流核心（保留）
- `audit.ts` - 審計統計（保留）

### 5.2 簡化/移除

- `kpi.ts` - 移除基準比較和健康分數計算，僅保留原始數據收集

### 5.3 驗證

```bash
npm run type-check && npm run build
# 檢查 /admin/monitoring 頁面
```

---

## 階段 6：簡化/移除過度複雜的 Hooks [中等風險]

**預估時間**: 6-8 小時
**獨立 PR**: 是

### 6.1 問題分析

這些 hooks 本身就超過建議的 200 行限制，不應該「合併」而應該「簡化或移除」：

| Hook | 行數 | 建議 |
|------|------|------|
| useInquiryStats | 282 行 | 用 Server Action + useTransition 替代 (~30 行) |
| useInquiryStatsFetcher | 253 行 | 移除（功能重複） |
| useInquiryStatsCache | 233 行 | 移除（Server Action 可處理） |
| usePollingManager | 314 行 | 用簡單的 setInterval + visibilitychange 替代 (~40 行) |
| useRetryManager | 369 行 | 移除（Server Actions 自帶重試） |
| useLoadingManager | 181 行 | 用 useTransition 替代 |
| useLoadingState | 276 行 | 用 useTransition 替代 |
| useErrorTracking | 279 行 | 移除（Sentry 已處理） |

### 6.2 簡化策略

**不是合併，而是用更簡單的方式重寫：**

```typescript
// 替代 768 行的 inquiry stats hooks
// 新版本只需要 ~50 行
'use client'

import { useTransition, useEffect, useState, useCallback } from 'react'
import { fetchInquiryStats } from '@/app/actions/admin/stats'

export function useInquiryStats(options?: { refreshInterval?: number }) {
  const { refreshInterval = 120000 } = options ?? {}
  const [stats, setStats] = useState<InquiryStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(() => {
    startTransition(async () => {
      const result = await fetchInquiryStats()
      if (result.success) setStats(result.data)
      else setError(result.error.message)
    })
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, refreshInterval)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh, refreshInterval])

  return { stats, loading: isPending, error, refresh }
}
```

### 6.3 移除清單

```
完全移除：
src/hooks/useInquiryStatsFetcher.ts  (253 行)
src/hooks/useInquiryStatsCache.ts    (233 行)
src/hooks/usePollingManager.ts       (314 行)
src/hooks/useRetryManager.ts         (369 行)
src/hooks/useLoadingManager.ts       (181 行)
src/hooks/useErrorTracking.ts        (279 行)

重寫簡化：
src/hooks/useInquiryStats.ts         (282 行 → ~50 行)
src/hooks/useLoadingState.ts         (276 行 → 移除，用 useTransition)
```

**預計減少**: ~2,100 行 → ~50 行 (97% 減少)

### 6.3 驗證

```bash
npm run type-check && npm run build
# 測試管理後台各頁面功能
```

---

## 階段 7：API 客戶端遷移至 Server Actions [高風險]

**預估時間**: 10-15 小時（分批進行）
**獨立 PR**: 每個子階段一個 PR

### 7.1 遷移優先級

| 優先級 | API 檔案 | 複雜度 |
|--------|----------|--------|
| 1 | products-api.ts | 中 |
| 2 | inquiries-api.ts | 高（已有部分 Server Actions） |
| 3 | farm-tour-api.ts | 低 |
| 4 | orders-api.ts | 高 |
| 5 | locations-api.ts, schedule-api.ts | 低 |
| 6 | 其他 | 各異 |

### 7.2 單一 API 遷移流程

1. 在 `src/app/actions/` 創建對應的 Server Actions
2. 更新元件調用（使用 useTransition）
3. 測試功能完整性
4. 移除舊 API 客戶端檔案

### 7.3 保留的 API Routes

```
src/app/api/auth/          # 認證相關
src/app/api/webhooks/      # Webhook 回調
src/app/api/payment/       # 支付回調
```

### 7.4 驗證

```bash
npm run type-check && npm run build
# 全面測試各功能流程
```

---

## 階段 8（可選）：移除不必要的 'use client' [低風險]

**預估時間**: 3-4 小時
**獨立 PR**: 是

### 8.1 審查標準

移除 'use client' 的條件：
- 不使用 useState、useEffect 等 hooks
- 不使用事件處理器
- 不使用瀏覽器 API

### 8.2 估計影響

當前 172 個標記，預計 30-40% 可移除

---

## 關鍵檔案清單

實作時需要特別注意的檔案：

| 檔案 | 階段 | 用途 |
|------|------|------|
| `src/lib/cache/unified-cache-manager.ts` | 4 | 快取系統核心 |
| `src/components/features/calendar/farm-tour-calendar/index.tsx` | 2 | FullCalendar 主要使用位置 |
| `src/components/ui/image/sortable-image-gallery/SortableImageGallery.tsx` | 3 | @dnd-kit 主要使用位置 |
| `src/app/actions/inquiries.ts` | 7 | Server Actions 範本 |
| `src/hooks/useInquiryStats.ts` | 6 | Hooks 合併參考 |
| `src/lib/api/products-api.ts` | 7 | API 遷移參考 |

---

## 回滾策略

每個階段都是獨立 PR，可單獨回滾：

```bash
# 回滾特定 PR
git revert <commit-hash>

# 快取系統：如果簡化後效能下降
# 可以暫時恢復 cache-advanced.ts

# FullCalendar：保留替代元件的 props 兼容
# 必要時可快速切換回 FullCalendar
```

---

## 過度工程化問題清單（參考）

本計劃解決的主要問題：

### API 客戶端 5 層堆疊
```
useApiCall Hook
  ↓
apiClient (api-client.ts)
  ↓
executeWithRetry (api-retry.ts)
  ↓
prepareHeadersCore (api-headers.ts)
  ↓
fetch()
```

### 快取系統過度分層
```
src/lib/cache/
├── cache-advanced.ts       # 進階功能（未使用）
├── cache-invalidation.ts   # 失效管理
├── cache-keys.ts          # 快取鍵常數
├── cache-metrics.ts       # 指標收集（過度）
├── cache-stats-helpers.ts # 統計輔助（過度）
├── cache-storage.ts       # 儲存層
├── cache-types.ts         # 類型定義
├── cache-utils.ts         # 工具函數
└── unified-cache-manager.ts # 統一管理器
```

### 重複的 Hooks
- `useInquiryStats`, `useInquiryStatsFetcher`, `useInquiryStatsCache` 做同一件事
- `useLoadingState`, `useLoadingManager` 功能重複

### 未使用的功能
- `/test-toast` - 開發測試頁
- `/admin/dev-notes` - 與 GitHub Issues 重複
- `/diagnosis` - 可由 Sentry 替代
