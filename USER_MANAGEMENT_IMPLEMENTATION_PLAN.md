# 🔐 使用者權限管理系統實施計劃

> **文件版本**: 1.0.0  
> **建立日期**: 2025-09-09  
> **專案**: Haude 農業電商平台  
> **優先級**: 高  
> **預估工時**: 7-11 小時  

## 📋 執行摘要

本文件描述如何為 Haude 平台建立一個安全的使用者權限管理系統，讓最高權限管理員能夠管理所有使用者的權限設定。

### 核心需求
- ✅ 只有超級管理員可以管理使用者權限
- ✅ 完整的審計追蹤記錄
- ✅ 防止權限提升攻擊
- ✅ 直觀的管理介面

## 🏗️ 系統架構

### 權限層級設計

```
┌─────────────────┐
│  super-admin    │ ← 新增（最高權限）
├─────────────────┤
│     admin       │ ← 現有（一般管理員）
├─────────────────┤
│    customer     │ ← 現有（一般使用者）
└─────────────────┘
```

#### 權限說明

| 角色 | 權限範圍 | 數量限制 |
|------|---------|---------|
| **super-admin** | • 管理所有使用者權限<br>• 提升/降級管理員<br>• 存取所有管理功能 | 1-2 位 |
| **admin** | • 管理產品、新聞、文化內容<br>• 查看報表和分析<br>• ❌ 不能修改權限 | 無限制 |
| **customer** | • 瀏覽產品<br>• 提交詢問單<br>• 管理個人資料 | 無限制 |

## 📐 實施階段

### 第一階段：資料庫架構更新（1-2小時）

#### 1.1 更新 profiles 表格

```sql
-- 方案一：擴展 role 欄位
ALTER TABLE profiles 
ALTER COLUMN role TYPE text;

-- 更新 CHECK 約束
ALTER TABLE profiles 
ADD CONSTRAINT valid_role 
CHECK (role IN ('customer', 'admin', 'super-admin'));

-- 方案二：新增獨立欄位（推薦）
ALTER TABLE profiles 
ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
```

#### 1.2 建立 Row Level Security (RLS) 政策

```sql
-- 防止使用者自行修改權限
CREATE POLICY "Users cannot update own role" ON profiles
FOR UPDATE USING (
  auth.uid() = id
) WITH CHECK (
  (OLD.role = NEW.role AND OLD.is_super_admin = NEW.is_super_admin) 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  )
);

-- 只有超級管理員可以查看所有使用者
CREATE POLICY "Super admins can view all users" ON profiles
FOR SELECT USING (
  id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  )
);
```

### 第二階段：後端 API 開發（2-3小時）

#### 2.1 建立權限中間件

**檔案**: `src/lib/api-middleware/super-admin.ts`

```typescript
import { NextRequest } from 'next/server'
import { requireAuth } from './auth'
import { AuthorizationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'

export function requireSuperAdmin(handler: AuthenticatedHandler) {
  return requireAuth(async (req: NextRequest, { user }) => {
    // 檢查超級管理員權限
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_super_admin) {
      apiLogger.warn('未授權的超級管理員存取嘗試', {
        userId: user.id,
        path: req.url
      })
      throw new AuthorizationError('需要超級管理員權限')
    }
    
    return handler(req, { user, isSuperAdmin: true })
  })
}
```

#### 2.2 使用者管理 API

**檔案**: `src/app/api/admin/users/route.ts`

```typescript
// GET - 列出所有使用者
export const GET = requireSuperAdmin(async (req, { user }) => {
  const users = await userManagementService.getAllUsers()
  
  // 審計日誌
  await auditLogService.log({
    user_id: user.id,
    action: 'view_list',
    resource_type: 'user_management',
    metadata: { total_users: users.length }
  })
  
  return success(users, '取得使用者列表成功')
})
```

**檔案**: `src/app/api/admin/users/[id]/route.ts`

```typescript
// PATCH - 更新使用者權限
export const PATCH = requireSuperAdmin(async (req, { user }) => {
  const { id } = await params
  const { role, is_super_admin } = await req.json()
  
  // 防止自己降級自己
  if (id === user.id && is_super_admin === false) {
    throw new ValidationError('無法移除自己的超級管理員權限')
  }
  
  const updatedUser = await userManagementService.updateUserRole(
    id, 
    role, 
    is_super_admin
  )
  
  // 審計日誌
  await auditLogService.log({
    user_id: user.id,
    action: 'update',
    resource_type: 'user_management',
    resource_id: id,
    metadata: {
      changes: { role, is_super_admin },
      executor: user.email
    }
  })
  
  return success(updatedUser, '權限更新成功')
})
```

### 第三階段：前端頁面開發（3-4小時）

#### 3.1 使用者管理頁面

**檔案**: `src/app/admin/users/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import UserTable from '@/components/admin/UserTable'
import { userApi } from '@/lib/api-client'

export default function UserManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 權限檢查
  useEffect(() => {
    if (!user?.is_super_admin) {
      router.push('/admin/dashboard')
      toast.error('您沒有權限存取此頁面')
    }
  }, [user])
  
  // 載入使用者列表
  const loadUsers = async () => {
    try {
      const data = await userApi.getAll()
      setUsers(data)
    } catch (error) {
      toast.error('載入使用者失敗')
    } finally {
      setLoading(false)
    }
  }
  
  // 更新權限
  const handleRoleUpdate = async (userId, newRole) => {
    // 二次確認
    const confirmed = await confirm({
      title: '確認權限變更',
      message: `確定要將使用者權限變更為 ${newRole} 嗎？`,
      confirmText: '確認變更',
      type: 'warning'
    })
    
    if (!confirmed) return
    
    try {
      await userApi.updateRole(userId, newRole)
      toast.success('權限更新成功')
      loadUsers() // 重新載入
    } catch (error) {
      toast.error('權限更新失敗')
    }
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">使用者權限管理</h1>
      
      {/* 警告訊息 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          ⚠️ 注意：權限變更會立即生效，請謹慎操作
        </p>
      </div>
      
      {/* 使用者表格 */}
      <UserTable 
        users={users}
        onRoleUpdate={handleRoleUpdate}
        currentUserId={user?.id}
      />
    </div>
  )
}
```

#### 3.2 使用者表格元件

**檔案**: `src/components/admin/UserTable.tsx`

```typescript
interface UserTableProps {
  users: User[]
  onRoleUpdate: (userId: string, role: string) => void
  currentUserId: string
}

export default function UserTable({ users, onRoleUpdate, currentUserId }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th>Email</th>
          <th>名稱</th>
          <th>當前角色</th>
          <th>註冊時間</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>{user.name}</td>
            <td>
              <RoleBadge role={user.role} isSuperAdmin={user.is_super_admin} />
            </td>
            <td>{formatDate(user.created_at)}</td>
            <td>
              {user.id !== currentUserId ? (
                <RoleSelector 
                  currentRole={user.role}
                  onSelect={(role) => onRoleUpdate(user.id, role)}
                />
              ) : (
                <span className="text-gray-400">（自己）</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 第四階段：安全加固（1-2小時）

#### 4.1 安全措施清單

- [ ] **CSRF 保護**: 確認所有 API 都有 CSRF token 驗證
- [ ] **Rate Limiting**: 限制權限更新 API 的請求頻率
- [ ] **審計日誌**: 所有操作都要記錄
- [ ] **二次驗證**: 重要操作需要確認對話框
- [ ] **Session 管理**: 權限變更後強制重新登入

#### 4.2 監控與告警

```typescript
// 監控異常權限變更
const monitorPermissionChanges = async () => {
  const recentChanges = await auditLogService.getRecentChanges({
    resource_type: 'user_management',
    limit: 10
  })
  
  // 檢查異常模式
  const suspiciousPatterns = [
    // 短時間內大量權限變更
    recentChanges.filter(c => c.action === 'update').length > 5,
    // 非工作時間的變更
    recentChanges.some(c => isOutsideWorkingHours(c.created_at))
  ]
  
  if (suspiciousPatterns.some(Boolean)) {
    await sendAlertToAdmins('異常權限變更活動偵測')
  }
}
```

## 📁 檔案結構

```
src/
├── app/
│   ├── admin/
│   │   └── users/
│   │       ├── page.tsx                 # 使用者列表頁面
│   │       └── [id]/
│   │           └── page.tsx              # 使用者詳情頁面
│   └── api/
│       └── admin/
│           └── users/
│               ├── route.ts              # GET (列表), POST (新增)
│               └── [id]/
│                   └── route.ts          # GET, PATCH, DELETE
├── components/
│   └── admin/
│       ├── UserTable.tsx                # 使用者表格
│       ├── RoleSelector.tsx             # 角色選擇器
│       ├── RoleBadge.tsx                # 角色標籤
│       └── UserPermissionModal.tsx      # 權限編輯彈窗
├── lib/
│   ├── api-middleware/
│   │   └── super-admin.ts               # 超級管理員中間件
│   ├── services/
│   │   └── userManagementService.ts     # 使用者管理服務
│   └── hooks/
│       └── useUserManagement.ts         # 使用者管理 Hook
└── types/
    └── user-management.ts               # 類型定義
```

## 🚀 部署步驟

### 開發環境

1. **資料庫遷移**
   ```bash
   npm run db:migrate
   ```

2. **設定第一個超級管理員**
   ```sql
   -- 在 Supabase SQL Editor 執行
   UPDATE profiles 
   SET is_super_admin = true 
   WHERE email = 'your-email@example.com';
   ```

3. **測試**
   ```bash
   npm run test:user-management
   ```

### 生產環境

1. **備份資料庫**
2. **執行資料庫遷移**
3. **部署程式碼**
4. **驗證功能**
5. **監控審計日誌**

## ⚠️ 風險與緩解措施

| 風險 | 影響 | 緩解措施 |
|-----|------|---------|
| 權限提升攻擊 | 高 | RLS 政策 + API 驗證 + 審計日誌 |
| 超級管理員帳號被盜 | 極高 | 2FA + IP 白名單 + 異常行為監控 |
| 誤操作導致權限錯誤 | 中 | 二次確認 + 操作歷史 + 快速回復機制 |
| 系統漏洞 | 高 | 定期安全審計 + 滲透測試 |

## 📊 成功指標

- ✅ 所有權限變更都有審計記錄
- ✅ 無未授權的權限提升事件
- ✅ 管理介面回應時間 < 2秒
- ✅ 零安全事件
- ✅ 管理員滿意度 > 90%

## 🔄 維護計劃

### 每日
- 檢查審計日誌異常
- 監控系統效能

### 每週
- 審查權限變更記錄
- 檢查異常登入嘗試

### 每月
- 權限審計報告
- 安全漏洞掃描
- 備份恢復測試

## 📚 相關文件

- [API 安全指南](./API_SECURITY.md)
- [審計日誌系統](./AUDIT_SYSTEM.md)
- [資料庫架構](./DATABASE_SCHEMA.md)
- [前端元件庫](./COMPONENT_LIBRARY.md)

## 👥 負責團隊

- **技術負責人**: 後端架構師
- **前端開發**: UI/UX 團隊
- **安全審核**: 資安團隊
- **測試**: QA 團隊

## 📝 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| 1.0.0 | 2025-09-09 | 初始版本 | Claude |

---

**注意事項**：
1. 實施前請確保有完整的資料庫備份
2. 建議在測試環境先行驗證
3. 所有變更都需要經過安全審核
4. 保持文件同步更新