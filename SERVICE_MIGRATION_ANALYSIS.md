# 服務層架構統一 - 遷移分析報告

> 生成日期：2025-01-14
> 目的：分析現有服務使用情況，制定 v2 架構遷移計劃

## 📊 API 路由服務使用統計

### 高頻使用服務（需優先遷移）

1. **orderService** (使用次數: 4)
   - `/api/orders/route.ts`
   - `/api/orders/[id]/route.ts`
   - `/api/admin/orders/route.ts`
   - `/api/admin/orders/[id]/route.ts`
   - **狀態**: 直接服務，需遷移到 v2

2. **newsServiceAdapter** (使用次數: 3)
   - `/api/news/route.ts`
   - `/api/news/[id]/route.ts`
   - **狀態**: 適配器模式，已有 v2 版本 (`newsServiceSimple`)

3. **inquiryServiceV2** (使用次數: 3)
   - `/api/v1/inquiries/route.ts`
   - `/api/v1/inquiries/[id]/route.ts`
   - `/api/v1/inquiries/stats/route.ts`
   - **狀態**: 已使用 v2 架構 ✅

4. **AuditLogger** (使用次數: 3)
   - 審計日誌相關 API
   - **狀態**: 獨立服務，暫不遷移

### 中頻使用服務（第二批遷移）

1. **productServiceAdapter** (使用次數: 2)
   - `/api/products/route.ts`
   - `/api/admin/products/route.ts`
   - **狀態**: 適配器模式，已有 v2 版本 (`productService`)

2. **locationServiceAdapter** (使用次數: 2)
   - `/api/locations/route.ts`
   - `/api/locations/[id]/route.ts`
   - **狀態**: 適配器模式，已有 v2 版本 (`locationServiceSimple`)

3. **inquiryServiceAdapter** (使用次數: 2)
   - `/api/inquiries/route.ts`
   - `/api/inquiries/[id]/route.ts`
   - **狀態**: 適配器模式，已有 v2 版本 (`inquiryService`)

### ServiceFactory 使用分析

**使用 ServiceFactory 的 API**:
- `getProductService` (2次)
- `getCultureService` (2次)
- `getFarmTourService` (1次)
- `getScheduleService` (1次)

**問題**: ServiceFactory 目前管理多種服務實例，增加複雜度

## 🎯 遷移優先級規劃

### 第一批：高頻核心服務
1. **產品服務** (`productServiceAdapter` → `v2/productService`)
2. **新聞服務** (`newsServiceAdapter` → `v2/newsServiceSimple`)
3. **位置服務** (`locationServiceAdapter` → `v2/locationServiceSimple`)

### 第二批：詢問和訂單服務
1. **詢問服務統一** (合併 `inquiryServiceAdapter` 和 `inquiryServiceV2`)
2. **訂單服務** (`orderService` → 新建 `v2/orderService`)

### 第三批：其他服務
1. **文化服務** (ServiceFactory → `v2/cultureServiceSimple`)
2. **農場參觀服務** (ServiceFactory → `v2/farmTourServiceSimple`)
3. **排程服務** (`scheduleServiceAdapter` → `v2/scheduleServiceSimple`)

## 🔄 遷移策略

### 漸進式遷移步驟
1. **保留適配器作為橋接** - 暫時保留適配器，內部調用 v2 服務
2. **更新 API 路由 import** - 直接使用 v2 服務
3. **移除適配器** - 確認穩定後移除舊適配器
4. **簡化 ServiceFactory** - 只管理必要的服務實例

### 風險控制
- ✅ 保持 API 回應格式一致
- ✅ 每次遷移一個服務
- ✅ 完整測試後再進入下個服務
- ✅ 保留回滾機制

## 📋 具體執行計劃

### 階段 1: 產品服務遷移
- 更新 `/api/products/route.ts`
- 更新 `/api/admin/products/route.ts`
- 移除 `productServiceAdapter` 依賴

### 階段 2: 新聞和位置服務
- 更新相關 API 路由
- 移除對應適配器

### 階段 3: ServiceFactory 重構
- 簡化工廠邏輯
- 只保留必要的服務創建

預計完成時間：3-5 個工作日