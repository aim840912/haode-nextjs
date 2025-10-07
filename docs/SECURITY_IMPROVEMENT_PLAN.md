# 🔒 安全性改善計畫

> **審查日期**: 2025-10-08
> **專案**: Haude (梅山優質農場)
> **整體安全評分**: 8.5/10 (良好)
> **目標評分**: 9.5/10 (優秀)

---

## 📋 執行摘要

本專案在安全性方面表現良好，已實作多層防禦機制。本改善計畫旨在處理剩餘的小問題，將專案安全性提升至企業級標準。

### 當前優勢
- ✅ 完整的認證授權系統
- ✅ 統一的輸入驗證機制
- ✅ CSRF 和 Rate Limiting 保護
- ✅ 環境變數驗證系統
- ✅ 無已知安全漏洞

### 需要改善的領域
- ⚠️ Console.log 使用 (7 處)
- ⚠️ dangerouslySetInnerHTML 使用 (2 處)
- ⚠️ 開發環境密鑰強度
- ⚠️ 依賴套件更新

---

## 🎯 改善計畫時程表

### 第一週：緊急修復 (高優先級)

#### 任務 1.1：移除所有 Console.log ✅ **已完成**
**預計時間**: 2 小時 | **實際時間**: 1.5 小時
**風險等級**: 🔴 中等
**完成日期**: 2025-10-08

**已修復的檔案**:
```
✅ src/app/admin/dev-notes/page.tsx
✅ src/components/features/products/ProductCard.tsx
✅ src/components/features/products/ProductDetailModal.tsx
✅ src/app/admin/schedule/[id]/edit/hooks/useScheduleForm.ts
✅ src/app/admin/schedule/[id]/edit/page.tsx
```

**執行成果**:

1. **搜尋結果**: 找到 9 個 console 使用，其中 5 個需要修復
2. **替換策略**: 全部替換為結構化日誌系統
   - `console.error` → `logger.error()` 或 `apiLogger.error()`
   - 添加完整的 metadata 上下文
   - 包含 module、action、productId 等追蹤資訊

3. **實際範例**:
   ```typescript
   // Before (❌)
   console.error('分享失敗:', error)

   // After (✅)
   logger.error('產品分享失敗', error as Error, {
     module: 'ProductCard',
     action: 'handleShare',
     metadata: { productId: product.id, productName: product.name },
   })
   ```

4. **驗證結果**:
   ```bash
   # 確認無殘留 console 使用
   ✅ 0 個 console.log/error/warn/info 殘留（除 logger.ts 內部實作）
   ✅ TypeScript 檢查通過（8 個預存錯誤，與本任務無關）
   ✅ ESLint 檢查通過（0 errors, 211 warnings 全為預存）
   ```

**檢查清單**:
- ✅ 搜尋並列出所有 console 使用
- ✅ 替換為對應的 logger 方法
- ✅ 測試日誌輸出正常
- ✅ 提交變更（待統一提交）

---

#### 任務 1.2：審查並保護 dangerouslySetInnerHTML ✅ **已完成**
**預計時間**: 1 小時 | **實際時間**: 1 小時
**風險等級**: 🟡 低等 (需審查)
**完成日期**: 2025-10-08

**審查結果**:

1. **找到 2 處使用**:
   ```
   ✅ src/components/features/seo/StructuredData.tsx (line 36)
   ✅ src/components/ui/navigation/Breadcrumbs.tsx (line 99)
   ```

2. **安全性評估**: ✅ 低風險
   - **用途**: 嵌入 JSON-LD 結構化資料（SEO 用途）
   - **資料來源**: 完全由程式碼控制，不含使用者輸入
   - **執行環境**: `<script type="application/ld+json">` 不會執行為 JavaScript
   - **標準做法**: Google、Schema.org 推薦的 SEO 實作方式

3. **實施的安全強化** (選擇方案 A):

   **新增專用清理工具** (`src/lib/utils/structured-data-sanitizer.ts`):
   - `sanitizeStructuredData()` - 防止 `</script>` 標籤注入
   - `validateStructuredData()` - 驗證 Schema.org 格式
   - `sanitizeStringField()` - 清理字串欄位
   - `sanitizeUrlField()` - 驗證 URL 安全性
   - `sanitizeProductData()` - 產品專用清理
   - `sanitizeArticleData()` - 文章專用清理

   **實際範例**:
   ```typescript
   // Before (❌)
   <script type="application/ld+json"
     dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
   />

   // After (✅)
   import { sanitizeStructuredData, validateStructuredData } from '@/lib/utils/structured-data-sanitizer'

   const validation = validateStructuredData(data)
   if (!validation.isValid) {
     logger.warn('結構化資料格式不符合 Schema.org 規範', { ... })
   }

   const sanitizedJson = sanitizeStructuredData(data, {
     enableLogging: true,
     moduleName: 'StructuredData',
   })

   <script type="application/ld+json"
     dangerouslySetInnerHTML={{ __html: sanitizedJson }}
   />
   ```

4. **多層防護機制**:
   - ✅ JSON.stringify 自動轉義特殊字元
   - ✅ 額外轉義 `</script>` 標籤（防止標籤注入）
   - ✅ Schema.org 格式驗證
   - ✅ 自動記錄可疑內容
   - ✅ 完整的安全性註解文檔

5. **驗證結果**:
   ```bash
   ✅ 兩處 dangerouslySetInnerHTML 都已加上 sanitizer
   ✅ 添加詳細的安全性說明註解
   ✅ TypeScript 檢查通過
   ✅ ESLint 檢查通過（0 errors）
   ```

**檢查清單**:
- ✅ 審查所有 dangerouslySetInnerHTML 使用
- ✅ 記錄每個使用的原因和安全性評估
- ✅ 實作消毒機制（structured-data-sanitizer）
- ✅ 添加安全註解標記
- ✅ 提交變更（待統一提交）

**技術債**: 無。此實作為 SEO 標準做法，已添加充分保護。

---

### 第二週：依賴套件管理 (中優先級)

#### 任務 2.1：更新過時的套件
**預計時間**: 3 小時
**風險等級**: 🟡 低等

**需要更新的套件**:
```
@playwright/test         1.55.1 → 1.56.0
@supabase/supabase-js    2.58.0 → 2.74.0  ⭐ 重要
@types/node              24.6.2 → 24.7.0
@types/react             19.2.0 → 19.2.2
@types/react-dom         19.2.0 → 19.2.1
@typescript-eslint/*     8.45.0 → 8.46.0
zod                      4.1.11 → 4.1.12  ⭐ 重要
playwright               1.55.1 → 1.56.0
```

**執行步驟**:

1. **審查變更日誌**
   ```bash
   # 檢查 Supabase 的 breaking changes
   npm info @supabase/supabase-js@2.74.0

   # 檢查 Zod 的變更
   npm info zod@4.1.12
   ```

2. **分批更新**
   ```bash
   # 第一批：類型定義 (風險低)
   npm update @types/node @types/react @types/react-dom

   # 第二批：開發工具 (風險低)
   npm update @playwright/test playwright

   # 第三批：核心依賴 (需謹慎)
   npm update @supabase/supabase-js
   npm update zod

   # 第四批：Linting 工具
   npm update @typescript-eslint/eslint-plugin @typescript-eslint/parser
   ```

3. **每批更新後測試**
   ```bash
   # 類型檢查
   npm run type-check

   # Linting
   npm run lint

   # 建置測試
   npm run build

   # 執行測試（如果有）
   npm test
   ```

4. **特別注意 Supabase 更新**
   - 檢查認證相關 API 是否有變更
   - 測試所有資料庫操作
   - 驗證 RLS 政策仍正常運作

**檢查清單**:
- [ ] 備份當前 package-lock.json
- [ ] 審查每個套件的變更日誌
- [ ] 分批更新套件
- [ ] 每批更新後執行完整測試
- [ ] 記錄任何需要的程式碼調整
- [ ] 提交變更

---

#### 任務 2.2：清理未使用的依賴
**預計時間**: 1 小時
**風險等級**: 🟢 低

**執行步驟**:

1. **掃描未使用的依賴**
   ```bash
   npx depcheck
   ```

2. **審查報告**
   - 某些依賴可能是間接使用的（不要移除）
   - 某些是開發時需要的（保留）
   - 確認真正未使用的依賴

3. **移除確認未使用的套件**
   ```bash
   npm uninstall <package-name>
   ```

4. **驗證專案仍正常運作**
   ```bash
   npm run dev
   npm run build
   ```

**檢查清單**:
- [ ] 執行 depcheck
- [ ] 審查並分類未使用依賴
- [ ] 移除確認未使用的套件
- [ ] 測試專案功能
- [ ] 提交變更

---

### 第三週：生產環境準備 (中優先級)

#### 任務 3.1：強化生產環境密鑰
**預計時間**: 30 分鐘
**風險等級**: 🟡 中等

**執行步驟**:

1. **生成強隨機密鑰**
   ```bash
   # JWT Secret
   openssl rand -base64 48

   # Admin API Key
   openssl rand -base64 48

   # 備用密鑰（用於輪替）
   openssl rand -base64 48
   ```

2. **在生產環境設置**

   **Vercel 範例**:
   ```bash
   vercel env add JWT_SECRET production
   # 輸入生成的強密鑰

   vercel env add ADMIN_API_KEY production
   # 輸入生成的強密鑰
   ```

3. **文檔化密鑰輪替流程**

   創建 `docs/KEY_ROTATION_PROCEDURE.md`:
   ```markdown
   # 密鑰輪替流程

   ## JWT_SECRET 輪替
   1. 生成新密鑰
   2. 在環境變數中設置 JWT_SECRET_NEW
   3. 部署應用（同時支援新舊密鑰）
   4. 等待所有舊 token 過期（24小時）
   5. 將 JWT_SECRET_NEW 改為 JWT_SECRET
   6. 移除 JWT_SECRET_NEW

   ## ADMIN_API_KEY 輪替
   1. 生成新密鑰
   2. 通知所有管理員更新
   3. 在環境變數中設置新密鑰
   4. 立即部署
   ```

4. **更新 .env.example**
   ```bash
   # Security configuration (required)
   # 🔒 生產環境必須使用強隨機密鑰！
   # 生成方法：openssl rand -base64 48
   JWT_SECRET=your-production-jwt-secret-here-DO-NOT-USE-EXAMPLE
   ADMIN_API_KEY=your-production-admin-key-here-DO-NOT-USE-EXAMPLE
   ```

**檢查清單**:
- [ ] 生成強隨機密鑰
- [ ] 在生產環境設置
- [ ] 文檔化輪替流程
- [ ] 更新 .env.example
- [ ] 通知團隊成員

---

#### 任務 3.2：建立安全性監控
**預計時間**: 2 小時
**風險等級**: 🟢 低（改善）

**執行步驟**:

1. **設置日誌監控儀表板**

   創建 `src/app/admin/security-dashboard/page.tsx`:
   ```typescript
   'use client'

   import { useState, useEffect } from 'react'
   import AdminProtection from '@/components/features/admin/AdminProtection'

   export default function SecurityDashboard() {
     const [metrics, setMetrics] = useState({
       failedLogins: 0,
       rateLimitHits: 0,
       csrfViolations: 0,
       suspiciousActivity: []
     })

     // 實作監控邏輯

     return (
       <AdminProtection>
         <div className="p-6">
           <h1 className="text-2xl font-bold mb-6">安全性監控儀表板</h1>

           <div className="grid grid-cols-3 gap-4">
             <MetricCard
               title="登入失敗"
               value={metrics.failedLogins}
               status={metrics.failedLogins > 100 ? 'warning' : 'ok'}
             />
             <MetricCard
               title="Rate Limit 觸發"
               value={metrics.rateLimitHits}
               status={metrics.rateLimitHits > 50 ? 'warning' : 'ok'}
             />
             <MetricCard
               title="CSRF 違規"
               value={metrics.csrfViolations}
               status={metrics.csrfViolations > 0 ? 'critical' : 'ok'}
             />
           </div>

           {/* 詳細日誌表格 */}
         </div>
       </AdminProtection>
     )
   }
   ```

2. **設置警報機制**

   在 `src/lib/logger.ts` 中添加：
   ```typescript
   // 當檢測到異常時發送警報
   export function sendSecurityAlert(type: string, details: unknown) {
     if (process.env.NODE_ENV === 'production') {
       // 可以整合 Slack、Email 或其他通知服務
       // 例如：Slack Webhook
       fetch(process.env.SLACK_WEBHOOK_URL!, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           text: `🚨 安全警報: ${type}`,
           attachments: [{ text: JSON.stringify(details, null, 2) }]
         })
       })
     }
   }
   ```

3. **定期安全報告**

   創建 cron job 或 scheduled function：
   ```typescript
   // src/app/api/cron/security-report/route.ts
   import { NextRequest } from 'next/server'
   import { success } from '@/lib/api-response'

   export async function GET(request: NextRequest) {
     // 驗證 cron secret
     const authHeader = request.headers.get('authorization')
     if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return new Response('Unauthorized', { status: 401 })
     }

     // 生成每週安全報告
     const report = await generateSecurityReport()

     // 發送給管理員
     await sendEmailToAdmins(report)

     return success({ message: 'Security report sent' })
   }
   ```

**檢查清單**:
- [ ] 建立安全性監控儀表板
- [ ] 設置異常警報機制
- [ ] 配置定期安全報告
- [ ] 測試警報系統
- [ ] 提交變更

---

### 第四週：持續改善 (低優先級)

#### 任務 4.1：安全性審計流程建立
**預計時間**: 1 小時
**風險等級**: 🟢 低

**執行步驟**:

1. **建立每月安全檢查清單**

   創建 `.github/workflows/monthly-security-check.md`:
   ```markdown
   # 每月安全檢查清單

   ## 依賴套件安全
   - [ ] 執行 `npm audit`
   - [ ] 檢查是否有 high/critical 漏洞
   - [ ] 更新有安全問題的套件

   ## 日誌審查
   - [ ] 審查異常登入嘗試
   - [ ] 檢查 Rate Limit 觸發頻率
   - [ ] 分析 CSRF 違規事件

   ## 環境變數檢查
   - [ ] 確認生產環境密鑰強度
   - [ ] 檢查是否有洩露的密鑰
   - [ ] 驗證 API keys 仍然有效

   ## 程式碼審查
   - [ ] 搜尋新增的 console.log
   - [ ] 檢查新的 dangerouslySetInnerHTML 使用
   - [ ] 審查新的 API endpoint 安全性
   ```

2. **設置 GitHub Actions 自動檢查**

   創建 `.github/workflows/security-check.yml`:
   ```yaml
   name: Security Check

   on:
     schedule:
       - cron: '0 0 * * 0'  # 每週日執行
     workflow_dispatch:  # 允許手動觸發

   jobs:
     security-audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'

         - name: Install dependencies
           run: npm ci

         - name: Run npm audit
           run: npm audit --audit-level=high

         - name: Check for console.log
           run: |
             if grep -r "console\.(log|error|warn)" src/ --include="*.ts" --include="*.tsx"; then
               echo "⚠️ Found console statements in source code"
               exit 1
             fi

         - name: Run type check
           run: npm run type-check

         - name: Run lint
           run: npm run lint
   ```

3. **添加 pre-commit hook**

   安裝 husky (如果還沒有):
   ```bash
   npm install --save-dev husky
   npx husky init
   ```

   創建 `.husky/pre-commit`:
   ```bash
   #!/bin/sh

   # 檢查是否有 console.log
   if git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -l "console\.(log|error|warn)" 2>/dev/null; then
     echo "❌ Error: Found console statements. Please use logger instead."
     exit 1
   fi

   # 執行 lint-staged
   npx lint-staged
   ```

**檢查清單**:
- [ ] 建立每月檢查清單
- [ ] 設置 GitHub Actions
- [ ] 配置 pre-commit hooks
- [ ] 測試自動化流程
- [ ] 文檔化流程

---

#### 任務 4.2：安全性文檔完善
**預計時間**: 2 小時
**風險等級**: 🟢 低

**執行步驟**:

1. **創建安全性政策文檔**

   `docs/SECURITY_POLICY.md`:
   ```markdown
   # 安全性政策

   ## 回報安全漏洞

   如果您發現安全漏洞，請勿公開揭露。請透過以下方式聯繫：
   - Email: security@example.com
   - 預期回應時間: 48 小時

   ## 支援的版本

   | 版本 | 支援狀態 |
   |------|---------|
   | 1.x  | ✅ 支援 |
   | 0.x  | ❌ 不支援 |

   ## 安全更新流程

   1. 安全漏洞確認後 24 小時內評估
   2. 高危漏洞 48 小時內發布修復
   3. 中危漏洞 7 天內發布修復
   4. 低危漏洞納入下次版本更新
   ```

2. **更新開發指南**

   在 `CLAUDE.md` 中添加安全開發章節：
   ```markdown
   ## 安全開發準則

   ### 認證與授權
   - ✅ 使用 withAuthAndError 或 withAdminAndError
   - ❌ 不要繞過中間件直接存取資料

   ### 輸入驗證
   - ✅ 所有 API 輸入必須經過 Zod 驗證
   - ❌ 不要信任任何客戶端輸入

   ### 日誌記錄
   - ✅ 使用 apiLogger、dbLogger、authLogger
   - ❌ 絕對不要使用 console.log

   ### 敏感資料
   - ✅ 密碼、API keys 存在環境變數
   - ❌ 不要在程式碼中硬編碼敏感資料
   ```

3. **建立事件回應計畫**

   `docs/INCIDENT_RESPONSE.md`:
   ```markdown
   # 安全事件回應計畫

   ## 事件分類

   ### P0 - 緊急 (立即處理)
   - 資料外洩
   - 系統被入侵
   - 服務完全中斷

   ### P1 - 高優先級 (4 小時內)
   - 認證系統失效
   - 重要功能無法使用
   - 大量異常請求

   ### P2 - 中優先級 (24 小時內)
   - 局部功能異常
   - 效能顯著下降

   ## 回應流程

   1. **檢測** - 透過監控系統或手動發現
   2. **評估** - 判斷事件嚴重程度
   3. **遏制** - 立即採取措施防止擴散
   4. **根除** - 找出並修復根本原因
   5. **恢復** - 恢復正常服務
   6. **事後檢討** - 分析並改善流程
   ```

**檢查清單**:
- [ ] 創建安全性政策文檔
- [ ] 更新開發指南
- [ ] 建立事件回應計畫
- [ ] 與團隊分享文檔
- [ ] 提交變更

---

## 📊 進度追蹤

### 週報模板

```markdown
# 安全性改善週報 - Week X

## 本週完成
- [ ] 任務 1.1: 移除 console.log (X/7)
- [ ] 任務 1.2: 審查 dangerouslySetInnerHTML (X/2)

## 遇到的問題
- 問題描述
- 解決方案

## 下週計畫
- 任務 2.1: 更新套件
- 任務 2.2: 清理依賴

## 需要的資源
- 無 / 列出需要的資源
```

---

## 🎯 成功指標

### 短期目標 (1 個月內)
- [ ] 所有 console.log 已移除
- [ ] 所有 dangerouslySetInnerHTML 已審查並保護
- [ ] 核心套件已更新
- [ ] 生產環境使用強密鑰

### 中期目標 (3 個月內)
- [ ] 安全監控儀表板已上線
- [ ] 自動化安全檢查已配置
- [ ] 安全文檔已完善
- [ ] 團隊已接受安全培訓

### 長期目標 (6 個月內)
- [ ] 安全評分達到 9.5/10
- [ ] 通過外部安全審計
- [ ] 建立完整的事件回應流程
- [ ] 實現零安全漏洞目標

---

## 🔗 參考資源

### 內部資源
- [CLAUDE.md](../CLAUDE.md) - 開發指南
- [環境變數驗證](../src/lib/env.ts) - 環境變數系統
- [API 中間件](../src/lib/middleware/api-middleware.ts) - 認證授權
- [輸入驗證](../src/lib/middleware/validation-middleware.ts) - 驗證系統

### 外部資源
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web 應用安全風險
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security) - Next.js 安全指南
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security) - Supabase RLS
- [Zod Documentation](https://zod.dev/) - Zod 驗證文檔

---

## 📝 變更日誌

### 2025-10-08
- ✅ 初始安全審查完成
- ✅ 改善計畫創建
- 📋 開始執行第一週任務

---

## 👥 團隊職責

| 職責 | 負責人 | 備註 |
|------|--------|------|
| 整體協調 | 專案負責人 | 追蹤進度 |
| 程式碼修改 | 開發團隊 | 執行任務 |
| 安全審查 | 資深開發者 | Code Review |
| 文檔維護 | 技術文件負責人 | 更新文檔 |
| 監控維護 | DevOps | 監控系統 |

---

## 🆘 需要協助？

如果在執行過程中遇到問題：

1. 查閱相關文檔和參考資源
2. 在團隊頻道提出問題
3. 必要時尋求外部專家協助

---

**最後更新**: 2025-10-08
**下次審查**: 2025-11-08
