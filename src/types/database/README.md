# Database Types 使用指南

本目錄包含按業務領域拆分的資料庫類型定義，從原始的單一 `database.ts` (1,425 行) 拆分為 6 個領域檔案。

## 📁 檔案結構

```
src/types/database/
├── index.ts              (172 行) - 統一導出入口
├── auth.ts              (118 行) - 使用者與認證
├── products.ts          (286 行) - 產品與庫存
├── orders.ts            (175 行) - 訂單
├── inquiries.ts         (247 行) - 詢價
├── content.ts           (305 行) - 內容與系統設定
└── infrastructure.ts    (260 行) - 審計與監控
```

總計: 1,563 行

## 🎯 各領域包含的資料表

### auth.ts - 使用者與認證
**Tables:**
- `profiles` - 使用者資料
- `user_interests` - 使用者興趣

**Views:**
- `user_activity_stats` - 使用者活動統計

**Functions:**
- `get_email_by_phone` - 透過手機號查詢 Email
- `is_valid_taiwan_phone` - 驗證台灣手機號碼
- `is_admin` - 檢查是否為管理員

### products.ts - 產品與庫存
**Tables:**
- `products` - 產品資料
- `product_images` - 產品圖片
- `images` - 通用圖片表

**Views:**
- `products_with_images` - 產品含圖片檢視
- `product_inventory_status` - 庫存狀態檢視
- `images_stats` - 圖片統計

**Functions:**
- `create_product_with_images` - 建立產品及圖片
- `reserve_product_inventory` - 預留庫存
- `release_reserved_inventory` - 釋放預留庫存
- `finalize_reserved_inventory` - 確認預留庫存
- `update_product_inventory` - 更新庫存
- `update_image_positions` - 更新圖片順序
- `cleanup_orphan_images` - 清理孤立圖片
- `get_entity_images` - 取得實體圖片
- `test_create_product_with_images` - 測試建立產品

### orders.ts - 訂單
**Tables:**
- `orders` - 訂單
- `order_items` - 訂單項目

**Views:**
- `order_summary_view` - 訂單摘要檢視

**Functions:**
- `generate_order_number` - 生成訂單編號

### inquiries.ts - 詢價
**Tables:**
- `inquiries` - 詢價
- `inquiry_items` - 詢價項目
- `inquiry_templates` - 詢價範本

**Views:**
- `inquiry_stats` - 詢價統計
- `inquiry_templates_stats` - 詢價範本統計
- `daily_inquiry_stats` - 每日詢價統計

### content.ts - 內容與系統設定
**Tables:**
- `site_settings` - 網站設定
- `culture` - 文化內容
- `farm_tour` - 農場導覽
- `dev_notes` - 開發筆記
- `schedule` - 行程
- `locations` - 地點
- `location_id_mapping` - 地點 ID 對應

### infrastructure.ts - 審計與監控
**Tables:**
- `audit_logs` - 審計日誌
- `search_logs` - 搜尋日誌

**Views:**
- `audit_stats` - 審計統計
- `resource_access_stats` - 資源存取統計

**Functions:**
- `get_resource_audit_history` - 取得資源審計歷史
- `get_user_audit_history` - 取得使用者審計歷史
- `cleanup_old_audit_logs` - 清理舊審計日誌
- `get_popular_searches` - 取得熱門搜尋
- `get_search_suggestions` - 取得搜尋建議
- `log_search_activity` - 記錄搜尋活動
- `analyze_search_performance` - 分析搜尋效能
- `full_text_search_news` - 全文搜尋新聞
- `full_text_search_products` - 全文搜尋產品
- `show_limit`, `show_trgm`, `unaccent` - PostgreSQL 擴展函數

## 📖 使用方式

### 1. 導入完整 Database 類型（推薦，向後相容）

```typescript
import type { Database, Tables, Json } from '@/types/database'

// 使用 Tables helper
type Profile = Tables<'profiles'>
type Product = Tables<'products'>

// 使用完整路徑
type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
```

### 2. 導入特定領域類型

```typescript
// 只導入認證相關類型
import type { AuthDatabase } from '@/types/database'
type Profile = AuthDatabase['public']['Tables']['profiles']['Row']

// 只導入產品相關類型
import type { ProductsDatabase } from '@/types/database'
type Product = ProductsDatabase['public']['Tables']['products']['Row']
```

### 3. 同時使用多個領域

```typescript
import type {
  Database,
  AuthDatabase,
  ProductsDatabase,
  OrdersDatabase
} from '@/types/database'

// 使用完整類型
type CompleteOrder = Database['public']['Tables']['orders']['Row']

// 使用領域類型
type Profile = AuthDatabase['public']['Tables']['profiles']['Row']
type Product = ProductsDatabase['public']['Tables']['products']['Row']
```

## 🔄 從舊版遷移

如果你的程式碼原本使用 `src/types/database.ts`：

```typescript
// 舊版 (仍然可用)
import type { Database } from '@/types/database'

// 新版 (相同的用法，但現在來自 database/index.ts)
import type { Database } from '@/types/database'
```

**無需修改任何現有程式碼**，只需：
1. 將 `src/types/database.ts` 重新命名為 `database.ts.old`
2. TypeScript 會自動使用 `src/types/database/index.ts`

## ✨ 優勢

1. **更好的組織**: 按業務領域分類，更容易找到相關類型
2. **更快的編譯**: TypeScript 可以更有效地快取較小的檔案
3. **更容易維護**: 修改特定領域時不需要編輯大型檔案
4. **向後相容**: 完全相容現有程式碼
5. **靈活性**: 可以選擇導入完整類型或特定領域類型

## 📝 注意事項

- 所有領域檔案都定義了自己的 `Json` 類型，但 `index.ts` 只導出一個統一的 `Json` 類型以避免衝突
- 保持了原始 `Database` 類型的所有結構，包括 `__InternalSupabase` 配置
- 所有 helper 類型（`Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`）都保持不變
- `Constants` 物件也保持不變

## 🔍 類型檢查

確認所有類型定義正確：

```bash
npm run type-check
```

應該顯示 0 個錯誤。

## 🤝 貢獻

當資料庫 schema 更新時：

1. 使用 Supabase CLI 重新生成類型
2. 根據業務領域將新的表/視圖/函數分配到對應的領域檔案
3. 更新 `index.ts` 中的類型組合
4. 執行 `npm run type-check` 確認無錯誤
5. 更新此 README 的表格列表
