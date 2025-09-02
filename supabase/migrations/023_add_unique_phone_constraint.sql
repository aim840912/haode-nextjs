-- 新增手機號碼唯一性約束
-- 防止同一支手機號碼註冊多個帳號

-- 首先處理現有的重複手機號碼
-- 將重複的手機號碼設為 NULL（保留最早註冊的帳號）
WITH duplicated_phones AS (
  SELECT phone
  FROM profiles
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone
  HAVING COUNT(*) > 1
),
keep_first AS (
  SELECT DISTINCT ON (p.phone) p.id
  FROM profiles p
  INNER JOIN duplicated_phones dp ON p.phone = dp.phone
  ORDER BY p.phone, p.created_at ASC
)
UPDATE profiles 
SET phone = NULL
WHERE phone IN (SELECT phone FROM duplicated_phones)
  AND id NOT IN (SELECT id FROM keep_first);

-- 為 phone 欄位新增索引（在建立約束前）
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) 
WHERE phone IS NOT NULL AND phone != '';

-- 新增唯一性約束
-- 注意：空值和 NULL 不受唯一性約束影響
ALTER TABLE profiles 
ADD CONSTRAINT unique_phone 
UNIQUE (phone);

-- 新增註解說明
COMMENT ON CONSTRAINT unique_phone ON profiles IS 
'確保每個手機號碼只能註冊一個帳號，空值不受此約束影響';