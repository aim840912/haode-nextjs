# 豪德茶業專案文件

> **完整的開發、部署與營運指南**
>
> 從專案架構到營運策略的全方位文件集合

## 📚 文件分類

### 🎯 指南類文件（guides/）
專案策略、營運建議與實戰指南

- **[advice.md](./guides/advice.md)** - 豪德茶業電商專案實戰指南
  - 專案現況評估
  - Phase 0-4 開發路線圖
  - 快取系統實作指南
  - Supabase 流量管理策略
  - 成本分階段規劃

- **[admin-strategy.md](./guides/admin-strategy.md)** - 管理後台策略指南
  - 資料庫 vs 網站後台比較
  - 發展階段建議
  - 實作優先順序
  - 決策參考標準

- **[PROJECT_LOCATION.md](./guides/PROJECT_LOCATION.md)** - 專案位置和架構
  - 檔案結構說明
  - 關鍵目錄位置

### 🚀 部署相關（deployment/）
部署、配置與基礎設施設定

- **[DEPLOYMENT-GUIDE.md](./deployment/DEPLOYMENT-GUIDE.md)** - 完整部署指南
  - 環境設定
  - 服務配置
  - 部署流程

- **[VERCEL-DEPLOYMENT.md](./deployment/VERCEL-DEPLOYMENT.md)** - Vercel 部署專用指南
  - Vercel 配置
  - 環境變數設定
  - 域名配置

- **[SUPABASE-SETUP.md](./deployment/SUPABASE-SETUP.md)** - Supabase 設定指南
  - 資料庫配置
  - 認證設定
  - Storage 配置

### 🔧 開發相關（development/）
開發流程、工具配置與技術指南

- **[CLAUDE.md](./development/CLAUDE.md)** - Claude Code 開發指南
  - 開發哲學
  - 實作流程
  - 品質標準

- **[CSS_MANAGEMENT_PLAN.md](./development/CSS_MANAGEMENT_PLAN.md)** - CSS 管理計畫
  - 樣式架構
  - 組織策略
  - 最佳實務

- **[IMAGE_FEATURES.md](./development/IMAGE_FEATURES.md)** - 圖片功能說明
  - 圖片處理功能
  - 技術實作
  - 使用方式

- **[RLS-SECURITY-FIX.md](./development/RLS-SECURITY-FIX.md)** - RLS 安全修復
  - 安全問題修復
  - 權限控制
  - 最佳實務

## 🎯 快速導航

### 🚀 **剛開始開發？**
1. 📖 閱讀 [advice.md](./guides/advice.md) 了解專案全貌
2. 🔧 按照 [DEPLOYMENT-GUIDE.md](./deployment/DEPLOYMENT-GUIDE.md) 設定環境
3. 💻 參考 [CLAUDE.md](./development/CLAUDE.md) 了解開發流程

### 📈 **準備上線？**
1. 🎯 檢查 [advice.md](./guides/advice.md) 的 MVP 檢查清單
2. 🚀 按照 [VERCEL-DEPLOYMENT.md](./deployment/VERCEL-DEPLOYMENT.md) 部署
3. 🏪 參考 [admin-strategy.md](./guides/admin-strategy.md) 建立管理後台

### 🛠️ **遇到問題？**
1. 🔐 安全問題：參考 [RLS-SECURITY-FIX.md](./development/RLS-SECURITY-FIX.md)
2. 🗄️ 資料庫問題：參考 [SUPABASE-SETUP.md](./deployment/SUPABASE-SETUP.md)
3. 🎨 樣式問題：參考 [CSS_MANAGEMENT_PLAN.md](./development/CSS_MANAGEMENT_PLAN.md)

### 🎪 **需要特定功能？**
1. 📸 圖片功能：參考 [IMAGE_FEATURES.md](./development/IMAGE_FEATURES.md)
2. 🏗️ 專案結構：參考 [PROJECT_LOCATION.md](./guides/PROJECT_LOCATION.md)

## 📊 文件狀態

| 文件分類 | 檔案數量 | 最後更新 | 狀態 |
|---------|---------|----------|------|
| 指南類 | 3 | 2025-08-21 | ✅ 最新 |
| 部署相關 | 3 | 2025-08-18 | ✅ 最新 |
| 開發相關 | 4 | 2025-08-19 | ✅ 最新 |

## 🔄 更新記錄

### 2025-08-21
- 🎯 建立文件資料夾架構
- 📚 新增 admin-strategy.md 管理後台策略
- 📋 建立文件索引和快速導航

### 2025-08-20
- 📝 更新 advice.md 標記已完成項目
- ✅ 新聞 Storage 系統整合完成
- 🔧 GitHub Actions 修復

### 2025-08-19
- 📊 CSS 管理計畫更新
- 🎨 樣式架構優化

## 💡 使用建議

### 📖 **閱讀順序建議**
1. **新手入門**：advice.md → CLAUDE.md → DEPLOYMENT-GUIDE.md
2. **系統管理**：admin-strategy.md → SUPABASE-SETUP.md
3. **進階開發**：所有 development/ 目錄文件

### 🔍 **查找技巧**
- 使用 `Ctrl+F` 搜尋關鍵字
- 查看各文件的目錄結構
- 利用文件間的交叉引用

### ✅ **保持更新**
- 定期檢查文件是否需要更新
- 新增功能時記得更新相關文件
- 標記文件的最後更新時間

---

**這些文件記錄了專案從 0 到 1 的完整歷程，也是未來團隊協作的重要資產！**

*最後更新：2025-08-21*