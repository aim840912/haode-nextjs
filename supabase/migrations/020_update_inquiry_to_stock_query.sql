-- 將詢價系統更新為庫存查詢系統
-- Migration: 020_update_inquiry_to_stock_query.sql

-- 更新資料表註釋，從詢價改為庫存查詢
COMMENT ON TABLE inquiries IS '庫存查詢單主表，儲存客戶庫存查詢資訊';
COMMENT ON TABLE inquiry_items IS '庫存查詢單項目表，儲存查詢的產品明細';
COMMENT ON COLUMN inquiries.status IS '查詢單狀態：pending(待回覆), quoted(已回覆), confirmed(已確認有貨), completed(已完成), cancelled(已取消)';
COMMENT ON COLUMN inquiries.total_estimated_amount IS '預估總金額（台幣）- 店家可選擇性提供';

-- 更新統計檢視的註釋
COMMENT ON VIEW inquiry_stats IS '庫存查詢統計檢視，供管理員查看各狀態查詢單統計';

-- 如果需要，可以添加新的欄位來更好地支援庫存查詢
-- 例如：庫存狀態欄位（但暫時保持現有結構以確保向後相容性）

-- 更新日常統計檢視的註釋（如果存在）
DO $$
BEGIN
    -- 檢查是否存在 daily_inquiry_stats 檢視
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'daily_inquiry_stats') THEN
        COMMENT ON VIEW daily_inquiry_stats IS '每日庫存查詢統計檢視，追蹤查詢回覆趨勢';
    END IF;
END $$;

-- 確保所有價格相關欄位都是可選的（已經是可選的，這裡只是確認）
-- unit_price 和 total_price 在 inquiry_items 表中已經是 DECIMAL(10,2)，沒有 NOT NULL 約束
-- total_estimated_amount 在 inquiries 表中已經是 DECIMAL(10,2)，沒有 NOT NULL 約束

-- 添加一個函數來幫助生成庫存查詢編號（STK 前綴）
CREATE OR REPLACE FUNCTION format_stock_inquiry_number(inquiry_id UUID, created_date TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    RETURN 'STK' || 
           TO_CHAR(created_date, 'YYYYMMDD') || 
           '-' || 
           UPPER(SUBSTRING(inquiry_id::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION format_stock_inquiry_number IS '格式化庫存查詢單編號，生成 STK 前綴的編號';