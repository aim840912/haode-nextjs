# RLS 安全修復完整指南

## 問題描述

執行 `supabase/migrations/013_restore_rls_security.sql` 時遇到多個問題：

### 1. Audit Logs 約束問題
```
ERROR: 23514: new row for relation "audit_logs" violates check constraint "audit_logs_resource_type_check"
DETAIL: Failing row contains (..., security_policy, ...)
```

### 2. RLS 無限遞迴問題
```
ERROR: 42P17: infinite recursion detected in policy for relation "profiles"
```
以及多個 "Error fetching user interests" 錯誤。

## 問題分析

### 1. Audit Logs 約束問題
**根本原因：** audit_logs 表的 `resource_type` 檢查約束過於限制

- **現有約束**：只允許 `'inquiry'`, `'inquiry_item'`, `'customer_data'`
- **衝突操作**：013 遷移嘗試插入 `'security_policy'` 類型
- **檔案位置**：約束定義在 `supabase/migrations/010_create_audit_logs.sql:12`

### 2. RLS 無限遞迴問題
**根本原因：** RLS 政策在檢查管理員權限時查詢 profiles 表，形成自我引用循環

- **問題政策**：`admins_view_all_profiles` 和 `admins_update_all_profiles`
- **遞迴路徑**：查詢 profiles → 檢查 RLS → 查詢 profiles → 無限循環
- **影響範圍**：profiles 和 user_interests 表都受影響

## 解決方案

此修復需要按順序執行兩個步驟來解決兩個不同的問題。

### 步驟 1：修復 Audit Logs 約束問題

**前往 Supabase Dashboard** → **SQL Editor** → **執行以下 SQL**：

```sql
-- 移除舊約束
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_resource_type_check;

-- 建立新約束，支援更多操作類型
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_resource_type_check 
CHECK (resource_type IN (
  -- 業務相關操作
  'inquiry', 
  'inquiry_item', 
  'customer_data',
  -- 系統管理操作
  'security_policy',     -- 安全政策相關操作
  'system_config',       -- 系統設定相關操作
  'migration',          -- 資料庫遷移操作
  'user_management',    -- 用戶管理操作
  'data_maintenance'    -- 資料維護操作
));
```

### 步驟 2：修復 RLS 無限遞迴問題

從錯誤截圖可以看到系統仍有無限遞迴問題，請選擇以下方案之一：

#### 🎯 方案 A：完整修復（推薦）
**適合：需要管理員功能的完整系統**

在 Supabase Dashboard → SQL Editor 中，複製並執行：
```
scripts/complete-rls-fix.sql
```

**特色**：
- ✅ 徹底清理所有問題政策
- ✅ 建立 public.is_admin() 安全函數
- ✅ 完整的管理員和用戶權限
- ✅ 內建驗證，立即看到修復結果

#### 🚀 方案 B：最小化修復（簡單快速）
**適合：只需要基本用戶功能的系統**

在 Supabase Dashboard → SQL Editor 中，複製並執行：
```
scripts/minimal-rls-fix.sql
```

**特色**：
- ✅ 快速解決遞迴問題
- ✅ 用戶可以管理自己的數據
- ❌ 沒有管理員功能（避免複雜性）
- ✅ 極簡政策，不易出錯

#### 🆘 如果上述方案都失敗

先執行 `scripts/emergency-rls-cleanup.sql` 完全停用 RLS，然後重新選擇方案。

### 步驟 3：驗證修復

執行驗證腳本：

**驗證約束修復**：
```bash
npx tsx scripts/verify-audit-fix.ts
```

**驗證 RLS 修復（推薦）**：
```bash
npx tsx scripts/verify-rls-simple.ts
```

預期輸出：
```
🎉 RLS 修復成功！
✅ 關鍵功能正常:
  • 無限遞迴問題已解決
  • 基本資料庫操作正常
```

**注意**：如果遇到 "Could not find the table 'public.pg_class'" 錯誤，請使用簡化驗證腳本，它避免了系統表查詢問題。

## 可用腳本

本專案提供了以下輔助腳本：

### 1. 診斷腳本
```bash
npx tsx scripts/fix-audit-constraint.ts
```
- 檢測當前約束狀態
- 提供修復建議

### 2. 完整修復腳本 ⭐
`scripts/complete-rls-fix.sql`
- **推薦使用**：完全解決遞迴問題
- 動態清理所有問題政策
- 建立 public.is_admin() 安全函數
- 重建完整的管理員和用戶權限
- 內建驗證查詢

### 3. 最小化修復腳本 🚀
`scripts/minimal-rls-fix.sql`
- **簡單快速**：只保留基本用戶功能
- 移除所有管理員功能（避免遞迴）
- 適合不需要複雜權限的簡單系統

### 4. 緊急清理腳本
`scripts/emergency-rls-cleanup.sql`
- 立即停用有問題的 RLS 政策
- 僅用於緊急情況
- ⚠️ 會暫時移除所有存取控制

### 5. 驗證腳本
```bash
# 驗證約束修復
npx tsx scripts/verify-audit-fix.ts

# 驗證 RLS 修復（推薦）
npx tsx scripts/verify-rls-simple.ts

# 完整驗證（可能有系統表查詢問題）
npx tsx scripts/verify-rls-fix.ts
```
- **verify-rls-simple.ts**：推薦使用，避免系統表查詢問題
- 專注功能性測試而非技術細節檢查
- 自動識別使用的修復方案
- 自動清理測試資料

## 新支援的 resource_type

修復後，audit_logs 表將支援以下類型：

| 類型 | 用途 | 範例 |
|------|------|------|
| **業務操作** | | |
| `inquiry` | 詢價記錄 | 查看、創建詢價 |
| `inquiry_item` | 詢價項目 | 添加、修改詢價項目 |
| `customer_data` | 客戶資料 | 客戶資料存取 |
| **系統操作** | | |
| `security_policy` | 安全政策 | RLS 政策變更 |
| `system_config` | 系統設定 | 設定檔修改 |
| `migration` | 資料庫遷移 | 結構變更記錄 |
| `user_management` | 用戶管理 | 角色權限變更 |
| `data_maintenance` | 資料維護 | 清理、備份操作 |

## 注意事項

1. **向後兼容性**：原有的 resource_type 類型完全保留
2. **安全性**：新約束仍然限制只能使用預定義類型
3. **擴展性**：未來如需新類型，需修改約束定義
4. **審計完整性**：所有系統操作都能被正確記錄

## 故障排除

### 如果修復後仍有問題

1. **檢查 Supabase 連線**：
   ```bash
   npm run test:supabase
   ```

2. **驗證當前約束**：
   ```sql
   SELECT conname, consrc 
   FROM pg_constraint 
   WHERE conrelid = 'audit_logs'::regclass 
   AND conname = 'audit_logs_resource_type_check';
   ```

3. **重新創建約束**（如果仍有問題）：
   ```sql
   ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_resource_type_check;
   -- 然後重新執行新約束 SQL
   ```

### 聯絡資訊

如遇問題，請檢查：
- `.env.local` 環境變數是否正確
- Supabase 專案狀態是否正常
- 網路連線是否穩定

## 技術細節

### RLS 修復機制

新建立的 `public.is_admin()` 函數使用 `SECURITY DEFINER` 權限：

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;
```

**關鍵特性**：
- `SECURITY DEFINER`：以函數創建者權限執行，繞過 RLS
- `SET search_path`：確保在正確的 schema 中執行
- 錯誤處理：任何問題都安全地返回 false

### 修復前後對比

**修復前（有問題的政策）**：
```sql
CREATE POLICY "admins_view_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile  -- ❌ 遞迴查詢
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );
```

**修復後（安全的政策）**：
```sql
CREATE POLICY "admins_view_all_profiles" ON profiles
  FOR SELECT USING (public.is_admin());  -- ✅ 使用安全函數
```

## 相關檔案

### 遷移檔案
- `supabase/migrations/010_create_audit_logs.sql` - 原始表格定義
- `supabase/migrations/013_restore_rls_security.sql` - 有問題的 RLS 修復遷移
- `supabase/migrations/014_update_audit_logs_constraint.sql` - 約束更新遷移
- ~~`supabase/migrations/015_fix_rls_recursion.sql`~~ - ❌ auth schema 權限問題
- `supabase/migrations/016_fix_rls_recursion_public.sql` - ✅ 正確的 RLS 修復遷移

### 輔助腳本
- `scripts/fix-audit-constraint.ts` - 診斷約束問題
- `scripts/verify-audit-fix.ts` - 驗證約束修復
- **`scripts/complete-rls-fix.sql`** - ⭐ 完整的 RLS 修復腳本
- **`scripts/minimal-rls-fix.sql`** - 🚀 最小化 RLS 修復腳本
- `scripts/emergency-rls-cleanup.sql` - 緊急 RLS 清理
- **`scripts/verify-rls-simple.ts`** - 🎯 簡化的 RLS 驗證腳本（推薦）
- `scripts/verify-rls-fix.ts` - 完整驗證（可能有系統表問題）