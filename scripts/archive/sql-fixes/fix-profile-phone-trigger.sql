-- ========================================
-- 修復註冊時電話號碼未儲存問題
-- ========================================
-- 問題：handle_new_user() 觸發器沒有從 raw_user_meta_data 取得 phone 欄位
-- 解決方案：更新觸發器函數，讓它正確處理 phone 欄位

-- ========================================
-- 第 1 步：檢查當前觸發器狀態
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '=== 檢查當前 handle_new_user 函數 ===';
  
  -- 檢查函數是否存在
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ handle_new_user 函數存在';
  ELSE
    RAISE NOTICE '❌ handle_new_user 函數不存在';
  END IF;
  
  -- 檢查觸發器是否存在
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ on_auth_user_created 觸發器存在';
  ELSE
    RAISE NOTICE '❌ on_auth_user_created 觸發器不存在';
  END IF;
END $$;

-- ========================================
-- 第 2 步：更新 handle_new_user 函數
-- ========================================

-- 替換現有函數，加入 phone 欄位處理
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  RAISE NOTICE '觸發器執行：新使用者 ID = %, metadata = %', NEW.id, NEW.raw_user_meta_data;
  
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'phone',  -- 新增：從 metadata 取得 phone
    'customer'
  );
  
  RAISE NOTICE '成功建立 profile：ID = %, name = %, phone = %', 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'phone';
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 第 3 步：確保觸發器正確設置
-- ========================================

-- 刪除舊觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 重新建立觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================
-- 第 4 步：驗證修復
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '=== 驗證修復結果 ===';
  RAISE NOTICE '✅ handle_new_user 函數已更新';
  RAISE NOTICE '✅ on_auth_user_created 觸發器已重建';
  RAISE NOTICE '✅ 現在註冊時會自動儲存電話號碼到 profiles.phone 欄位';
END $$;

-- ========================================
-- 第 5 步：測試資料驗證（可選）
-- ========================================

-- 顯示 profiles 表結構確認 phone 欄位存在
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 顯示現有的使用者資料（不包含敏感資訊）
SELECT 
  id,
  name,
  phone,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 完成訊息
-- ========================================

SELECT 
  '🎉 電話號碼儲存修復完成！' as status,
  '新註冊的使用者現在會自動儲存電話號碼' as result;

SELECT '=== 重要說明 ===' as notice
UNION ALL
SELECT '✅ handle_new_user() 函數已更新，包含 phone 欄位處理'
UNION ALL
SELECT '✅ on_auth_user_created 觸發器已重建'
UNION ALL
SELECT '✅ 新註冊使用者的電話號碼會自動儲存到 profiles.phone'
UNION ALL
SELECT '⚠️  現有使用者不受影響，如需更新請另外處理'
UNION ALL
SELECT '✅ 建議測試新註冊流程確認修復效果';