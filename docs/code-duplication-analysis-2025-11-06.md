# 程式碼重複率詳細分析報告

**分析日期**: 2025-11-06
**分析工具**: jscpd (min-lines: 10, min-tokens: 70)
**分析範圍**: 整個 `src/` 目錄
**執行者**: Claude Code

---

## 📊 執行摘要

本報告針對 Haude 專案進行全面的程式碼重複率分析，識別出主要的重複來源，並提供具體可執行的改善建議。

**關鍵發現**:
- 發現 **6 個備份檔案**（4,254 行）造成大量重複
- 識別 **3 處重複目錄結構**（~1,000 行）
- 檢測到 **Validation Schemas 新舊系統共存**（~600 行）
- **預估可移除 5,800-6,800 行重複程式碼**

---

## 🔍 詳細發現

### 1. 備份檔案造成的重複 🔴
**影響等級**: 極高
**總行數**: 4,254 行
**優先級**: 🔴 緊急

| 檔案路徑 | 行數 | 狀態 | 建議動作 |
|---------|------|------|---------|
| `src/services/core/inquiry/inquiryService.backup.ts` | ~850 | 🔴 與新版模組化服務重複 | 立即刪除 |
| `src/app/admin/products/[id]/edit/page.backup.tsx` | ~700 | 🔴 完全重複 | 立即刪除 |
| `src/app/admin/locations/[id]/edit/page.backup.tsx` | ~800 | 🔴 完全重複 | 立即刪除 |
| `src/app/admin/farm-tour/[id]/edit/page.original.tsx` | ~600 | 🔴 完全重複 | 立即刪除 |
| `src/app/admin/site-settings/page.original.tsx` | ~700 | 🔴 完全重複 | 立即刪除 |
| `src/app/admin/dev-notes/page.original.tsx` | ~600 | 🔴 完全重複 | 立即刪除 |

**刪除指令**:
```bash
rm src/services/core/inquiry/inquiryService.backup.ts
rm src/app/admin/products/[id]/edit/page.backup.tsx
rm src/app/admin/locations/[id]/edit/page.backup.tsx
rm src/app/admin/farm-tour/[id]/edit/page.original.tsx
rm src/app/admin/site-settings/page.original.tsx
rm src/app/admin/dev-notes/page.original.tsx
```

**預期效益**: 移除 **4,254 行重複程式碼** ✨

---

### 2. 重複的目錄結構 🔴
**影響等級**: 高
**預估重複**: ~800-1,200 行
**優先級**: 🔴 高

#### 2.1 Products Edit 頁面
**目錄結構**:
```
src/app/admin/products/[id]/edit/
├── _hooks/          ← 使用中（11月更新）
├── _components/     ← 使用中（11月更新）
└── hooks/           ← 未使用（10月舊版）
```

**問題**: 存在未使用的 `hooks/` 目錄（10月的舊重構）

**建議動作**:
1. 確認 `page.tsx` 使用 `_hooks` 和 `_components`
2. 刪除 `hooks/` 目錄
3. 重新命名 `_hooks/` → `hooks/`
4. 重新命名 `_components/` → `components/`
5. 更新 `page.tsx` 的 imports

#### 2.2 Locations Edit 頁面
**目錄結構**:
```
src/app/admin/locations/[id]/edit/
├── _hooks/          ← 使用中（11月更新）
├── _components/     ← 使用中（11月更新）
├── hooks/           ← 未使用（10月舊版）
└── components/      ← 未使用（10月舊版）
```

**問題**: 同時存在 4 個目錄，2 個使用中，2 個未使用

**建議動作**: 同 Products Edit

#### 2.3 Inquiries 頁面
**目錄結構**:
```
src/app/admin/inquiries/
├── _hooks/          ← 使用中
└── _components/     ← 使用中
```

**問題**: 使用底線前綴命名

**建議動作**: 重新命名移除底線前綴

#### 2.4 Schedule Edit 頁面 ✅
**狀態**: 已於今日完成清理
**成果**: 移除 1,958 行重複程式碼

---

### 3. Validation Schemas 重複 🟡
**影響等級**: 中
**預估重複**: ~500-700 行
**優先級**: 🟡 中

**發現**: 新舊兩套 validation schema 系統共存

#### 舊系統（`lib/validation-schemas/`）
```
validation-schemas/
├── base.ts
├── common.ts
├── product.ts
├── inquiry.ts
└── farm-tour.ts
```

#### 新系統（`lib/validation/`）
```
validation/
├── base/
│   ├── string-schemas.ts
│   ├── number-schemas.ts
│   └── date-schemas.ts
├── api/
│   ├── upload-schemas.ts
│   └── pagination-schemas.ts
└── domain/
    ├── product-schemas.ts
    ├── inquiry-schemas.ts
    └── farm-tour-schemas.ts
```

**重複項目**:
| 舊系統 | 新系統 | Tokens |
|--------|--------|--------|
| `product.ts` | `domain/product-schemas.ts` | 760 |
| `inquiry.ts` | `domain/inquiry-schemas.ts` | 1272 |
| `farm-tour.ts` | `domain/farm-tour-schemas.ts` | 293 |
| `base.ts` | `base/*-schemas.ts` | ~500 |
| `common.ts` | `api/*-schemas.ts` | ~400 |

**建議策略**:
1. 確認專案主要使用哪套系統
2. 搜尋所有 import 來源
3. 統一遷移到新系統
4. 刪除舊系統目錄

**遷移檢查指令**:
```bash
# 檢查舊系統使用情況
grep -r "from.*validation-schemas" src/ | wc -l

# 檢查新系統使用情況
grep -r "from.*validation/domain\|from.*validation/api\|from.*validation/base" src/ | wc -l
```

---

### 4. API 路由模式重複 🟢
**影響等級**: 低-中
**預估重複**: ~300-500 行
**優先級**: 🟢 低（可接受）

**發現的模式**:
- GET/PUT/DELETE 路由的參數驗證邏輯 (10-15 行)
- 統一錯誤處理結構 (12-16 行)
- Admin 權限檢查 (11-12 行)

**範例**:
```typescript
// 在多個 API 路由中重複出現
const { id } = await params
const product = await productService.findById(id)
if (!product) {
  return error('產品不存在', 404)
}
```

**評估**: ✅ **可接受的重複**

**原因**:
1. 已使用統一中間件 (`withAuthAndError`, `requireAuth`)
2. CRUD 操作的邏輯本質上相似
3. 過度抽象會降低可讀性和可維護性
4. 每個 API 端點有特定的業務邏輯

**建議**: 保持現狀，不需要強制抽取

---

### 5. UI 元件重複 🟢
**影響等級**: 低
**預估重複**: ~200-400 行
**優先級**: 🟢 低（設計相似性）

**發現的重複**:
1. **SearchBar vs ExpandableSearchBar** (~150-200 tokens)
   - 共享基礎搜尋邏輯
   - 不同的 UI 互動模式
   - ✅ 合理的設計差異

2. **ProductCard vs ProductDetailModal** (~160 tokens)
   - 共享產品顯示邏輯
   - 不同的呈現方式
   - ✅ 合理的設計差異

3. **Header 內部重複** (~950 tokens)
   - 導航項目渲染邏輯
   - 桌面版 vs 行動版
   - ✅ 可考慮抽取共用元件

**評估**: ✅ **設計上的相似性**，非必要合併

---

## 📈 重複程式碼統計總覽

| 類別 | 重複行數 | 重複 Tokens | 優先級 | 預估清理時間 |
|------|---------|-------------|--------|-------------|
| **備份檔案** | ~4,000-4,300 | ~30,000-35,000 | 🔴 緊急 | 15 分鐘 |
| **重複目錄結構** | ~800-1,200 | ~6,000-10,000 | 🔴 高 | 2-3 小時 |
| **Validation Schemas** | ~500-700 | ~4,000-5,000 | 🟡 中 | 1-2 天 |
| **API 路由** | ~300-500 | ~2,000-3,000 | 🟢 低 | N/A（可接受）|
| **UI 元件** | ~200-400 | ~1,500-2,500 | 🟢 低 | N/A（設計相似）|
| **總計** | **~5,800-7,100** | **~43,500-55,500** | - | **3-5 小時** |

---

## 🎯 重複程式碼的根本原因

### 1. 開發過程的演進 ⏱️
- 專案經歷多次架構調整
- 保留備份檔案作為「安全網」
- 重構過程中新舊版本並存

### 2. 快速開發的取捨 ⚡
- 複製貼上現有頁面快速建立新功能
- 暫時使用底線前綴表示「待整理」
- 計畫事後清理但未執行

### 3. 缺乏自動化檢查 🤖
- 未定期執行重複度檢測工具
- 缺少 pre-commit hooks
- CI/CD 未整合程式碼品質檢查

### 4. Git 使用習慣 📝
- 使用備份檔案而非 git 分支
- 保留 `.original` 和 `.backup` 檔案
- 缺少定期清理流程

---

## 💡 改善建議與執行計畫

### 🔴 階段 1：立即清理（今天，2-3 小時）

#### 任務 1.1：刪除所有備份檔案 ✅
**優先級**: 🔴 最高
**時間**: 5 分鐘
**風險**: 低（git 有完整歷史）

```bash
# 步驟 1：確認檔案可以安全刪除
git log --oneline --all -- src/services/core/inquiry/inquiryService.backup.ts

# 步驟 2：批次刪除
rm src/services/core/inquiry/inquiryService.backup.ts
rm src/app/admin/products/[id]/edit/page.backup.tsx
rm src/app/admin/locations/[id]/edit/page.backup.tsx
rm src/app/admin/farm-tour/[id]/edit/page.original.tsx
rm src/app/admin/site-settings/page.original.tsx
rm src/app/admin/dev-notes/page.original.tsx

# 步驟 3：提交
git add -A
git commit -m "chore: 移除備份檔案 (4,254行)"
```

**預期效益**: 🎯 移除 **4,254 行重複程式碼**

---

#### 任務 1.2：清理 Products Edit 重複結構
**優先級**: 🔴 高
**時間**: 30-45 分鐘
**參考**: Schedule Edit 清理（已完成）

**執行步驟**:
```bash
# 1. 檢查主頁面使用哪個版本
head -20 src/app/admin/products/[id]/edit/page.tsx

# 2. 如果使用 _hooks，則：
rm -rf src/app/admin/products/[id]/edit/hooks
git mv src/app/admin/products/[id]/edit/_hooks \
       src/app/admin/products/[id]/edit/hooks
git mv src/app/admin/products/[id]/edit/_components \
       src/app/admin/products/[id]/edit/components

# 3. 更新 page.tsx 的 imports
# (使用 Edit 工具更新 import 路徑)

# 4. TypeScript 檢查
npm run type-check

# 5. 提交
git commit -m "refactor: 清理 Products Edit 重複結構"
```

**預期效益**: 🎯 移除 **300-500 行重複程式碼**

---

#### 任務 1.3：清理 Locations Edit 重複結構
**優先級**: 🔴 高
**時間**: 30-45 分鐘

同樣的流程，應用到 Locations Edit 頁面。

**預期效益**: 🎯 移除 **500-700 行重複程式碼**

---

#### 任務 1.4：清理 Inquiries 目錄命名
**優先級**: 🟡 中
**時間**: 15 分鐘

```bash
# 重新命名移除底線
git mv src/app/admin/inquiries/_hooks \
       src/app/admin/inquiries/hooks
git mv src/app/admin/inquiries/_components \
       src/app/admin/inquiries/components

# 更新 imports（如有需要）
```

**預期效益**: 🎯 提升程式碼清晰度

---

### 🟡 階段 2：Validation 統一（本週，1-2 天）

#### 任務 2.1：分析 Validation Schemas 使用情況
**優先級**: 🟡 中
**時間**: 1-2 小時

```bash
# 統計舊系統使用次數
grep -r "from.*validation-schemas" src/ --include="*.ts" --include="*.tsx" | wc -l

# 統計新系統使用次數
grep -r "from.*@/lib/validation" src/ --include="*.ts" --include="*.tsx" | wc -l

# 列出所有使用舊系統的檔案
grep -r "from.*validation-schemas" src/ --include="*.ts" --include="*.tsx" -l
```

#### 任務 2.2：遷移到統一版本
**優先級**: 🟡 中
**時間**: 4-6 小時

1. 確認新系統覆蓋所有舊系統的功能
2. 逐檔案更新 imports
3. 執行測試確保功能正常
4. 刪除舊系統目錄

#### 任務 2.3：刪除舊版 Validation Schemas
**優先級**: 🟡 中
**時間**: 5 分鐘

```bash
# 確認無任何檔案使用舊系統
grep -r "from.*validation-schemas" src/

# 刪除舊目錄
rm -rf src/lib/validation-schemas

# 提交
git add -A
git commit -m "refactor: 統一 validation schemas 至新系統"
```

**預期效益**: 🎯 移除 **500-700 行重複程式碼**

---

### 🟢 階段 3：長期維護（持續）

#### 任務 3.1：設定自動化檢查
**優先級**: 🟢 低
**時間**: 30 分鐘

**package.json**:
```json
{
  "scripts": {
    "check-duplication": "jscpd src/ --min-lines 10 --threshold 5",
    "check-quality": "npm run type-check && npm run lint && npm run check-duplication"
  }
}
```

**pre-commit hook** (`.husky/pre-commit`):
```bash
#!/bin/sh
npm run check-duplication
```

#### 任務 3.2：建立開發指南
**優先級**: 🟢 低
**時間**: 1 小時

在 `CLAUDE.md` 或開發文檔中新增：

**程式碼重用檢查清單**:
- [ ] 搜尋現有功能是否可重用
- [ ] 不建立 `.backup` 或 `.original` 檔案
- [ ] 重構完成後刪除舊版本
- [ ] 使用 git 分支而非備份檔案

#### 任務 3.3：定期審查
**優先級**: 🟢 低
**頻率**: 每月

```bash
# 每月執行
npm run check-duplication

# 檢查是否有新的備份檔案
find src/ -name "*.backup.*" -o -name "*.original.*"

# 檢查重複目錄結構
find src/app/admin -name "_hooks" -o -name "_components"
```

---

## 📋 快速執行計畫（推薦）

### 今天（2-3 小時）
```bash
# ✅ 1. Schedule Edit - 已完成（移除 1,958 行）

# ⏳ 2. 刪除所有備份檔案（5 分鐘）
rm src/services/core/inquiry/inquiryService.backup.ts \
   src/app/admin/products/[id]/edit/page.backup.tsx \
   src/app/admin/locations/[id]/edit/page.backup.tsx \
   src/app/admin/farm-tour/[id]/edit/page.original.tsx \
   src/app/admin/site-settings/page.original.tsx \
   src/app/admin/dev-notes/page.original.tsx

# ⏳ 3. Products Edit 清理（45 分鐘）
# ⏳ 4. Locations Edit 清理（45 分鐘）
# ⏳ 5. Inquiries 命名調整（15 分鐘）

git commit -m "chore: 完成階段 1 程式碼清理"
```

**預期成果**: 移除 **~5,000-5,500 行程式碼** 🎉

### 本週（1-2 天）
- 分析並統一 Validation Schemas
- 移除舊系統

**預期成果**: 再移除 **~500-700 行程式碼**

### 持續進行
- 設定自動化檢查
- 建立開發規範
- 定期審查

**預期成果**: 維持重複率 **< 5%**

---

## 🎉 預期整體成果

| 指標 | 清理前 | 清理後 | 改善幅度 |
|------|--------|--------|---------|
| **備份檔案數** | 6 個 | 0 個 | ✅ -100% |
| **備份檔案行數** | 4,254 行 | 0 行 | ✅ -100% |
| **重複目錄結構** | 4 處 | 0 處 | ✅ -100% |
| **Validation 系統** | 2 套 | 1 套 | ✅ -50% |
| **重複程式碼總量** | ~6,000-7,000 行 | ~500-1,000 行 | 🎯 **-85-90%** |
| **程式碼重複率** | 未測量 | < 5% | 🎯 **目標達成** |

---

## ✅ 結論與建議

### 專案健康度評估: ⭐⭐⭐⭐ (良好)

你的專案在程式碼組織和品質方面**整體表現良好**：

✅ **優秀的地方**:
- Validation 和 Formatters 工具函數已統一
- 使用統一的中間件系統
- API 錯誤處理已標準化
- 圖片處理有專用 hook

⚠️ **需要改善**:
- 備份檔案未清理（但容易解決）
- 重構過程的殘留結構
- 缺少自動化檢查

🎯 **核心問題**:
主要是**開發過程的衛生問題**，而非設計缺陷。清理後專案結構會非常清晰。

### 立即行動建議

**優先執行**: 階段 1 快速清理（2-3 小時）

這將：
- 移除 **85%** 的重複程式碼
- 提升專案清晰度
- 降低維護成本
- 減少新開發者困惑

**風險**: 極低（所有變更都在 git 歷史中）

---

## 📎 附錄

### A. jscpd 執行指令

```bash
# 基本檢測
npx jscpd src/

# 設定閾值（超過 5% 失敗）
npx jscpd src/ --threshold 5

# 生成報告
npx jscpd src/ --format json --output ./reports/duplication

# 忽略某些目錄
npx jscpd src/ --ignore "**/node_modules/**,**/*.test.ts"
```

### B. 相關資源

- [jscpd 官方文檔](https://github.com/kucherenko/jscpd)
- [程式碼重複的成本](https://martinfowler.com/bliki/CodeSmell.html)
- [DRY 原則](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

### C. 檢查清單模板

```markdown
## 新功能開發前檢查

- [ ] 搜尋是否有類似功能可重用
- [ ] 檢查是否需要新增依賴
- [ ] 確認遵循現有架構模式
- [ ] 評估對程式碼品質的影響

## 重構完成後檢查

- [ ] 刪除所有舊版本檔案
- [ ] 移除未使用的目錄
- [ ] 更新所有相關 imports
- [ ] 執行 TypeScript 檢查
- [ ] 執行重複度檢查
```

---

**報告結束**

如有任何問題或需要協助執行清理，請隨時聯繫！🚀
