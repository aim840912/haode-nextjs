# API 文檔索引

> **完成狀態**: ✅ 100% (65/65 個 API 路由已完整文檔化)
> **最後更新**: 2025-01-07
> **文檔標準**: 全部使用繁體中文，遵循 JSDoc 標準格式

## 📊 統計摘要

- **總 API 路由檔案**: 65 個
- **已文檔化**: 65 個 (100%)
- **總 API 端點數**: 約 101+ 個
- **文檔總行數**: 約 3500+ 行

## 📚 API 分組目錄

### 🛒 產品管理 (Products)
- `GET /api/products` - 取得產品列表（公開）
- `POST /api/products` - 建立產品（管理員）
- `GET /api/products/categories` - 取得產品分類
- `GET /api/products/check-name` - 檢查產品名稱是否重複
- `GET /api/products/check-sku` - 檢查 SKU 是否重複
- `GET /api/products/:id` - 取得產品詳情
- `PUT /api/products/:id` - 更新產品（管理員）
- `DELETE /api/products/:id` - 刪除產品（管理員）
- `GET /api/products/:id/images` - 取得產品圖片列表

### 📦 訂單管理 (Orders)
- `GET /api/orders` - 取得使用者訂單列表（分頁）
- `POST /api/orders` - 建立訂單
- `GET /api/orders/:id` - 取得訂單詳情
- `PATCH /api/orders/:id` - 取消訂單

### 💬 詢價管理 (Inquiries)
- `GET /api/inquiries` - 取得詢價單列表
- `POST /api/inquiries` - 建立詢價單
- `GET /api/inquiries/:id` - 取得詢價單詳情
- `PUT /api/inquiries/:id` - 更新詢價單
- `DELETE /api/inquiries/:id` - 刪除詢價單
- `PATCH /api/inquiries/:id` - 更新詢價狀態
- `GET /api/inquiries/stats` - 取得詢價統計

### 📍 地點管理 (Locations)
- `GET /api/locations` - 取得地點列表
- `POST /api/locations` - 建立地點
- `GET /api/locations/:id` - 取得地點詳情
- `PUT /api/locations/:id` - 更新地點
- `DELETE /api/locations/:id` - 刪除地點

### 🚜 農場體驗 (Farm Tour)
- `GET /api/farm-tour` - 取得農場體驗活動列表
- `POST /api/farm-tour` - 建立農場體驗活動
- `GET /api/farm-tour/:id` - 取得活動詳情
- `PUT /api/farm-tour/:id` - 更新活動
- `DELETE /api/farm-tour/:id` - 刪除活動
- `GET /api/farm-tour/calendar` - 取得行事曆格式資料
- `POST /api/farm-tour/inquiry` - 建立活動預約詢問

### 📅 行程管理 (Schedule)
- `GET /api/schedule` - 取得擺攤行程列表
- `POST /api/schedule` - 建立擺攤行程
- `GET /api/schedule/:id` - 取得行程詳情
- `PUT /api/schedule/:id` - 更新行程
- `DELETE /api/schedule/:id` - 刪除行程
- `GET /api/schedule/calendar` - 取得行事曆格式

### ⚙️ 網站設定 (Site Settings)
- `GET /api/site-settings` - 取得網站設定（可選認證）
- `POST /api/site-settings` - 建立設定（管理員）
- `PUT /api/site-settings` - 更新設定（管理員）
- `DELETE /api/site-settings` - 刪除設定（管理員）
- `POST /api/site-settings/upload-image` - 上傳設定圖片（管理員）

### 🔍 搜尋功能 (Search)
- `GET /api/search` - 搜尋產品
- `GET /api/search/stats` - 取得搜尋統計
- `GET /api/search/suggestions` - 取得搜尋建議（自動完成）

### 📤 檔案上傳 (Upload)
- `POST /api/upload/unified` - 上傳圖片
- `GET /api/upload/unified` - 查詢圖片列表
- `PUT /api/upload/unified` - 更新圖片資訊或重新排序
- `DELETE /api/upload/unified` - 刪除圖片

### 🔐 認證相關 (Authentication)
- `GET /api/auth/check-phone` - 檢查手機號碼是否已註冊
- `POST /api/auth/forgot-password` - 發送密碼重設郵件
- `GET /api/auth/phone-to-email` - 根據手機號碼查詢電子郵件
- `POST /api/auth/update-password` - 更新使用者密碼

### ❤️ 使用者興趣 (User Interests)
- `GET /api/user/interests` - 取得使用者興趣清單
- `POST /api/user/interests` - 新增興趣
- `DELETE /api/user/interests` - 移除興趣
- `POST /api/user/interests/sync` - 同步本地興趣清單
- `POST /api/user/interests/toggle` - 切換興趣狀態

### 📝 審計日誌 (Audit Logs)
- `GET /api/audit-logs` - 取得審計日誌列表（支援多種篩選）
- `GET /api/audit-logs/:id` - 取得單個審計日誌詳情
- `DELETE /api/audit-logs/:id` - 刪除單個審計日誌
- `POST /api/audit-logs/batch` - 批量操作審計日誌
- `GET /api/audit-logs/stats` - 取得審計日誌統計

### 🔧 系統工具 (System)
- `GET /api/cache-status` - 查詢快取狀態
- `POST /api/cache-status` - 執行快取管理操作
- `GET /api/csrf-token` - 生成 CSRF token
- `POST /api/csrf-token` - 驗證 CSRF token
- `DELETE /api/csrf-token` - 清除 CSRF token
- `GET /api/data-strategy` - 取得資料策略資訊
- `GET /api/metrics` - 取得系統指標和健康狀況
- `POST /api/reset-service` - 重置服務實例（管理員）

### 🐛 除錯工具 (Debug)
- `GET /api/debug/auth-status` - 取得認證狀態資訊
- `POST /api/debug/auth-status` - 觸發認證狀態除錯
- `GET /api/debug/clear-cache` - 查詢快取清除資訊
- `POST /api/debug/clear-cache` - 執行快取清除操作

### 🔒 安全相關 (Security)
- `POST /api/security/csp-report` - 接收 CSP 違規報告

### 👨‍💼 管理員 - 產品 (Admin Products)
- `GET /api/admin/products` - 取得所有產品（包含未啟用）
- `POST /api/admin/products` - 建立產品
- `PUT /api/admin/products` - 更新產品
- `DELETE /api/admin/products` - 刪除產品
- `POST /api/admin/products/create-with-images` - 建立產品（含多張圖片）

### 👨‍💼 管理員 - 地點 (Admin Locations)
- `GET /api/admin/locations` - 取得所有地點
- `POST /api/admin/locations` - 建立地點
- `PUT /api/admin/locations` - 更新地點
- `DELETE /api/admin/locations` - 刪除地點
- `POST /api/admin/locations/create-with-images` - 建立門市（含圖片）

### 👨‍💼 管理員 - 農場體驗 (Admin Farm Tour)
- `DELETE /api/admin/farm-tour/:id` - 刪除農場體驗活動
- `POST /api/admin/farm-tour/create-with-images` - 建立活動（含圖片）

### 👨‍💼 管理員 - 訂單 (Admin Orders)
- `GET /api/admin/orders` - 取得所有訂單
- `GET /api/admin/orders/:id` - 取得訂單詳情
- `PATCH /api/admin/orders/:id` - 更新訂單狀態

### 👨‍💼 管理員 - 詢價 (Admin Inquiries)
- `POST /api/admin/inquiries/fix-prices` - 修復詢價單價格

### 👨‍💼 管理員 - 開發備忘錄 (Admin Dev Notes)
- `GET /api/admin/dev-notes` - 取得開發備忘錄列表
- `POST /api/admin/dev-notes` - 建立開發備忘錄
- `GET /api/admin/dev-notes/:id` - 取得備忘錄詳情
- `PATCH /api/admin/dev-notes/:id` - 更新備忘錄
- `DELETE /api/admin/dev-notes/:id` - 刪除備忘錄
- `GET /api/admin/dev-notes/stats` - 取得備忘錄統計

### 👨‍💼 管理員 - 系統監控 (Admin Monitoring)
- `GET /api/admin/connection-pool` - 取得連線池狀態
- `POST /api/admin/connection-pool` - 執行連線池管理操作
- `GET /api/admin/pool-status` - 取得連線池健康狀態
- `GET /api/admin/error-stats` - 取得錯誤統計資訊
- `GET /api/admin/rate-limit-stats` - 取得 Rate Limiting 統計
- `GET /api/admin/kpi-report` - 取得 KPI 報告

### 👨‍💼 管理員 - 代理 API (Admin Proxy)
- `GET/POST/PUT/DELETE /api/admin-proxy/products` - 產品代理 API
- `GET/POST/PUT/DELETE /api/admin-proxy/locations` - 地點代理 API
- `DELETE /api/admin-proxy/farm-tour/:id` - 農場體驗代理 API

## 🏷️ 權限分類

### 公開 API (Public) - 無需認證
- 產品列表、產品詳情、產品分類
- 產品名稱/SKU 檢查
- 網站設定查詢
- 搜尋功能（搜尋、統計、建議）
- 資料策略資訊
- CSRF Token 生成

### 使用者 API (User) - 需要登入
- 訂單管理（查詢、建立、取消）
- 詢價管理（查詢、建立、更新）
- 圖片上傳管理
- 使用者興趣管理
- 農場體驗預約
- 密碼更新

### 管理員 API (Admin) - 需要管理員權限
- 產品 CRUD（含圖片）
- 地點 CRUD（含圖片）
- 農場體驗 CRUD（含圖片）
- 訂單管理
- 詢價管理進階功能
- 網站設定管理
- 審計日誌查詢
- 系統監控和管理
- 開發備忘錄管理
- 連線池管理
- 錯誤統計和 KPI 報告

### 可選認證 API (Optional Auth)
- 網站設定查詢（登入後可能獲得更多資訊）

## 📖 文檔標準

所有 API 文檔都包含以下內容：

- ✅ **@api** - HTTP 方法、路徑、API 名稱
- ✅ **@apiName** - API 唯一識別名稱（駝峰式）
- ✅ **@apiGroup** - API 分組
- ✅ **@apiVersion** - API 版本（統一 1.0.0）
- ✅ **@apiDescription** - 詳細功能描述（繁體中文）
- ✅ **@apiPermission** - 權限等級（public/user/admin/optionalAuth）
- ✅ **@apiParam / @apiQuery / @apiBody** - 參數說明
- ✅ **@apiSuccess** - 成功回應結構
- ✅ **@apiSuccessExample** - JSON 格式成功範例
- ✅ **@apiError** - 錯誤類型
- ✅ **@apiErrorExample** - JSON 格式錯誤範例

## 🔗 相關資源

- **文檔模板**: `docs/api-documentation-template.md`
- **API 路由位置**: `src/app/api/`
- **錯誤處理系統**: `src/lib/errors/`
- **API 中間件**: `src/lib/middleware/`
- **統一回應格式**: `src/lib/api-response.ts`

## 📝 維護指南

### 新增 API 時

1. 實作 API 路由處理函數
2. 使用適當的中間件（withAuthAndError, withAdminAndError 等）
3. 參考模板添加完整的 JSDoc 文檔
4. 確保包含成功和錯誤範例
5. 更新此索引文件

### 文檔更新流程

1. 修改 API 實作時同步更新 JSDoc
2. 保持文檔格式一致性
3. 定期檢查文檔完整性
4. 使用 `grep -r "@api {" src/app/api/` 驗證覆蓋率

## 🚀 生成 API 文檔網站

可使用以下工具從 JSDoc 生成 HTML 文檔：

```bash
# 使用 apidoc（推薦）
npm install -g apidoc
apidoc -i src/app/api/ -o docs/api-html/

# 或使用 swagger-jsdoc
npm install -g swagger-jsdoc
swagger-jsdoc -d swagger-def.js src/app/api/**/*.ts -o swagger.json
```

## ✨ 特色功能

### 1. 統一錯誤處理
所有 API 都使用統一的錯誤處理中間件，確保錯誤回應格式一致。

### 2. 權限分層管理
清晰的權限分層（public/user/admin），確保 API 安全性。

### 3. 審計日誌
關鍵操作都有審計日誌記錄，支援完整的操作追溯。

### 4. 圖片管理
統一的圖片上傳和管理系統，支援多尺寸生成。

### 5. 搜尋優化
完整的搜尋功能，包含統計分析和自動完成建議。

### 6. 系統監控
豐富的系統監控 API，包含連線池、錯誤統計、KPI 報告等。

## 📊 版本歷史

- **v1.0.0** (2025-01-07) - 初始版本，完成所有 65 個 API 的文檔化

---

**最後更新**: 2025-01-07
**維護者**: Development Team
**文檔覆蓋率**: 100% (65/65)
