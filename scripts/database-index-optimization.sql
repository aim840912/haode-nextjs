-- ========================================
-- 資料庫索引優化腳本
-- ========================================
-- 🎯 目標：為 Haude 農業電商系統建立高效能索引
-- 📅 建立日期：2025-09-10
-- 👤 建立者：Claude Code 資料庫優化系統

-- ========================================
-- 第 1 階段：搜尋相關索引優化
-- ========================================

-- 1.1 產品表搜尋優化
-- 為產品名稱建立 GIN 索引（支援全文搜尋）
CREATE INDEX IF NOT EXISTS idx_products_name_gin 
ON products USING GIN (to_tsvector('simple', name));

-- 為產品描述建立 GIN 索引
CREATE INDEX IF NOT EXISTS idx_products_description_gin 
ON products USING GIN (to_tsvector('simple', description));

-- 為產品類別建立 B-tree 索引（常用於篩選）
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products (category);

-- 為價格範圍查詢建立索引
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products (price);

-- 1.2 新聞文章搜尋優化
-- 為新聞標題建立 GIN 索引
CREATE INDEX IF NOT EXISTS idx_news_title_gin 
ON news USING GIN (to_tsvector('simple', title));

-- 為新聞內容建立 GIN 索引
CREATE INDEX IF NOT EXISTS idx_news_content_gin 
ON news USING GIN (to_tsvector('simple', content));

-- ========================================
-- 第 2 階段：排序相關索引優化
-- ========================================

-- 2.1 時間戳排序索引
-- 產品建立時間排序（最新優先）
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc 
ON products (created_at DESC);

-- 新聞發布時間排序
CREATE INDEX IF NOT EXISTS idx_news_created_at_desc 
ON news (created_at DESC);

-- 詢價單建立時間排序
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at_desc 
ON inquiries (created_at DESC);

-- 2.2 狀態欄位排序索引
-- 產品啟用狀態 + 建立時間複合索引
CREATE INDEX IF NOT EXISTS idx_products_active_created_at 
ON products (is_active, created_at DESC);

-- 詢價單狀態 + 建立時間複合索引
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created_at 
ON inquiries (status, created_at DESC) 
WHERE status IS NOT NULL;

-- ========================================
-- 第 3 階段：關聯查詢索引優化
-- ========================================

-- 3.1 外鍵索引優化
-- 詢價項目的產品關聯索引
CREATE INDEX IF NOT EXISTS idx_inquiry_items_product_id 
ON inquiry_items (product_id);

-- 詢價項目的詢價單關聯索引
CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiry_id 
ON inquiry_items (inquiry_id);

-- 產品圖片關聯索引
CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
ON product_images (product_id);

-- 使用者興趣關聯索引（註解：user_interests 表可能不存在）
-- CREATE INDEX IF NOT EXISTS idx_user_interests_user_id 
-- ON user_interests (user_id);

-- 3.2 複合索引優化
-- 詢價單 + 使用者 + 狀態複合索引
CREATE INDEX IF NOT EXISTS idx_inquiries_user_status 
ON inquiries (user_id, status);

-- 產品圖片 + 主要圖片標記複合索引（註解：is_primary 欄位不存在）
-- CREATE INDEX IF NOT EXISTS idx_product_images_product_primary 
-- ON product_images (product_id, is_primary) 
-- WHERE is_primary = true;

-- ========================================
-- 第 4 階段：JSON/JSONB 欄位索引優化
-- ========================================

-- 4.1 產品特性 JSON 索引（註解：features 欄位不存在）
-- 如果 products 表有 features 欄位
-- CREATE INDEX IF NOT EXISTS idx_products_features_gin 
-- ON products USING GIN (features) 
-- WHERE features IS NOT NULL;

-- 4.2 地理位置索引（註解：locations 表可能不存在）
-- 為營業據點位置建立 GIN 索引
-- CREATE INDEX IF NOT EXISTS idx_locations_coordinates_gin 
-- ON locations USING GIN (coordinates) 
-- WHERE coordinates IS NOT NULL;

-- ========================================
-- 第 5 階段：效能監控索引
-- ========================================

-- 5.1 審計日誌索引（註解：audit_logs 表可能不存在）
-- 審計日誌時間範圍查詢索引
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc 
-- ON audit_logs (created_at DESC);

-- 審計日誌操作類型索引
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
-- ON audit_logs (action);

-- 審計日誌使用者索引
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
-- ON audit_logs (user_id) 
-- WHERE user_id IS NOT NULL;

-- 5.2 系統效能監控索引
-- 為頻繁查詢的 UUID 欄位建立 hash 索引
CREATE INDEX IF NOT EXISTS idx_products_id_hash 
ON products USING HASH (id);

CREATE INDEX IF NOT EXISTS idx_inquiries_id_hash 
ON inquiries USING HASH (id);

-- ========================================
-- 第 6 階段：部分索引優化
-- ========================================

-- 6.1 條件性索引（只對符合條件的記錄建立索引）
-- 只為啟用的產品建立索引
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products (name, category, price) 
WHERE is_active = true;

-- 只為進行中的詢價建立索引
CREATE INDEX IF NOT EXISTS idx_inquiries_pending 
ON inquiries (created_at DESC, user_id) 
WHERE status IN ('pending', 'processing');

-- 只為主要產品圖片建立索引（註解：is_primary 欄位不存在）
-- CREATE INDEX IF NOT EXISTS idx_product_images_primary_only 
-- ON product_images (product_id, image_url) 
-- WHERE is_primary = true;

-- ========================================
-- 執行完成通知
-- ========================================

-- 顯示索引建立完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ 資料庫索引優化完成！';
    RAISE NOTICE '📊 已建立 %s 個索引用於效能優化', 
        (SELECT count(*) FROM pg_indexes WHERE tablename IN 
         ('products', 'news', 'inquiries', 'inquiry_items', 'product_images'));
    RAISE NOTICE '🚀 建議執行 ANALYZE 指令更新統計資訊';
END $$;

-- 更新表格統計資訊（推薦在索引建立後執行）
ANALYZE products;
ANALYZE news;
ANALYZE inquiries;
ANALYZE inquiry_items;
ANALYZE product_images;
-- ANALYZE user_interests;    -- 表可能不存在
-- ANALYZE locations;         -- 表可能不存在
-- ANALYZE audit_logs;        -- 表可能不存在