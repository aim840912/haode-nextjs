# 開發筆記/待辦事項管理系統

## 功能概述

建立一個完整的 Bug 追蹤和 TodoList 管理系統，供開發者手動記錄問題和待辦事項。

---

## 第一階段：資料庫設計

### 建立 `dev_notes` 表

**SQL Migration 檔案**: `supabase/migrations/003_create_dev_notes_table.sql`

```sql
-- 開發筆記/待辦事項表
CREATE TABLE IF NOT EXISTS public.dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'todo', 'feature', 'improvement')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  tags TEXT[], -- PostgreSQL 陣列，儲存標籤
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_dev_notes_type ON public.dev_notes(type);
CREATE INDEX idx_dev_notes_status ON public.dev_notes(status);
CREATE INDEX idx_dev_notes_priority ON public.dev_notes(priority);
CREATE INDEX idx_dev_notes_created_by ON public.dev_notes(created_by);
CREATE INDEX idx_dev_notes_assigned_to ON public.dev_notes(assigned_to);
CREATE INDEX idx_dev_notes_created_at ON public.dev_notes(created_at DESC);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_dev_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dev_notes_updated_at
  BEFORE UPDATE ON public.dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_notes_updated_at();

-- RLS 政策：只有管理員可以存取
ALTER TABLE public.dev_notes ENABLE ROW LEVEL SECURITY;

-- 管理員可以查看所有記錄
CREATE POLICY "Admins can view all dev notes"
  ON public.dev_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以新增記錄
CREATE POLICY "Admins can insert dev notes"
  ON public.dev_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以更新記錄
CREATE POLICY "Admins can update dev notes"
  ON public.dev_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 管理員可以刪除記錄
CREATE POLICY "Admins can delete dev notes"
  ON public.dev_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 第二階段：TypeScript 類型定義

### 檔案：`src/types/devNote.ts`

```typescript
/**
 * 開發筆記類型定義
 */

export type DevNoteType = 'bug' | 'todo' | 'feature' | 'improvement'
export type DevNotePriority = 'low' | 'medium' | 'high' | 'urgent'
export type DevNoteStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface DevNote {
  id: string
  title: string
  description: string | null
  type: DevNoteType
  priority: DevNotePriority
  status: DevNoteStatus
  tags: string[] | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface DevNoteWithUser extends DevNote {
  creator_name?: string
  assignee_name?: string
}

export interface DevNoteInput {
  title: string
  description?: string
  type: DevNoteType
  priority?: DevNotePriority
  status?: DevNoteStatus
  tags?: string[]
  assigned_to?: string
}

export interface DevNoteUpdate {
  title?: string
  description?: string
  type?: DevNoteType
  priority?: DevNotePriority
  status?: DevNoteStatus
  tags?: string[]
  assigned_to?: string
  completed_at?: string | null
}

export interface DevNoteStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  by_type: {
    bug: number
    todo: number
    feature: number
    improvement: number
  }
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
}
```

---

## 第三階段：API 路由

### 1. 列表查詢 API

**檔案**: `src/app/api/admin/dev-notes/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success, created } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import { DevNoteInput } from '@/types/devNote'

async function handleGET(request: NextRequest, user: User) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const supabase = await createClient()

  let query = supabase
    .from('dev_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data, error } = await query

  if (error) throw error

  return success(data, '查詢成功')
}

async function handlePOST(request: NextRequest, user: User) {
  const body: DevNoteInput = await request.json()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dev_notes')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return created(data, '建立成功')
}

export const GET = withAdminAndError(handleGET, {
  module: 'DevNotesAPI',
  enableAuditLog: false,
})

export const POST = withAdminAndError(handlePOST, {
  module: 'DevNotesAPI',
  enableAuditLog: true,
})
```

### 2. 單筆操作 API

**檔案**: `src/app/api/admin/dev-notes/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import { DevNoteUpdate } from '@/types/devNote'

async function handleGET(
  request: NextRequest,
  user: User,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dev_notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return success(data, '查詢成功')
}

async function handlePATCH(
  request: NextRequest,
  user: User,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body: DevNoteUpdate = await request.json()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dev_notes')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return success(data, '更新成功')
}

async function handleDELETE(
  request: NextRequest,
  user: User,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { error } = await supabase
    .from('dev_notes')
    .delete()
    .eq('id', id)

  if (error) throw error

  return success(null, '刪除成功')
}

export const GET = withAdminAndError(handleGET, { module: 'DevNoteAPI' })
export const PATCH = withAdminAndError(handlePATCH, { module: 'DevNoteAPI', enableAuditLog: true })
export const DELETE = withAdminAndError(handleDELETE, { module: 'DevNoteAPI', enableAuditLog: true })
```

### 3. 統計 API

**檔案**: `src/app/api/admin/dev-notes/stats/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import { DevNoteStats } from '@/types/devNote'

async function handleGET(request: NextRequest, user: User) {
  const supabase = await createClient()

  const { data: allNotes } = await supabase
    .from('dev_notes')
    .select('type, status, priority')

  if (!allNotes) {
    return success({
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      by_type: { bug: 0, todo: 0, feature: 0, improvement: 0 },
      by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
    } as DevNoteStats)
  }

  const stats: DevNoteStats = {
    total: allNotes.length,
    pending: allNotes.filter(n => n.status === 'pending').length,
    in_progress: allNotes.filter(n => n.status === 'in_progress').length,
    completed: allNotes.filter(n => n.status === 'completed').length,
    cancelled: allNotes.filter(n => n.status === 'cancelled').length,
    by_type: {
      bug: allNotes.filter(n => n.type === 'bug').length,
      todo: allNotes.filter(n => n.type === 'todo').length,
      feature: allNotes.filter(n => n.type === 'feature').length,
      improvement: allNotes.filter(n => n.type === 'improvement').length,
    },
    by_priority: {
      low: allNotes.filter(n => n.priority === 'low').length,
      medium: allNotes.filter(n => n.priority === 'medium').length,
      high: allNotes.filter(n => n.priority === 'high').length,
      urgent: allNotes.filter(n => n.priority === 'urgent').length,
    },
  }

  return success(stats, '統計查詢成功')
}

export const GET = withAdminAndError(handleGET, {
  module: 'DevNoteStatsAPI',
  enableAuditLog: false,
})
```

---

## 第四階段：前端管理頁面

### 檔案：`src/app/admin/dev-notes/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminProtection from '@/components/features/admin/AdminProtection'
import {
  BugAntIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  FunnelIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { DevNote, DevNoteStats, DevNoteType, DevNoteStatus, DevNotePriority } from '@/types/devNote'

export default function DevNotesPage() {
  const [notes, setNotes] = useState<DevNote[]>([])
  const [stats, setStats] = useState<DevNoteStats | null>(null)
  const [loading, setLoading] = useState(true)

  // 篩選狀態
  const [typeFilter, setTypeFilter] = useState<DevNoteType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DevNoteStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<DevNotePriority | 'all'>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [typeFilter, statusFilter, priorityFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入統計
      const statsRes = await fetch('/api/admin/dev-notes/stats')
      const statsData = await statsRes.json()
      setStats(statsData.data)

      // 載入列表
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)

      const notesRes = await fetch(`/api/admin/dev-notes?${params}`)
      const notesData = await notesRes.json()
      setNotes(notesData.data)
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">開發筆記</h1>
                  <p className="text-sm text-gray-600 mt-1">Bug 追蹤與待辦事項管理</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>新增筆記</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 統計卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="總計"
                value={stats.total}
                icon={ClipboardDocumentListIcon}
                color="blue"
              />
              <StatCard
                title="進行中"
                value={stats.in_progress}
                icon={BugAntIcon}
                color="yellow"
              />
              <StatCard
                title="已完成"
                value={stats.completed}
                icon={ClipboardDocumentListIcon}
                color="green"
              />
              <StatCard
                title="高優先級"
                value={stats.by_priority.high + stats.by_priority.urgent}
                icon={BugAntIcon}
                color="red"
              />
            </div>
          )}

          {/* 篩選器 */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有類型</option>
                <option value="bug">Bug</option>
                <option value="todo">待辦</option>
                <option value="feature">新功能</option>
                <option value="improvement">改進</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有狀態</option>
                <option value="pending">待處理</option>
                <option value="in_progress">進行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">所有優先級</option>
                <option value="urgent">緊急</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          {/* 列表 */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">載入中...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">暫無記錄</div>
            ) : (
              notes.map(note => (
                <NoteCard key={note.id} note={note} onUpdate={loadData} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 新增 Modal - 待實作 */}
      {showCreateModal && (
        <div>CreateModal Component</div>
      )}
    </AdminProtection>
  )
}

// 統計卡片元件
function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

// 筆記卡片元件
function NoteCard({ note, onUpdate }: { note: DevNote; onUpdate: () => void }) {
  const typeColors = {
    bug: 'bg-red-100 text-red-800',
    todo: 'bg-blue-100 text-blue-800',
    feature: 'bg-purple-100 text-purple-800',
    improvement: 'bg-green-100 text-green-800',
  }

  const priorityColors = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-gray-500 text-white',
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[note.type]}`}>
              {note.type}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[note.priority]}`}>
              {note.priority}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[note.status]}`}>
              {note.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
          {note.description && (
            <p className="text-gray-600 text-sm">{note.description}</p>
          )}
          <div className="mt-3 text-xs text-gray-500">
            建立時間：{new Date(note.created_at).toLocaleString('zh-TW')}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 第五階段：Dashboard 整合

### 修改 `src/app/admin/dashboard/page.tsx`

在管理控制台新增「開發筆記」卡片：

```typescript
{/* 開發筆記卡片 */}
<Link href="/admin/dev-notes" className="group">
  <div className="bg-white p-6 rounded-xl shadow-sm border group-hover:shadow-md transition-shadow">
    <div className="flex items-center">
      <div className="p-3 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
        <BugAntIcon className="h-8 w-8 text-rose-600" />
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">開發筆記</h3>
        <p className="text-sm text-gray-600">Bug 追蹤與待辦事項</p>
      </div>
    </div>
  </div>
</Link>
```

記得在檔案開頭 import：

```typescript
import { BugAntIcon } from '@heroicons/react/24/outline'
```

---

## 進階功能（可選實作）

### 1. Markdown 編輯器
- 使用 `react-markdown` 或 `@uiw/react-md-editor`
- 在描述欄位支援 Markdown 語法
- 預覽模式

### 2. 檔案附件
- 整合現有的 `uploadSiteSettingImage` API
- 支援截圖、日誌檔案上傳
- 圖片預覽功能

### 3. 評論系統
- 建立 `dev_note_comments` 表
- 支援多人協作討論
- Email 通知

### 4. GitHub Issues 整合
- 使用 GitHub API
- 同步 Issues 到開發筆記
- 雙向同步狀態

### 5. 統計圖表
- 使用 `recharts` 或 `chart.js`
- Bug 趨勢圖
- 完成率統計

---

## 部署檢查清單

- [ ] 執行 SQL migration 建立表格
- [ ] 新增類型定義檔案
- [ ] 實作 API 路由
- [ ] 建立管理頁面
- [ ] 在 Dashboard 新增入口
- [ ] 測試 CRUD 功能
- [ ] 測試篩選與搜尋
- [ ] 測試 RLS 權限
- [ ] 部署到 Vercel

---

## 測試指令

```bash
# 本地測試
npm run dev

# 檢查 TypeScript 類型
npm run type-check

# 檢查 Lint
npm run lint

# 執行 Supabase Migration
supabase migration up
```

---

## 備註

- 所有 API 都使用 `withAdminAndError` 中間件，確保只有管理員可以存取
- 使用 Supabase RLS 政策進行額外的安全防護
- 參考 `inquiries` 模組的架構設計
- 遵循專案現有的程式碼規範和資料夾結構
