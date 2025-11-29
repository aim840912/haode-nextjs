# 開發指南

## 📑 目錄

- [🚀 快速開始](#-快速開始)
- [📈 優化歷史](#-優化歷史)
- [📐 通用開發規範](#-通用開發規範)
- [🌐 API 開發規範](#-api-開發規範)
- [💎 專案品質標準](#-專案品質標準)
- [✅ 維護檢查](#-維護檢查)

---

## 🚀 快速開始

### 5 秒速查

```bash
# 開發前必做
npm run type-check && npm run lint

# 常用指令
npm run dev          # 啟動開發伺服器
npm run type-check   # TypeScript 檢查
npm run lint         # 程式碼品質檢查
```

### 核心原則（3 條）

1. **使用繁體中文** - 所有溝通均使用繁體中文
2. **使用 TodoWrite 追蹤複雜任務** - 完成後立即標記 completed
3. **遵循專案規範** - 使用日誌系統 (apiLogger/dbLogger)、統一錯誤處理、API 中間件

### 常用指令

```bash
# 開發流程
npm run dev                          # 啟動開發伺服器 (Turbopack)
npm run type-check                   # 檢查 TypeScript 類型
npm run lint                         # 檢查程式碼品質

# 維護檢查
rm -rf .next/cache                   # 清理建置快取
npm audit                            # 安全性檢查
npm run analyze                      # Bundle 大小分析

# 依賴管理
npm ls | grep package-name           # 檢查套件
npx depcheck                         # 檢查未使用依賴
```

### Slash Commands

本專案可使用以下指令：

**專案特有指令**:
```bash
/api-check [API路徑]                 # API 開發完成檢查（中間件、錯誤處理、TypeScript）
/opt-status                          # 查看完整優化歷史
/simplify-architecture               # 執行架構簡化
/simplify-infrastructure             # 簡化基礎設施服務
```

**全域指令**（來自 `~/.claude/commands/`）:
```bash
/pre-dev-check [功能名稱]            # 開發前檢查（Code Reuse、依賴、架構、效能）
/major-change-check                  # 重大變更維護檢查
/release-check                       # 版本發布前檢查
/tech-debt-scan                      # 技術債掃描
/ultraplan                           # 深度規劃（Plan Mode）
/deepdive                            # 深度探索程式碼庫
/archdesign                          # 系統架構設計
/safereview                          # 安全的程式碼審查（唯讀）
```

### 檢查優化歷史

**⚠️ 重要：在建議任何優化前，請先執行以下指令**

```bash
/opt-status                          # 查看完整優化歷史
/opt-status pending                  # 查看待實施項目
/opt-status rejected                 # 查看已拒絕項目
```

**為什麼需要檢查？**
- 避免重複建議已實施的優化
- 了解哪些優化已被評估但拒絕（含原因）
- 掌握專案當前的優化狀態和效能指標

**詳細資訊**：查閱 `docs/optimization/OPTIMIZATION_HISTORY.md`

---

## 📈 優化歷史

本專案已實施和規劃的優化記錄在 **`docs/optimization/OPTIMIZATION_HISTORY.md`**。

### 已實施優化（8 項）

#### 🚀 效能優化
- ✅ Redis 快取（市場搜尋）
- ✅ Cloudflare R2 圖片 CDN

#### 🏗️ 架構改進
- ✅ 統一錯誤處理系統
- ✅ API 中間件組合系統
- ✅ 日誌系統標準化

#### 🔒 安全加固
- ✅ Bot Detection 系統
- ✅ Discord 帳號年齡驗證
- ✅ 配額系統（RPC 實作）

### 待評估優化（6 項）

#### 💰 成本優化
- 📋 調整 Middleware 匹配規則（⭐ 最高優先級）
  - 預期：減少 40-50% Function Invocations
- 📋 Edge Functions 遷移（6 個低風險 API）
  - 預期：成本降低 30-40%、延遲減少 60-70%
- 📋 客戶端快取 (`/api/auth/me`)
  - 預期：減少 60% 調用次數

#### 🚀 效能優化
- 📋 批次 API 請求
- 📋 WebSocket 即時通知
- 📋 資料庫查詢優化

### 使用規範

#### **建議優化前必須檢查**
```bash
/opt-status                 # 在提出任何優化建議前執行
```

#### **實施優化後更新記錄**
完成優化後，請更新 `OPTIMIZATION_HISTORY.md`：
1. 移動項目從「待評估」到「已實施」
2. 填寫實施日期、Commit hash、實際效果
3. 更新效能指標和統計資料

#### **評估但拒絕的優化**
如果某個優化被評估後決定不實施，請記錄到「已評估但未實施」區塊，說明拒絕原因。

**詳細文件**：`docs/optimization/OPTIMIZATION_HISTORY.md`

---

## 📐 通用開發規範

> **詳見全域規範：`~/.claude/CLAUDE.md`**
>
> 以下規範已在全域文件中定義，專案遵循相同標準：
> - **Claude 行為準則** - 執行原則、Git 提交流程、TodoWrite 使用規範
> - **開發理念** - 核心信念、永不與始終、決策框架、學習程式碼庫
> - **開發流程** - 實作流程、遇到困難時的處理
> - **程式碼品質標準** - 架構原則、品質標準、依賴管理、測試指南
> - **UI/UX 設計規範** - 禁止漸層、禁止 Emoji、使用 SVG 圖示
> - **品質閘門** - 完成定義

### 專案特定補充

**日誌系統**：使用專案日誌系統而非 `console.log`
- `apiLogger` - API 路由日誌
- `dbLogger` - 資料庫操作日誌

**圖示庫**：使用 `lucide-react`（已移除 @heroicons/react）

```typescript
import { Check, X, Search } from 'lucide-react'

<Check className="w-5 h-5 text-green-600" />
```

---

## 🌐 API 開發規範

### Error Handling

**專案已實施統一錯誤處理系統** - 請使用現有系統而不要建立新的錯誤處理機制

- **使用統一錯誤類別**: 從 `@/lib/errors` 匯入標準錯誤類別
- **使用錯誤處理中間件**: 在 API 路由中使用 `withErrorHandler`
- **使用統一回應格式**: 從 `@/lib/api-response` 匯入回應工具
- **整合 logger 系統**: 所有錯誤自動記錄到適當的日誌級別 (apiLogger)
- **包含除錯上下文**: 每個錯誤都有追蹤 ID 和詳細上下文
- **永不默默吐掉例外** - 所有例外都應適當處理和記錄
- **依賴 Sentry 做錯誤監控**: 已移除自建的 ErrorStatsCollector

**可用的錯誤類型**：

- `ValidationError` - 輸入驗證失敗 (400)
- `AuthorizationError` - 權限不足 (403)
- `NotFoundError` - 資源不存在 (404)
- `MethodNotAllowedError` - HTTP 方法不支援 (405)
- `DatabaseError` - 資料庫操作失敗 (500)
- `ErrorFactory.fromSupabaseError()` - 自動轉換 Supabase 錯誤

### API 中間件架構

**專案已實施統一的中間件組合系統** - 請使用組合函數而非手動組合

**推薦使用的組合函數**：

- `withAuthAndError` - 認證 + 錯誤處理（需要使用者登入）
- `withAdminAndError` - 管理員認證 + 錯誤處理（需要管理員權限）
- `withOptionalAuthAndError` - 可選認證 + 錯誤處理（公開 API 但可能需要使用者資訊）

**範例**：

```typescript
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'

// ✅ 正確：使用組合函數
async function handlePOST(req: NextRequest, user: User) {
  const data = await req.json()
  const result = await service.create(data, user.id)
  return success(result, '建立成功')
}

export const POST = withAuthAndError(handlePOST, {
  module: 'YourAPI',
  enableAuditLog: true
})

// ❌ 錯誤：缺少錯誤處理
export const POST = requireAuth(handlePOST)
```

**重要**：
- `requireAuth`/`requireAdmin` 只負責認證，**不包含**錯誤處理
- 處理函數必須接收 `(request: NextRequest, user: User)` 參數
- 使用組合函數時，錯誤會自動記錄到 apiLogger

### Next.js 15 動態路由參數處理

**重要**：Next.js 15 中，動態路由參數是 Promise，必須 await：

```typescript
// ✅ 正確：await params Promise
async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params  // 必須 await
  const data = await service.findById(id)
  return success(data, '查詢成功')
}

export const GET = withAuthAndError(handleGET, { module: 'ProductAPI' })
```

### Service 層架構 (統一服務模式)

> **詳見全域規範：`~/.claude/CLAUDE.md` → 附錄 E - Service 層架構**
>
> 全域規範包含完整的統一服務模式原則和範例。

**專案服務目錄**: `src/services/core/`

### 審計日誌策略

> **詳見全域規範：`~/.claude/CLAUDE.md` → 附錄 B - 審計日誌策略**
>
> 全域規範包含記錄策略和範例。

**專案補充**: 使用 `enableAuditLog: true` 在中間件選項中啟用

### API 開發完成檢查清單

API 開發完成後，**必須**執行 API 檢查：

```bash
/api-check [API 路徑或檔案]
```

**檢查項目**：
- ✅ 正確使用組合中間件（withAuthAndError/withAdminAndError）
- ✅ 使用標準錯誤類型和統一回應格式
- ✅ TypeScript 類型檢查通過，無 `any` 類型繞過
- ✅ 防止常見漏洞（SQL Injection、XSS 等）
- ✅ 使用統一 Service 層，避免 N+1 查詢
- ✅ 新功能必須有測試覆蓋

### Server Actions 開發規範

**專案已實施 Server Actions 架構** - 用於資料變更操作的現代化替代方案

#### 何時使用 Server Actions

> **詳見全域規範：`~/.claude/CLAUDE.md` → 附錄 B - Server Actions vs API Routes 選擇**

#### 基礎設施工具

從 `@/lib/server` 匯入所有 Server-only 工具:

```typescript
import {
  // 認證
  requireAuth,      // 需要登入用戶
  requireAdmin,     // 需要管理員

  // 回應格式
  success,          // 成功回應
  error,            // 錯誤回應
  validationError,  // 驗證錯誤

  // 審計日誌
  logCreate,        // 記錄建立
  logUpdate,        // 記錄更新
  logDelete,        // 記錄刪除
  logStatusChange,  // 記錄狀態變更
} from '@/lib/server'
```

#### Server Action 標準模式

```typescript
export async function myAction(data: unknown) {
  try {
    // 1. 認證檢查
    const user = await requireAuth()

    // 2. 驗證輸入資料
    const result = MySchema.safeParse(data)
    if (!result.success) {
      return validationError(result.error)
    }

    // 3. 執行業務邏輯
    const resource = await service.operation(user.id, result.data)

    // 4. 審計日誌 (關鍵操作)
    await logCreate(user, 'resource', resource.id, {
      newData: { /* 關鍵欄位 */ },
    })

    // 5. Revalidation - 清除快取
    revalidatePath('/resources')

    // 6. 返回成功回應
    return success(resource, '操作成功')
  } catch (err) {
    return error(err)
  }
}
```

#### 客戶端使用

```tsx
'use client'

import { useTransition } from 'react'
import { myAction } from '@/app/actions'

function MyComponent() {
  const [isPending, startTransition] = useTransition()

  const handleClick = async () => {
    startTransition(async () => {
      const result = await myAction(data)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error.message)
      }
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? '處理中...' : '提交'}
    </button>
  )
}
```

#### 與 API Routes 的差異

| 項目 | API Routes | Server Actions |
|------|-----------|----------------|
| 認證 | `withAuthAndError()` | `await requireAuth()` |
| 驗證錯誤 | `throw ValidationError()` | `return validationError()` |
| 成功回應 | `return success()` | `return success()` |
| 快取控制 | Response headers | `revalidatePath()` |
| 審計日誌 | `enableAuditLog: true` | `await logCreate()` 手動調用 |

**完整指南**: 請參考 `docs/SERVER_ACTIONS_GUIDE.md`

---

## 💎 專案品質標準

### Client/Server Components 規範

> **詳見全域規範：`~/.claude/CLAUDE.md` → Client/Server Components 規範（Next.js App Router）**
>
> 全域規範包含完整的判斷準則、常見錯誤和最佳實踐範例。

**專案補充**：本專案使用 `lucide-react` 作為圖示庫，圖示元件本身是 Server Component 安全的。

---

## ✅ 維護檢查

### 完成定義

- [ ] 測試已寫並通過
- [ ] 程式碼遵循專案慣例
- [ ] 沒有 linter/格式化器警告
- [ ] 提交訊息清晰
- [ ] 實作符合計劃

### 重大變更的維護

**執行重大變更時** 必須執行維護檢查：

```bash
/major-change-check
```

**檢查項目**：快取清理、依賴檢查、品質檢查、TODO 掃描、測試和建置

### 版本發布維護

**版本發布前** 必須執行深度維護檢查：

```bash
/release-check
```

**檢查項目**：依賴健康、程式碼品質、效能基準、資料庫效能、測試套件、系統指標、文檔更新、環境配置、備份回滾

**建議**：在非尖峰時段發布，並在發布後持續監控 1-2 小時。
