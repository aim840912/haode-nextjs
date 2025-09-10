# 🚀 Supabase Dashboard SQL 執行指南

## 📋 問題解決

### 問題 1：文字搜尋配置不存在
**原問題：** `text search configuration "chinese" does not exist`  
**解決方案：** 已將所有 SQL 腳本中的 'chinese' 文字搜尋配置改為 'simple' 配置

### 問題 2：資料表欄位不存在  
**原問題：** `column "status" does not exist`  
**解決方案：** 已將 products 表的 'status' 欄位改為 'is_active' 欄位

### 問題 3：欄位名稱大小寫問題
**原問題：** `column "isactive" does not exist`  
**解決方案：** PostgreSQL 使用 snake_case，已將 'isActive' 改為 'is_active'

### 問題 4：表欄位結構不符  
**原問題：** `column "is_primary" does not exist`  
**解決方案：** product_images 表沒有 is_primary 欄位，已註解相關索引

### 問題 5：可選表和欄位不存在  
**原問題：** `column "features" does not exist`  
**解決方案：** 註解掉不存在的表和欄位索引：
- products.features 欄位索引 (第 102-104 行)
- locations 表相關索引 (第 108-110 行)  
- user_interests 表相關索引 (第 83-84 行)
- audit_logs 表相關索引 (第 118-128 行)

### 問題 6：PostgreSQL INTERVAL 語法錯誤  
**原問題：** `syntax error at or near "FORMAT"`  
**解決方案：** 修正動態 INTERVAL 語法：
- 修正前：`INTERVAL '%s days' FORMAT = days_back::TEXT`
- 修正後：`INTERVAL '1 day' * days_back`

---

## 🛠️ 執行步驟

### 步驟 1：登入 Supabase Dashboard
1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 選擇 Haude 專案
3. 點擊左側選單的 **SQL Editor**

### 步驟 2：測試相容性（建議先執行）
1. **文字搜尋測試**：
   - 建立新查詢
   - 複製 `scripts/test-sql-compatibility.sql` 內容
   - 執行測試，確認沒有錯誤

2. **表結構驗證**：
   - 建立新查詢  
   - 複製 `scripts/test-table-structure.sql` 內容
   - 執行測試，確認 products 表有 'is_active' 欄位

### 步驟 3：執行索引優化
1. 建立新的 SQL 查詢標籤
2. 複製 `scripts/database-index-optimization.sql` **完整內容**
3. 點擊 **Run** 執行
4. 檢查結果：
   - ✅ `CREATE INDEX` 語句成功執行
   - ⚠️ 如果出現 "already exists" 是正常的，表示索引已存在

### 步驟 4：執行全文搜尋函數
1. 建立新的 SQL 查詢標籤
2. 複製 `scripts/full-text-search-functions.sql` **完整內容**
3. 點擊 **Run** 執行
4. 檢查結果：
   - ✅ 函數建立成功
   - ⚠️ 如果出現權限錯誤，可能需要聯繫 Supabase 支援

---

## ✅ 修正內容總結

### 檔案 1: `database-index-optimization.sql`
```sql
-- 文字搜尋配置修正
-- 修正前：CREATE INDEX ... USING GIN (to_tsvector('chinese', name));
-- 修正後：CREATE INDEX ... USING GIN (to_tsvector('simple', name));

-- 產品表欄位修正
-- 修正前：ON products (status, created_at DESC) WHERE status IS NOT NULL;
-- 修正後：ON products (is_active, created_at DESC);

-- 條件索引修正  
-- 修正前：WHERE status = 'active' OR status IS NULL;
-- 修正後：WHERE is_active = true;

-- 欄位名稱大小寫修正
-- 修正前：ON products (isActive, created_at DESC);
-- 修正後：ON products (is_active, created_at DESC);

-- product_images 表結構修正
-- 修正前：ON product_images (product_id, is_primary) WHERE is_primary = true;
-- 修正後：-- 註解掉（欄位不存在）

-- 可選表和欄位修正
-- 修正前：ON products USING GIN (features) WHERE features IS NOT NULL;
-- 修正後：-- 註解掉（欄位不存在）
-- 修正前：ON locations USING GIN (coordinates);
-- 修正後：-- 註解掉（表可能不存在）
-- 修正前：ON user_interests (user_id);
-- 修正後：-- 註解掉（表可能不存在）
-- 修正前：ON audit_logs (created_at DESC);
-- 修正後：-- 註解掉（表可能不存在）
```

### 檔案 2: `full-text-search-functions.sql`
```sql
-- 預設配置修正
-- 修正前：lang_config TEXT DEFAULT 'chinese'
-- 修正後：lang_config TEXT DEFAULT 'simple'

-- PostgreSQL INTERVAL 語法修正
-- 修正前：WHERE sl.created_at >= NOW() - INTERVAL '%s days' FORMAT = days_back::TEXT
-- 修正後：WHERE sl.created_at >= NOW() - (INTERVAL '1 day' * days_back)
```

---

## 🧪 驗證執行結果

### 檢查索引是否建立成功
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('products', 'news') 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### 檢查搜尋函數是否可用
```sql
-- 檢查函數是否存在
SELECT proname 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('full_text_search_products', 'full_text_search_news');
```

### 測試搜尋功能
```sql
-- 如果有產品資料，測試產品搜尋
SELECT * FROM full_text_search_products('農產品', 5);

-- 如果有新聞資料，測試新聞搜尋  
SELECT * FROM full_text_search_news('農業', 5);
```

---

## ⚠️ 可能遇到的問題

### 問題 1：權限不足
**錯誤：** `permission denied for schema public`
**解決：** 聯繫 Supabase 支援或檢查資料庫角色權限

### 問題 2：擴展不可用
**錯誤：** `extension "pg_trgm" is not available`
**解決：** 在 Database > Extensions 中啟用 `pg_trgm` 和 `unaccent`

### 問題 3：索引已存在
**警告：** `relation "idx_products_name_gin" already exists`
**解決：** 這是正常的，表示索引已存在，可以忽略

---

## 🚀 效能優化說明

修正後的 SQL 腳本包含：

### 索引優化
- **GIN 索引** 用於全文搜尋（使用 'simple' 配置）
- **B-tree 索引** 用於排序和範圍查詢
- **複合索引** 用於多欄位查詢
- **部分索引** 僅對符合條件的記錄建立索引

### 搜尋功能
- **產品全文搜尋** 支援名稱、描述、類別搜尋
- **新聞全文搜尋** 支援標題、內容、作者搜尋
- **搜尋建議** 自動完成功能
- **搜尋統計** 效能分析功能

---

## 📞 技術支援

如果執行過程中遇到問題：

1. **檢查 Supabase 日誌** - Dashboard > Logs > Database
2. **查看錯誤訊息** - SQL Editor 會顯示詳細錯誤
3. **參考 Supabase 文件** - [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
4. **聯繫支援** - 如果涉及權限或配置問題

---

*📝 備注：此指南基於 2025-09-10 的修正版本，確保使用最新的 SQL 腳本檔案。*