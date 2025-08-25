# RLS 安全修復指南

## 📋 概述

此文件說明如何修復 `SECURITY_IMPROVEMENTS.md` 中標識的高優先級安全問題：**部分資料表缺乏 RLS 保護**。

## 🔍 問題描述

### 受影響的表格
- **profiles** - 用戶個人資料表
- **user_interests** - 用戶興趣表

### 安全風險
- 任何登入用戶都可能存取他人的私人資料
- 違反最小權限原則
- 資料隱私洩露風險

## 🛠️ 修復方案

### 檔案列表
- `supabase/migrations/013_restore_rls_security.sql` - 主要修復 migration
- `scripts/test-rls.sql` - 測試驗證腳本  
- `RLS_SECURITY_FIX.md` - 此說明文件

## 🚀 部署步驟

### 步驟 1: 套用 Migration（開發環境）

```bash
# 進入專案目錄
cd /path/to/your/project

# 套用 migration
npx supabase migration up
# 或
supabase db push
```

### 步驟 2: 驗證修復效果

在 Supabase Dashboard 的 SQL Editor 中執行：

```sql
-- 檢查 RLS 是否已啟用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_interests');

-- 應該返回：
-- schemaname | tablename      | rowsecurity
-- public     | profiles       | t
-- public     | user_interests | t
```

### 步驟 3: 功能測試

1. **透過應用程式測試**：
   - 登入普通用戶帳號
   - 確認只能看到自己的個人資料
   - 確認不能修改他人資料

2. **管理員功能測試**：
   - 登入管理員帳號
   - 確認可以查看所有用戶資料
   - 確認管理功能正常運作

3. **新用戶註冊測試**：
   - 註冊新用戶
   - 確認 profile 自動創建
   - 確認 RLS 正常運作

## 📊 RLS 政策說明

### profiles 表政策

| 政策名稱 | 操作 | 條件 | 說明 |
|----------|------|------|------|
| `users_view_own_profile` | SELECT | `auth.uid() = id` | 用戶查看自己的資料 |
| `users_update_own_profile` | UPDATE | `auth.uid() = id` | 用戶更新自己的資料 |
| `system_insert_profiles` | INSERT | `true` | 系統觸發器創建資料 |
| `admins_view_all_profiles` | SELECT | 檢查管理員角色 | 管理員查看所有資料 |
| `admins_update_all_profiles` | UPDATE | 檢查管理員角色 | 管理員更新所有資料 |

### user_interests 表政策

| 政策名稱 | 操作 | 條件 | 說明 |
|----------|------|------|------|
| `users_view_own_interests` | SELECT | `user_id = auth.uid()` | 查看自己的興趣 |
| `users_insert_own_interests` | INSERT | `user_id = auth.uid()` | 新增自己的興趣 |
| `users_update_own_interests` | UPDATE | `user_id = auth.uid()` | 更新自己的興趣 |
| `users_delete_own_interests` | DELETE | `user_id = auth.uid()` | 刪除自己的興趣 |
| `admins_view_all_interests` | SELECT | 檢查管理員角色 | 管理員查看所有興趣 |

## ⚠️ 重要注意事項

### 部署前檢查
- [ ] 確保在測試環境完整驗證
- [ ] 備份生產資料庫
- [ ] 通知團隊成員部署時間
- [ ] 準備回滾計畫

### 可能的問題和解決方案

#### 1. "permission denied for table" 錯誤
**原因**：基本表權限不足  
**解決**：Migration 中已包含權限設定，重新執行 migration

#### 2. "new row violates row-level security policy" 錯誤  
**原因**：INSERT 政策的 WITH CHECK 條件過於嚴格  
**解決**：檢查插入的資料是否符合政策條件

#### 3. 管理員看不到所有資料
**原因**：管理員檢查政策問題  
**解決**：確認用戶的 role 欄位為 'admin'

#### 4. 應用程式功能異常
**原因**：應用程式邏輯與 RLS 政策不匹配  
**解決**：檢查應用程式的資料庫查詢邏輯

## 🧪 測試案例

### 自動化測試（建議實作）

```typescript
// 範例：Jest 測試
describe('RLS Security Tests', () => {
  test('普通用戶只能查看自己的 profile', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      
    expect(data).toHaveLength(1) // 只有自己的資料
    expect(data[0].id).toBe(currentUser.id)
  })
  
  test('普通用戶不能插入他人的 interests', async () => {
    const { error } = await supabase
      .from('user_interests')
      .insert({ user_id: 'other-user-id', interest_name: 'test' })
      
    expect(error).toBeTruthy() // 應該失敗
  })
})
```

## 📈 效能考量

### 索引優化
Migration 中的政策使用了現有索引：
- `profiles(id)` - PRIMARY KEY
- `profiles(role)` - 已存在的索引
- `user_interests(user_id)` - 外鍵索引

### 查詢性能
- RLS 政策會增加少量查詢開銷
- 對於小型到中型應用影響微乎其微
- 可透過 `EXPLAIN ANALYZE` 監控性能

## 🔄 回滾計畫

如果需要緊急回滾：

```sql
-- 緊急停用 RLS（僅限緊急情況）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;
```

但強烈建議：
1. 找出根本問題
2. 建立新的 migration 修復
3. 重新啟用 RLS

## ✅ 部署檢查清單

### 開發環境
- [ ] 套用 migration
- [ ] 執行測試腳本
- [ ] 驗證基本功能
- [ ] 測試用戶權限
- [ ] 測試管理員權限

### 生產環境部署
- [ ] 備份資料庫
- [ ] 在維護時段部署
- [ ] 套用 migration
- [ ] 執行冒煙測試
- [ ] 監控錯誤日誌
- [ ] 確認應用程式正常運作

## 📞 支援

如果遇到問題：
1. 檢查 `scripts/test-rls.sql` 中的故障排除指南
2. 查看 Supabase 日誌
3. 參考 PostgreSQL RLS 文檔
4. 聯絡開發團隊

---

**修復日期**: 2025-08-25  
**相關問題**: SECURITY_IMPROVEMENTS.md 第 55-61 行  
**影響等級**: 高優先級安全問題  
**測試狀態**: ✅ Migration 已建立，等待測試驗證