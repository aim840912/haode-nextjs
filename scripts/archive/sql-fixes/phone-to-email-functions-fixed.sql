-- 修正版本：手機號碼到電子郵件轉換函數
-- 解決返回類型匹配問題

-- 建立函數：根據手機號碼取得電子郵件 (修正版)
CREATE OR REPLACE FUNCTION get_email_by_phone(phone_number TEXT)
RETURNS TABLE(email TEXT, user_id UUID) AS $$
BEGIN
    -- 輸入驗證
    IF phone_number IS NULL OR phone_number = '' THEN
        RETURN;
    END IF;

    -- 正規化手機號碼（移除空格、破折號等）
    phone_number := regexp_replace(phone_number, '[^0-9+]', '', 'g');

    -- 驗證台灣手機號碼格式 (09xxxxxxxx)
    IF NOT (phone_number ~ '^09[0-9]{8}$') THEN
        RETURN;
    END IF;

    -- 查詢用戶資料，明確指定返回類型
    RETURN QUERY
    SELECT
        au.email::TEXT as email,
        au.id::UUID as user_id
    FROM profiles p
    INNER JOIN auth.users au ON p.id = au.id
    WHERE p.phone = phone_number
      AND au.email IS NOT NULL
      AND au.email != ''
    LIMIT 1;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立函數：驗證手機號碼格式 (簡化版)
CREATE OR REPLACE FUNCTION is_valid_taiwan_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 輸入驗證
    IF phone_number IS NULL OR phone_number = '' THEN
        RETURN FALSE;
    END IF;

    -- 正規化手機號碼
    phone_number := regexp_replace(phone_number, '[^0-9+]', '', 'g');

    -- 驗證台灣手機號碼格式
    RETURN phone_number ~ '^09[0-9]{8}$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立簡化測試函數
CREATE OR REPLACE FUNCTION test_phone_lookup(test_phone TEXT DEFAULT '0975390207')
RETURNS TABLE(email TEXT, user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM get_email_by_phone(test_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新增註釋
COMMENT ON FUNCTION get_email_by_phone(TEXT) IS '根據手機號碼查詢對應的用戶電子郵件，修正版解決類型匹配問題';
COMMENT ON FUNCTION is_valid_taiwan_phone(TEXT) IS '驗證台灣手機號碼格式 (09xxxxxxxx)，簡化版';
COMMENT ON FUNCTION test_phone_lookup(TEXT) IS '測試手機號碼查詢功能的輔助函數';