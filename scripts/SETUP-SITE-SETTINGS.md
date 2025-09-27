# 網站設定系統安裝指南

## 概述

此系統允許您通過管理介面動態更新首頁和農場體驗頁面的圖片，無需修改程式碼。

## 安裝步驟

### 1. 建立資料庫表

需要在 Supabase 中執行 SQL 腳本來建立 `site_settings` 表。

**方法 A：使用 Supabase Dashboard (推薦)**

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇您的專案
3. 左側選單點擊「SQL Editor」
4. 點擊「New Query」
5. 複製 `scripts/create-site-settings-table.sql` 的所有內容
6. 貼上到查詢編輯器
7. 點擊「Run」執行腳本

**方法 B：使用 psql CLI**

```bash
# 如果您有 psql 連接
psql $DATABASE_URL -f scripts/create-site-settings-table.sql
```

### 2. 驗證表格建立成功

執行以下 SQL 確認表格存在：

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'site_settings';
```

應該看到以下欄位：
- id (uuid)
- key (varchar)
- value (text)
- type (varchar)
- description (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### 3. 驗證預設資料

執行以下 SQL 確認預設資料已插入：

```sql
SELECT key, value, type, description
FROM site_settings
ORDER BY key;
```

應該看到 6 筆預設設定：
- home.hero_images (首頁輪播圖片)
- home.hero_title (首頁主標題)
- home.hero_subtitle (首頁副標題)
- farm_tour.hero_background (農場體驗背景圖)
- farm_tour.hero_title (農場體驗主標題)
- farm_tour.hero_subtitle (農場體驗副標題)

### 4. 測試系統

1. 訪問管理後台：http://localhost:3000/admin/dashboard
2. 點擊「網站設定」卡片
3. 嘗試上傳圖片
4. 儲存變更
5. 訪問首頁和農場體驗頁面，確認圖片已更新

## 功能說明

### 管理介面

**路徑**: `/admin/site-settings`

**功能**：
- 📸 管理首頁輪播圖片（可新增多張）
- 🏞️ 管理農場體驗頁面背景圖
- 🗑️ 移除不需要的圖片
- 💾 即時儲存變更

### API 端點

1. **GET /api/site-settings** - 取得所有設定或指定設定
   ```bash
   # 取得所有設定
   curl http://localhost:3000/api/site-settings

   # 取得單一設定
   curl http://localhost:3000/api/site-settings?key=home.hero_images

   # 批次取得多個設定
   curl http://localhost:3000/api/site-settings?keys=home.hero_images,farm_tour.hero_background
   ```

2. **PUT /api/site-settings?key={key}** - 更新設定（管理員）
   ```bash
   curl -X PUT http://localhost:3000/api/site-settings?key=home.hero_images \
     -H "Content-Type: application/json" \
     -d '{"value": "[\"\/images\/new1.jpg\",\"\/images\/new2.jpg\"]"}'
   ```

3. **POST /api/site-settings/upload-image** - 上傳圖片（管理員）
   ```bash
   curl -X POST http://localhost:3000/api/site-settings/upload-image \
     -F "file=@/path/to/image.jpg"
   ```

### 前台整合

頁面會自動從資料庫讀取動態圖片：

- **首頁** (`/`): 輪播圖片從 `home.hero_images` 讀取
- **農場體驗** (`/farm-tour`): 背景圖從 `farm_tour.hero_background` 讀取

如果設定載入失敗，會自動使用預設圖片。

## 疑難排解

### 問題：無法上傳圖片

**可能原因**：
1. 圖片大小超過 5MB
2. 圖片格式不支援（只支援 JPG, PNG, WebP, GIF）
3. Storage bucket 權限問題

**解決方案**：
1. 壓縮圖片
2. 轉換圖片格式
3. 檢查 Supabase Storage 權限設定

### 問題：圖片上傳成功但前台沒顯示

**檢查步驟**：
1. 確認設定已儲存（檢查資料庫）
2. 重新整理前台頁面
3. 檢查瀏覽器 Console 是否有錯誤
4. 確認圖片 URL 可以正常訪問

### 問題：API 返回 403 Forbidden

**原因**：沒有管理員權限

**解決方案**：
1. 確保已登入
2. 確保帳號角色為 `admin`
3. 檢查 RLS 政策是否正確設定

## 維護建議

1. **定期備份**：定期備份 `site_settings` 表資料
2. **圖片優化**：上傳前先壓縮圖片，建議大小 < 1MB
3. **圖片命名**：使用有意義的檔案名稱
4. **測試環境**：先在測試環境驗證後再到正式環境

## 技術細節

- **資料庫表**: site_settings (PostgreSQL)
- **Storage Bucket**: images/site-settings/
- **權限控制**: RLS (Row Level Security)
- **前台快取**: 無（即時更新）
- **支援格式**: JPG, PNG, WebP, GIF
- **大小限制**: 5MB

## 相關檔案

- `scripts/create-site-settings-table.sql` - SQL 建表腳本
- `src/types/siteSettings.ts` - TypeScript 類型定義
- `src/services/core/content/siteSettingsService.ts` - 服務層
- `src/app/api/site-settings/route.ts` - API 路由
- `src/app/admin/site-settings/page.tsx` - 管理介面
- `src/hooks/useSiteSettings.ts` - React Hook