# API 文檔模板

此模板用於為所有 API 路由添加標準化的 JSDoc 文檔註解。

## 標準格式

### 基本結構

```typescript
/**
 * @api {HTTP方法} /api/路徑 API 名稱
 * @apiName API名稱（駝峰式命名）
 * @apiGroup API分組
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 詳細描述此 API 的功能和用途。
 * 可以包含多行說明。
 *
 * @apiPermission 權限等級
 *
 * @apiParam {類型} [參數名] 參數說明（方括號表示可選）
 * @apiParam {類型} 參數名 必填參數說明
 *
 * @apiQuery {類型} [查詢參數] 查詢字串參數說明
 *
 * @apiBody {類型} 欄位名 請求主體欄位說明
 *
 * @apiSuccess {類型} 欄位名 回應欄位說明
 *
 * @apiSuccessExample {json} 成功回應範例:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {...},
 *   "message": "操作成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 驗證錯誤
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 *
 * @apiErrorExample {json} 錯誤回應範例:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "驗證失敗",
 *   "code": "VALIDATION_ERROR"
 * }
 */
```

## 權限等級分類

- `public` - 公開 API，無需認證
- `user` - 需要使用者認證（withAuthAndError）
- `admin` - 需要管理員權限（withAdminAndError）
- `optionalAuth` - 可選認證（withOptionalAuthAndError）

## API 分組分類

### 產品相關
- `Products` - 產品管理
- `ProductImages` - 產品圖片管理
- `ProductCategories` - 產品分類

### 訂單相關
- `Orders` - 訂單管理
- `OrderItems` - 訂單項目

### 詢價相關
- `Inquiries` - 詢價管理
- `InquiryStats` - 詢價統計

### 內容管理
- `SiteSettings` - 網站設定
- `Schedule` - 行程管理

### 系統管理
- `Upload` - 檔案上傳
- `Admin` - 管理功能
- `Security` - 安全相關
- `Debug` - 除錯工具

### 其他
- `Locations` - 地點管理
- `Images` - 圖片管理

## 常用回應格式

### 成功回應（GET/PUT/DELETE）
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 成功回應（POST）
```json
{
  "success": true,
  "data": {},
  "message": "建立成功"
}
```

### 分頁回應
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "查詢成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": "錯誤訊息",
  "code": "ERROR_CODE",
  "details": {},
  "requestId": "uuid"
}
```

## 範例：完整的 API 文檔

### GET API 範例（需認證）

```typescript
/**
 * @api {GET} /api/orders 取得訂單列表
 * @apiName GetOrders
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得當前登入使用者的所有訂單列表，支援分頁查詢。
 *
 * @apiPermission user
 *
 * @apiQuery {Number} [page=1] 頁碼
 * @apiQuery {Number} [limit=20] 每頁筆數（最大 50）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 回應資料
 * @apiSuccess {Object[]} data.orders 訂單列表
 * @apiSuccess {String} data.orders.id 訂單 ID
 * @apiSuccess {String} data.orders.orderNumber 訂單編號
 * @apiSuccess {String} data.orders.status 訂單狀態
 * @apiSuccess {Number} data.orders.totalAmount 訂單總金額
 * @apiSuccess {Object} data.pagination 分頁資訊
 * @apiSuccess {Number} data.pagination.page 當前頁碼
 * @apiSuccess {Number} data.pagination.total 總筆數
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "orders": [
 *       {
 *         "id": "uuid",
 *         "orderNumber": "ORD-20250107-001",
 *         "status": "pending",
 *         "totalAmount": 1500
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 50,
 *       "totalPages": 3
 *     }
 *   },
 *   "message": "取得訂單列表成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 * @apiError (錯誤 5xx) {Object} DatabaseError 資料庫查詢失敗
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 401 Unauthorized
 * {
 *   "success": false,
 *   "error": "未授權訪問",
 *   "code": "UNAUTHORIZED"
 * }
 */
async function handleGET(req: NextRequest, user: User) {
  // ...實作
}

export const GET = withAuthAndError(handleGET, { module: 'OrdersAPI' })
```

### POST API 範例（需認證）

```typescript
/**
 * @api {POST} /api/orders 建立訂單
 * @apiName CreateOrder
 * @apiGroup Orders
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 建立新訂單，需要提供訂單項目和配送地址。
 * 系統會自動計算訂單總金額。
 *
 * @apiPermission user
 *
 * @apiBody {Object[]} items 訂單項目列表
 * @apiBody {String} items.productId 產品 ID
 * @apiBody {Number} items.quantity 數量
 * @apiBody {Object} shippingAddress 配送地址
 * @apiBody {String} shippingAddress.name 收件人姓名
 * @apiBody {String} shippingAddress.phone 收件人電話
 * @apiBody {String} shippingAddress.street 街道地址
 * @apiBody {String} shippingAddress.city 城市
 * @apiBody {String} [paymentMethod] 付款方式
 * @apiBody {String} [notes] 訂單備註
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 建立的訂單資料
 * @apiSuccess {String} data.id 訂單 ID
 * @apiSuccess {String} data.orderNumber 訂單編號
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 201 Created
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "orderNumber": "ORD-20250107-001"
 *   },
 *   "message": "訂單建立成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 資料驗證失敗
 * @apiError (錯誤 4xx) {Object} AuthorizationError 未登入或權限不足
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 400 Bad Request
 * {
 *   "success": false,
 *   "error": "訂單項目不能為空",
 *   "code": "VALIDATION_ERROR"
 * }
 */
async function handlePOST(req: NextRequest, user: User) {
  // ...實作
}

export const POST = withAuthAndError(handlePOST, { module: 'OrdersAPI' })
```

### GET API 範例（管理員權限）

```typescript
/**
 * @api {GET} /api/admin/products 取得所有產品（管理員）
 * @apiName GetAllProducts
 * @apiGroup Products
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得所有產品列表（包含未啟用的產品），僅限管理員使用。
 *
 * @apiPermission admin
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object[]} data 產品列表
 * @apiSuccess {String} data.id 產品 ID
 * @apiSuccess {String} data.name 產品名稱
 * @apiSuccess {Boolean} data.isActive 是否啟用
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "產品名稱",
 *       "isActive": true
 *     }
 *   ],
 *   "message": "產品載入成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 權限不足
 *
 * @apiErrorExample {json} 錯誤回應:
 * HTTP/1.1 403 Forbidden
 * {
 *   "success": false,
 *   "error": "需要管理員權限",
 *   "code": "FORBIDDEN"
 * }
 */
async function handleGET(request: NextRequest) {
  // ...實作
}

export const GET = withErrorHandler(handleGET, { module: 'AdminProductsAPI' })
```

### GET API 範例（公開/可選認證）

```typescript
/**
 * @api {GET} /api/site-settings 取得網站設定
 * @apiName GetSiteSettings
 * @apiGroup SiteSettings
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得網站設定，支援查詢單一或多個設定項目。
 * 此 API 為公開 API，無需認證即可訪問。
 *
 * @apiPermission optionalAuth
 *
 * @apiQuery {String} [key] 設定鍵名（查詢單一設定）
 * @apiQuery {String} [keys] 設定鍵名列表，逗號分隔（查詢多個設定）
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object|Object[]} data 設定資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應（單一設定）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "key": "site_name",
 *     "value": "我的網站",
 *     "type": "string"
 *   },
 *   "message": "設定取得成功"
 * }
 *
 * @apiSuccessExample {json} 成功回應（所有設定）:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": [
 *     { "key": "site_name", "value": "我的網站" },
 *     { "key": "site_description", "value": "描述" }
 *   ],
 *   "message": "所有設定取得成功"
 * }
 */
async function handleGET(req: NextRequest, _user: User | null) {
  // ...實作
}

export const GET = withOptionalAuthAndError(handleGET, { module: 'SiteSettingsAPI' })
```

## 注意事項

1. **一致性**：所有 API 文檔必須遵循相同的格式
2. **完整性**：包含所有必要的參數、回應和錯誤說明
3. **範例**：提供真實可用的請求和回應範例
4. **中文**：所有描述使用繁體中文
5. **版本**：當前版本統一使用 1.0.0
6. **權限**：清楚標示每個 API 的權限要求
7. **錯誤**：列出所有可能的錯誤情況

## 快速參考

### HTTP 方法對應
- `GET` - 查詢資料
- `POST` - 建立資料
- `PUT` - 更新資料
- `DELETE` - 刪除資料
- `PATCH` - 部分更新

### 常見錯誤代碼
- `VALIDATION_ERROR` - 資料驗證失敗（400）
- `UNAUTHORIZED` - 未授權（401）
- `FORBIDDEN` - 權限不足（403）
- `NOT_FOUND` - 資源不存在（404）
- `METHOD_NOT_ALLOWED` - HTTP 方法不支援（405）
- `DATABASE_ERROR` - 資料庫錯誤（500）
- `INTERNAL_SERVER_ERROR` - 內部伺服器錯誤（500）

### 中間件對應權限
- `withAuthAndError` → `@apiPermission user`
- `withAdminAndError` → `@apiPermission admin`
- `withOptionalAuthAndError` → `@apiPermission optionalAuth`
- `withErrorHandler` (無認證) → `@apiPermission public`
