-- ========================================
-- 全文搜尋 SQL 函數
-- ========================================
-- 🎯 目標：為 Haude 系統建立高效的全文搜尋功能
-- 📅 建立日期：2025-09-10
-- 👤 建立者：Claude Code 全文搜尋系統

-- ========================================
-- 第 1 部分：搜尋函數準備
-- ========================================

-- 1.1 檢查並建立必要的擴展
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1.2 建立自定義簡化文本搜尋配置（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'simple_custom'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION simple_custom (COPY = simple);
        ALTER TEXT SEARCH CONFIGURATION simple_custom
            ALTER MAPPING FOR asciiword, word, numword, email, url, host, file, version
            WITH simple;
    END IF;
END $$;

-- ========================================
-- 第 2 部分：產品全文搜尋函數
-- ========================================

-- 2.1 產品全文搜尋主函數
CREATE OR REPLACE FUNCTION full_text_search_products(
    search_query TEXT,
    search_limit INTEGER DEFAULT 20,
    search_offset INTEGER DEFAULT 0,
    lang_config TEXT DEFAULT 'simple'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    original_price DECIMAL,
    is_on_sale BOOLEAN,
    images TEXT[],
    primary_image_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL,
    highlight TEXT,
    matched_fields TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
    ts_query_text TEXT;
    search_vector TSVECTOR;
BEGIN
    -- 處理空查詢
    IF search_query IS NULL OR trim(search_query) = '' THEN
        RETURN;
    END IF;
    
    -- 建構文本搜尋查詢
    ts_query_text := plainto_tsquery(lang_config, search_query)::TEXT;
    
    -- 如果查詢處理失敗，使用簡單搜尋
    IF ts_query_text IS NULL OR ts_query_text = '' THEN
        ts_query_text := quote_literal(search_query) || ':*';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.original_price,
        p.is_on_sale,
        p.images,
        p.primary_image_url,
        p.thumbnail_url,
        p.created_at,
        p.updated_at,
        -- 計算排名分數（名稱權重較高）
        (
            ts_rank_cd(
                setweight(to_tsvector(lang_config, COALESCE(p.name, '')), 'A') ||
                setweight(to_tsvector(lang_config, COALESCE(p.description, '')), 'B') ||
                setweight(to_tsvector(lang_config, COALESCE(p.category, '')), 'C'),
                to_tsquery(lang_config, ts_query_text)
            )
        )::REAL as rank,
        -- 生成高亮摘要
        (
            CASE 
                WHEN p.name ILIKE '%' || search_query || '%' THEN
                    ts_headline(lang_config, p.name, to_tsquery(lang_config, ts_query_text), 'MaxWords=10')
                WHEN p.description ILIKE '%' || search_query || '%' THEN
                    ts_headline(lang_config, p.description, to_tsquery(lang_config, ts_query_text), 'MaxWords=20')
                ELSE
                    left(COALESCE(p.description, p.name, ''), 100) || '...'
            END
        ) as highlight,
        -- 標示匹配的欄位
        (
            ARRAY(
                SELECT unnest(ARRAY[
                    CASE WHEN p.name ILIKE '%' || search_query || '%' THEN 'name' END,
                    CASE WHEN p.description ILIKE '%' || search_query || '%' THEN 'description' END,
                    CASE WHEN p.category ILIKE '%' || search_query || '%' THEN 'category' END
                ])
                WHERE unnest IS NOT NULL
            )
        ) as matched_fields
    FROM products p
    WHERE 
        -- 全文搜尋匹配
        (
            setweight(to_tsvector(lang_config, COALESCE(p.name, '')), 'A') ||
            setweight(to_tsvector(lang_config, COALESCE(p.description, '')), 'B') ||
            setweight(to_tsvector(lang_config, COALESCE(p.category, '')), 'C')
        ) @@ to_tsquery(lang_config, ts_query_text)
        OR
        -- 模糊匹配作為後備
        (
            p.name ILIKE '%' || search_query || '%' OR
            p.description ILIKE '%' || search_query || '%' OR
            p.category ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        -- 優先顯示精確匹配
        CASE WHEN p.name ILIKE search_query THEN 1 ELSE 2 END,
        -- 然後按相關性排序
        ts_rank_cd(
            setweight(to_tsvector(lang_config, COALESCE(p.name, '')), 'A') ||
            setweight(to_tsvector(lang_config, COALESCE(p.description, '')), 'B') ||
            setweight(to_tsvector(lang_config, COALESCE(p.category, '')), 'C'),
            to_tsquery(lang_config, ts_query_text)
        ) DESC,
        -- 最後按建立時間排序
        p.created_at DESC
    LIMIT search_limit
    OFFSET search_offset;
END;
$$;

-- ========================================
-- 第 3 部分：新聞全文搜尋函數
-- ========================================

-- 3.1 新聞全文搜尋主函數
CREATE OR REPLACE FUNCTION full_text_search_news(
    search_query TEXT,
    search_limit INTEGER DEFAULT 20,
    search_offset INTEGER DEFAULT 0,
    lang_config TEXT DEFAULT 'simple'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL,
    highlight TEXT,
    matched_fields TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
    ts_query_text TEXT;
BEGIN
    -- 處理空查詢
    IF search_query IS NULL OR trim(search_query) = '' THEN
        RETURN;
    END IF;
    
    -- 建構文本搜尋查詢
    ts_query_text := plainto_tsquery(lang_config, search_query)::TEXT;
    
    -- 如果查詢處理失敗，使用簡單搜尋
    IF ts_query_text IS NULL OR ts_query_text = '' THEN
        ts_query_text := quote_literal(search_query) || ':*';
    END IF;
    
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.author,
        n.published_at,
        n.image_url,
        n.tags,
        n.created_at,
        n.updated_at,
        -- 計算排名分數（標題權重最高）
        (
            ts_rank_cd(
                setweight(to_tsvector(lang_config, COALESCE(n.title, '')), 'A') ||
                setweight(to_tsvector(lang_config, COALESCE(n.content, '')), 'B') ||
                setweight(to_tsvector(lang_config, COALESCE(n.author, '')), 'C'),
                to_tsquery(lang_config, ts_query_text)
            )
        )::REAL as rank,
        -- 生成高亮摘要
        (
            CASE 
                WHEN n.title ILIKE '%' || search_query || '%' THEN
                    ts_headline(lang_config, n.title, to_tsquery(lang_config, ts_query_text), 'MaxWords=10')
                WHEN n.content ILIKE '%' || search_query || '%' THEN
                    ts_headline(lang_config, n.content, to_tsquery(lang_config, ts_query_text), 'MaxWords=30')
                ELSE
                    left(COALESCE(n.content, n.title, ''), 150) || '...'
            END
        ) as highlight,
        -- 標示匹配的欄位
        (
            ARRAY(
                SELECT unnest(ARRAY[
                    CASE WHEN n.title ILIKE '%' || search_query || '%' THEN 'title' END,
                    CASE WHEN n.content ILIKE '%' || search_query || '%' THEN 'content' END,
                    CASE WHEN n.author ILIKE '%' || search_query || '%' THEN 'author' END
                ])
                WHERE unnest IS NOT NULL
            )
        ) as matched_fields
    FROM news n
    WHERE 
        -- 全文搜尋匹配
        (
            setweight(to_tsvector(lang_config, COALESCE(n.title, '')), 'A') ||
            setweight(to_tsvector(lang_config, COALESCE(n.content, '')), 'B') ||
            setweight(to_tsvector(lang_config, COALESCE(n.author, '')), 'C')
        ) @@ to_tsquery(lang_config, ts_query_text)
        OR
        -- 模糊匹配作為後備
        (
            n.title ILIKE '%' || search_query || '%' OR
            n.content ILIKE '%' || search_query || '%' OR
            n.author ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        -- 優先顯示標題精確匹配
        CASE WHEN n.title ILIKE search_query THEN 1 ELSE 2 END,
        -- 然後按相關性排序
        ts_rank_cd(
            setweight(to_tsvector(lang_config, COALESCE(n.title, '')), 'A') ||
            setweight(to_tsvector(lang_config, COALESCE(n.content, '')), 'B') ||
            setweight(to_tsvector(lang_config, COALESCE(n.author, '')), 'C'),
            to_tsquery(lang_config, ts_query_text)
        ) DESC,
        -- 最後按發布時間排序
        n.published_at DESC NULLS LAST,
        n.created_at DESC
    LIMIT search_limit
    OFFSET search_offset;
END;
$$;

-- ========================================
-- 第 4 部分：搜尋建議函數
-- ========================================

-- 4.1 搜尋建議函數
CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    target_table TEXT DEFAULT 'products',
    suggestion_limit INTEGER DEFAULT 5
)
RETURNS TABLE (suggestion TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 處理空查詢
    IF partial_query IS NULL OR trim(partial_query) = '' THEN
        RETURN;
    END IF;
    
    -- 根據目標表格返回建議
    IF target_table = 'products' THEN
        RETURN QUERY
        SELECT DISTINCT p.name as suggestion
        FROM products p
        WHERE p.name ILIKE partial_query || '%'
        ORDER BY 
            LENGTH(p.name),
            p.name
        LIMIT suggestion_limit;
    ELSIF target_table = 'news' THEN
        RETURN QUERY
        SELECT DISTINCT n.title as suggestion
        FROM news n
        WHERE n.title ILIKE partial_query || '%'
        ORDER BY 
            LENGTH(n.title),
            n.title
        LIMIT suggestion_limit;
    END IF;
END;
$$;

-- ========================================
-- 第 5 部分：搜尋統計函數
-- ========================================

-- 5.1 建立搜尋日誌表格（如果不存在）
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query TEXT NOT NULL,
    search_table TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為搜尋日誌建立索引
CREATE INDEX IF NOT EXISTS idx_search_logs_query 
ON search_logs (search_query);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at 
ON search_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id 
ON search_logs (user_id) WHERE user_id IS NOT NULL;

-- 5.2 記錄搜尋日誌函數
CREATE OR REPLACE FUNCTION log_search_activity(
    search_query TEXT,
    search_table TEXT,
    result_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    user_id UUID DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO search_logs (
        search_query,
        search_table,
        result_count,
        execution_time_ms,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        search_query,
        search_table,
        result_count,
        execution_time_ms,
        user_id,
        ip_address,
        user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 5.3 獲取熱門搜尋關鍵字函數
CREATE OR REPLACE FUNCTION get_popular_searches(
    days_back INTEGER DEFAULT 7,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    search_query TEXT,
    search_count BIGINT,
    avg_execution_time NUMERIC,
    avg_result_count NUMERIC,
    last_searched TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.search_query,
        COUNT(*) as search_count,
        ROUND(AVG(sl.execution_time_ms), 2) as avg_execution_time,
        ROUND(AVG(sl.result_count), 2) as avg_result_count,
        MAX(sl.created_at) as last_searched
    FROM search_logs sl
    WHERE sl.created_at >= NOW() - (INTERVAL '1 day' * days_back)
    AND trim(sl.search_query) != ''
    GROUP BY sl.search_query
    HAVING COUNT(*) > 1
    ORDER BY search_count DESC, last_searched DESC
    LIMIT result_limit;
END;
$$;

-- ========================================
-- 第 6 部分：效能優化函數
-- ========================================

-- 6.1 搜尋效能分析函數
CREATE OR REPLACE FUNCTION analyze_search_performance(
    table_name TEXT DEFAULT 'products'
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT,
    description TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    index_count INTEGER;
    table_size TEXT;
    total_rows BIGINT;
BEGIN
    -- 獲取表格統計資訊
    SELECT 
        pg_size_pretty(pg_total_relation_size(c.oid)),
        COALESCE(s.n_live_tup, 0)
    INTO table_size, total_rows
    FROM pg_class c
    LEFT JOIN pg_stat_user_tables s ON s.relname = c.relname
    WHERE c.relname = table_name;
    
    -- 獲取索引數量
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE tablename = table_name;
    
    -- 返回效能指標
    RETURN QUERY VALUES
        ('table_size', table_size, '表格總大小（包含索引）'),
        ('total_rows', total_rows::TEXT, '表格總行數'),
        ('index_count', index_count::TEXT, '索引總數'),
        ('text_search_ready', 
         CASE WHEN index_count > 0 THEN '是' ELSE '否' END,
         '是否已準備好進行全文搜尋');
END;
$$;

-- ========================================
-- 執行完成通知
-- ========================================

-- 顯示函數建立完成訊息
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%search%';
    
    RAISE NOTICE '✅ 全文搜尋函數建立完成！';
    RAISE NOTICE '📊 已建立 %s 個搜尋相關函數', function_count;
    RAISE NOTICE '🔍 支援產品和新聞的全文搜尋';
    RAISE NOTICE '💡 包含搜尋建議和統計功能';
    RAISE NOTICE '⚡ 已優化中文搜尋體驗';
END $$;