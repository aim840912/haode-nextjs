# 智慧延遲上傳系統 - API 設計文檔

## 📋 概述

本文檔定義智慧延遲上傳系統的 API 介面設計，包括新增的 API 端點、請求/回應格式，以及與現有系統的整合方式。

## 🔄 API 演進策略

### 版本控制
所有新 API 使用版本前綴 `/api/v2/`，與現有 `/api/` 路由並存，確保向後相容性。

### 遷移路徑
1. **階段 1**: 新舊 API 並存
2. **階段 2**: 逐步遷移現有功能
3. **階段 3**: 標記舊 API 為 deprecated
4. **階段 4**: 移除舊 API（預計 6 個月後）

## 🚀 新增 API 端點

### 1. 圖片快取管理 API

#### `POST /api/v2/cache/images`
**功能**: 將圖片加入本地快取佇列

```typescript
// Request
interface CacheImageRequest {
  files: File[]
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'critical'
    autoUpload?: boolean
    compressionLevel?: number
    generateThumbnail?: boolean
  }
}

// Response
interface CacheImageResponse {
  success: boolean
  data: {
    cachedImages: CachedImageInfo[]
    stats: CacheStats
  }
  message: string
}

interface CachedImageInfo {
  id: string
  originalName: string
  size: number
  previewUrl: string
  thumbnailUrl?: string
  status: 'cached' | 'queued' | 'uploading'
  metadata: ImageMetadata
}
```

**範例**:
```bash
curl -X POST /api/v2/cache/images \
  -H "Content-Type: multipart/form-data" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "options={\"priority\":\"high\",\"autoUpload\":true}"
```

#### `GET /api/v2/cache/images/{cacheId}`
**功能**: 取得快取圖片資訊

```typescript
// Response
interface GetCachedImageResponse {
  success: boolean
  data: {
    image: CachedImageInfo
    uploadDecision: UploadDecisionInfo
  }
  message: string
}

interface UploadDecisionInfo {
  shouldUpload: boolean
  confidence: number
  reasoning: string[]
  suggestedDelay: number
  priority: Priority
}
```

#### `DELETE /api/v2/cache/images/{cacheId}`
**功能**: 從快取中移除圖片

```typescript
// Response
interface DeleteCachedImageResponse {
  success: boolean
  data: {
    deletedId: string
    freedSpace: number
  }
  message: string
}
```

#### `GET /api/v2/cache/stats`
**功能**: 取得快取統計資訊

```typescript
// Response
interface CacheStatsResponse {
  success: boolean
  data: {
    totalImages: number
    totalSize: number
    memoryUsage: number
    dbUsage: number
    hitRate: number
    cleanup: {
      lastRun: string
      nextRun: string
      cleanedCount: number
    }
  }
  message: string
}
```

### 2. 智慧上傳決策 API

#### `POST /api/v2/upload/decision`
**功能**: 取得上傳決策建議

```typescript
// Request
interface UploadDecisionRequest {
  cacheId: string
  context: {
    formId: string
    formCompleteness: number
    userBehavior?: UserBehaviorData
    networkInfo?: NetworkInfo
    systemLoad?: SystemLoadInfo
  }
}

// Response
interface UploadDecisionResponse {
  success: boolean
  data: {
    decision: UploadDecision
    alternatives: UploadDecision[]
    reasoning: DecisionReasoning
  }
  message: string
}

interface DecisionReasoning {
  scores: ScoreBreakdown
  factors: ReasoningFactor[]
  recommendation: string
}

interface ReasoningFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
  description: string
}
```

#### `POST /api/v2/upload/context/update`
**功能**: 更新上傳決策上下文

```typescript
// Request
interface UpdateContextRequest {
  sessionId: string
  updates: {
    formCompleteness?: number
    userActivity?: UserActivity
    networkChange?: NetworkInfo
  }
}

interface UserActivity {
  type: 'focus' | 'blur' | 'idle' | 'active'
  duration: number
  timestamp: number
}
```

### 3. 背景上傳佇列 API

#### `POST /api/v2/upload/queue`
**功能**: 將圖片加入上傳佇列

```typescript
// Request
interface QueueUploadRequest {
  cacheId: string
  destination: UploadDestination
  options?: {
    priority?: Priority
    maxRetries?: number
    timeout?: number
    immediate?: boolean
  }
}

// Response
interface QueueUploadResponse {
  success: boolean
  data: {
    taskId: string
    queuePosition: number
    estimatedStartTime: string
    estimatedCompletionTime: string
  }
  message: string
}
```

#### `GET /api/v2/upload/queue/status`
**功能**: 取得佇列狀態

```typescript
// Response
interface QueueStatusResponse {
  success: boolean
  data: {
    queue: {
      waiting: number
      active: number
      completed: number
      failed: number
    }
    activeUploads: ActiveUploadInfo[]
    systemLoad: SystemLoadInfo
  }
  message: string
}

interface ActiveUploadInfo {
  taskId: string
  fileName: string
  progress: UploadProgress
  startedAt: string
  estimatedCompletion: string
}
```

#### `GET /api/v2/upload/tasks/{taskId}`
**功能**: 取得特定上傳任務狀態

```typescript
// Response
interface UploadTaskResponse {
  success: boolean
  data: {
    task: UploadTaskInfo
    progress: UploadProgress
    logs: TaskLogEntry[]
  }
  message: string
}

interface UploadTaskInfo {
  id: string
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  startedAt?: string
  completedAt?: string
  retryCount: number
  error?: TaskError
}

interface TaskError {
  code: string
  message: string
  retryable: boolean
  nextRetryAt?: string
}

interface TaskLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
}
```

#### `DELETE /api/v2/upload/tasks/{taskId}`
**功能**: 取消上傳任務

#### `POST /api/v2/upload/tasks/{taskId}/retry`
**功能**: 手動重試失敗的任務

### 4. 批次上傳 API

#### `POST /api/v2/upload/batch`
**功能**: 批次提交多個圖片上傳

```typescript
// Request
interface BatchUploadRequest {
  cacheIds: string[]
  destination: UploadDestination
  options?: {
    concurrent?: number
    priority?: Priority
    failFast?: boolean
  }
}

// Response
interface BatchUploadResponse {
  success: boolean
  data: {
    batchId: string
    tasks: string[]
    summary: {
      queued: number
      estimated: {
        totalSize: number
        totalTime: number
        completionTime: string
      }
    }
  }
  message: string
}
```

#### `GET /api/v2/upload/batch/{batchId}`
**功能**: 取得批次上傳狀態

```typescript
// Response
interface BatchStatusResponse {
  success: boolean
  data: {
    batchId: string
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial'
    progress: {
      completed: number
      total: number
      percentage: number
      failed: number
    }
    tasks: BatchTaskSummary[]
    results: UploadResult[]
    errors: TaskError[]
  }
  message: string
}

interface BatchTaskSummary {
  taskId: string
  fileName: string
  status: TaskStatus
  progress: number
  url?: string
  error?: string
}
```

### 5. 系統監控 API

#### `GET /api/v2/system/health`
**功能**: 系統健康檢查

```typescript
// Response
interface SystemHealthResponse {
  success: boolean
  data: {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    components: {
      cache: ComponentHealth
      queue: ComponentHealth
      storage: ComponentHealth
      network: ComponentHealth
    }
    metrics: SystemMetrics
  }
  message: string
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded'
  latency: number
  errorRate: number
  lastCheck: string
}

interface SystemMetrics {
  upload: {
    successRate: number
    averageTime: number
    throughput: number
  }
  cache: {
    hitRate: number
    size: number
    evictions: number
  }
  queue: {
    length: number
    processingTime: number
    failureRate: number
  }
}
```

#### `GET /api/v2/system/metrics`
**功能**: 取得詳細系統指標

```typescript
// Query Parameters
interface MetricsQuery {
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d'
  granularity?: 'minute' | 'hour' | 'day'
  metrics?: string[]  // 指定要取得的指標
}

// Response
interface SystemMetricsResponse {
  success: boolean
  data: {
    timeRange: string
    dataPoints: MetricDataPoint[]
    aggregates: MetricAggregates
  }
  message: string
}

interface MetricDataPoint {
  timestamp: string
  upload: {
    count: number
    successCount: number
    failureCount: number
    averageTime: number
    totalSize: number
  }
  cache: {
    hits: number
    misses: number
    evictions: number
    size: number
  }
  queue: {
    added: number
    processed: number
    failed: number
    averageWaitTime: number
  }
}
```

### 6. 使用者偏好 API

#### `GET /api/v2/user/upload-preferences`
**功能**: 取得使用者上傳偏好設定

```typescript
// Response
interface UserUploadPreferencesResponse {
  success: boolean
  data: {
    preferences: {
      autoUpload: boolean
      compressionLevel: number
      maxFileSize: number
      preferredFormats: string[]
      networkOptimization: boolean
      backgroundUpload: boolean
    }
    behavior: {
      averageFormTime: number
      completionRate: number
      preferredUploadTime: string[]
    }
  }
  message: string
}
```

#### `PUT /api/v2/user/upload-preferences`
**功能**: 更新使用者上傳偏好

## 📡 WebSocket 即時通信

### 連線端點
`ws://localhost:3000/api/v2/ws/upload`

### 訊息格式
```typescript
interface WebSocketMessage {
  type: string
  id: string
  timestamp: string
  data: any
}

// 上傳進度更新
interface ProgressUpdate extends WebSocketMessage {
  type: 'upload:progress'
  data: {
    taskId: string
    progress: UploadProgress
    estimatedCompletion: string
  }
}

// 任務狀態變更
interface TaskStatusUpdate extends WebSocketMessage {
  type: 'task:status'
  data: {
    taskId: string
    oldStatus: TaskStatus
    newStatus: TaskStatus
    details?: any
  }
}

// 系統通知
interface SystemNotification extends WebSocketMessage {
  type: 'system:notification'
  data: {
    level: 'info' | 'warning' | 'error'
    title: string
    message: string
    actions?: NotificationAction[]
  }
}

interface NotificationAction {
  label: string
  action: string
  data?: any
}
```

### 客戶端訂閱
```typescript
// 訂閱特定任務
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'task',
  taskId: 'task-123'
}))

// 訂閱使用者所有任務
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'user',
  userId: 'user-456'
}))

// 訂閱系統通知
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'system'
}))
```

## 🔐 認證與授權

### API 金鑰認證
```http
Authorization: Bearer <jwt-token>
X-API-Key: <api-key>
```

### 權限檢查
```typescript
interface APIPermissions {
  upload: boolean
  cache: boolean
  queue: boolean
  system: boolean
  metrics: boolean
}

// 不同角色的權限
const ROLE_PERMISSIONS = {
  user: {
    upload: true,
    cache: true,
    queue: true,
    system: false,
    metrics: false
  },
  admin: {
    upload: true,
    cache: true,
    queue: true,
    system: true,
    metrics: true
  }
}
```

## ⚡ 速率限制

### 限制規則
```typescript
const RATE_LIMITS = {
  cache: {
    rpm: 100,      // 每分鐘100次快取操作
    burst: 20       // 突發請求上限
  },
  upload: {
    rpm: 50,        // 每分鐘50次上傳請求
    burst: 10,
    concurrent: 3   // 最多3個並行上傳
  },
  decision: {
    rpm: 200,       // 每分鐘200次決策查詢
    burst: 50
  },
  metrics: {
    rpm: 30,        // 每分鐘30次指標查詢
    burst: 5
  }
}
```

### 限制回應
```typescript
// 429 Too Many Requests
interface RateLimitResponse {
  success: false
  error: {
    code: 'RATE_LIMIT_EXCEEDED'
    message: string
    retryAfter: number      // 秒數
    limit: number
    remaining: number
    resetTime: string
  }
}
```

## 📝 錯誤處理

### 統一錯誤格式
```typescript
interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: any
    requestId: string
    timestamp: string
    documentation?: string
  }
}
```

### 錯誤代碼
```typescript
enum ErrorCodes {
  // 快取相關
  CACHE_FULL = 'CACHE_001',
  CACHE_INVALID = 'CACHE_002',
  CACHE_NOT_FOUND = 'CACHE_003',

  // 上傳相關
  UPLOAD_FAILED = 'UPLOAD_001',
  UPLOAD_TIMEOUT = 'UPLOAD_002',
  UPLOAD_TOO_LARGE = 'UPLOAD_003',
  UPLOAD_INVALID_FORMAT = 'UPLOAD_004',

  // 佇列相關
  QUEUE_FULL = 'QUEUE_001',
  TASK_NOT_FOUND = 'QUEUE_002',
  TASK_CANCELLED = 'QUEUE_003',

  // 系統相關
  SYSTEM_OVERLOAD = 'SYSTEM_001',
  SERVICE_UNAVAILABLE = 'SYSTEM_002',
  MAINTENANCE_MODE = 'SYSTEM_003',

  // 認證相關
  AUTH_REQUIRED = 'AUTH_001',
  AUTH_INVALID = 'AUTH_002',
  PERMISSION_DENIED = 'AUTH_003'
}
```

## 🧪 測試工具

### Postman Collection
提供完整的 Postman 集合，包含所有 API 端點的測試案例。

### OpenAPI 規格
```yaml
openapi: 3.0.3
info:
  title: Smart Delayed Upload API
  version: 2.0.0
  description: 智慧延遲上傳系統 API

paths:
  /api/v2/cache/images:
    post:
      summary: 快取圖片
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                files:
                  type: array
                  items:
                    type: string
                    format: binary
                options:
                  $ref: '#/components/schemas/CacheOptions'
      responses:
        '200':
          $ref: '#/components/responses/CacheImageResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '429':
          $ref: '#/components/responses/RateLimitError'
```

## 📋 遷移指南

### 現有 API 對照
```typescript
// 舊 API (deprecated)
POST /api/upload/images
GET /api/upload/images/{id}
DELETE /api/upload/images/{id}

// 新 API (推薦)
POST /api/v2/cache/images        // 先快取
POST /api/v2/upload/queue        // 再上傳
GET /api/v2/upload/tasks/{taskId}
DELETE /api/v2/upload/tasks/{taskId}
```

### 遷移步驟
1. **評估現有使用**: 分析舊 API 的使用量和模式
2. **並行實作**: 新舊 API 同時運行
3. **逐步遷移**: 按頁面或功能模組遷移
4. **監控指標**: 確保新 API 效能符合預期
5. **標記淘汰**: 在舊 API 回應中加入 deprecation 警告
6. **完全移除**: 6 個月後移除舊 API

---

*本 API 設計文檔將持續更新以反映最新的實作狀態*