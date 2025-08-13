# 🚀 Supabase 設定指南

## 📋 目錄
1. [建立 Supabase 專案](#建立-supabase-專案)
2. [設定資料庫](#設定資料庫)
3. [配置環境變數](#配置環境變數)
4. [執行資料遷移](#執行資料遷移)
5. [部署到 Vercel](#部署到-vercel)
6. [驗證設定](#驗證設定)

## 🏗️ 建立 Supabase 專案

### 步驟 1: 註冊/登入 Supabase
1. 前往 [supabase.com](https://supabase.com)
2. 點擊 "Start your project"
3. 使用 GitHub 或 Google 帳戶登入

### 步驟 2: 建立新專案
1. 點擊 "New project"
2. 選擇組織 (如果是新用戶會自動建立)
3. 填寫專案資訊：
   - **Name**: `haude-farm` (或你喜歡的名稱)
   - **Database Password**: 設定強密碼 (記下來！)
   - **Region**: 選擇 "Southeast Asia (Singapore)" (最接近台灣)
4. 點擊 "Create new project"
5. 等待專案建立完成 (約 2-3 分鐘)

## 🗄️ 設定資料庫

### 步驟 1: 執行初始 Schema
1. 在 Supabase 專案中，點選左側選單的 "SQL Editor"
2. 點擊 "New query"
3. 複製並貼上 `supabase/migrations/001_initial_schema.sql` 的內容
4. 點擊 "Run" 執行

### 步驟 2: 插入初始資料 (可選)
1. 在 SQL Editor 中建立新查詢
2. 複製並貼上 `supabase/seed.sql` 的內容
3. 點擊 "Run" 執行

## 🔑 配置環境變數

### 步驟 1: 取得 API 金鑰
1. 在 Supabase 專案中，點選左側選單的 "Settings"
2. 點選 "API"
3. 找到以下資訊：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: 公開金鑰 (給前端使用)
   - **service_role**: 服務金鑰 (給後端使用，保密！)

### 步驟 2: 更新 .env.local
編輯專案根目錄的 `.env.local` 檔案：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT 密鑰（用於自定義 token 簽名）
JWT_SECRET=your_jwt_secret_key
```

⚠️ **重要**：
- 將 `your-project-id`、`your-anon-key-here`、`your-service-role-key-here` 替換為實際值
- 不要將 service_role key 洩露給前端或公開

## 📦 執行資料遷移

### 方法 1: 手動遷移 (推薦給現有資料)
1. 確保環境變數設定正確
2. 執行遷移腳本：
   ```bash
   npx tsx scripts/migrate-to-supabase.ts
   ```
3. 查看遷移結果，確認沒有錯誤

### 方法 2: 使用種子資料 (全新開始)
如果你想要全新的示範資料，直接使用上面的種子資料即可。

## 🌐 部署到 Vercel

### 步驟 1: 設定 Vercel 環境變數
1. 登入 [vercel.com](https://vercel.com)
2. 選擇你的專案
3. 前往 "Settings" > "Environment Variables"
4. 新增以下變數：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的專案 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: 你的 service role key

### 步驟 2: 部署
1. 推送程式碼到 GitHub
2. Vercel 會自動部署

## ✅ 驗證設定

### 檢查清單：
- [ ] Supabase 專案建立成功
- [ ] 資料庫表格建立完成
- [ ] 環境變數設定正確
- [ ] 本地開發可以連接到 Supabase
- [ ] Vercel 部署成功
- [ ] 網站管理功能正常運作

### 測試步驟：
1. **本地測試**：
   ```bash
   npm run dev
   ```
   確認可以新增/編輯產品

2. **線上測試**：
   前往部署的網站，測試管理功能

## 🚀 **整合後的優勢**

### **✅ 完全持久化**
- 所有資料操作都會永久保存
- 管理員新增/編輯的內容在 Vercel 部署後不會消失

### **✅ 企業級功能**
- 真實資料庫支援複雜查詢
- 自動備份和恢復
- 即時資料同步

### **✅ 擴展性**
- 可以輕鬆新增更多功能
- 支援檔案上傳（未來可整合 Supabase Storage）
- 支援即時通知

### **✅ 免費額度充足**
- Supabase 免費版足夠中小型網站使用
- 每月 500MB 資料庫 + 1GB 檔案儲存
- 每月 2GB 資料傳輸

## 🔒 安全設定 (可選但推薦)

### Row Level Security (RLS)
1. 在 Supabase 中啟用 RLS 保護資料
2. 設定適當的政策規則
3. 確保只有授權用戶可以修改資料

### API 限制
1. 設定 API 請求頻率限制
2. 限制特定操作的權限

## 🔐 安全提醒

- ⚠️ **絕對不要**將 `service_role` 金鑰提交到 Git
- ✅ `.env.local` 已在 `.gitignore` 中，不會被提交
- 🔒 `service_role` 金鑰擁有完整資料庫權限，只能在伺服器端使用

## 📋 **已完成的整合項目**

### **1. 安裝與配置**
- ✅ 安裝 `@supabase/supabase-js` 套件
- ✅ 建立 Supabase 客戶端配置 (`src/lib/supabase.ts`)
- ✅ 設定環境變數範本 (`.env.example`)

### **2. 資料庫架構**
- ✅ 建立完整的資料庫 schema (`supabase/migrations/001_initial_schema.sql`)
  - Products (產品)
  - Locations (門市據點)
  - News (新聞)
  - Schedule (擺攤行程)
  - Culture (文化內容)
  - Farm Tour (農場導覽)
  - Reviews (顧客評論)
- ✅ 建立初始資料種子檔案 (`supabase/seed.sql`)

### **3. Service 層更新**
- ✅ 建立 `SupabaseProductService` 替代 JSON 檔案儲存
- ✅ 建立 `SupabaseLocationService` 替代記憶體儲存
- ✅ 更新現有服務層指向 Supabase 實作

### **4. 資料遷移**
- ✅ 建立自動化遷移腳本 (`scripts/migrate-to-supabase.ts`)
- ✅ 支援從 JSON 檔案遷移到 Supabase

## 📝 後續步驟

完成設定後，你可以：

1. **測試管理功能**：新增/編輯產品、新聞、農場導覽等內容
2. **查看資料**：在 Supabase Dashboard 的「Table Editor」中查看資料
3. **監控使用量**：在 Supabase Dashboard 查看資料庫使用情況
4. **設定備份**：Supabase 會自動備份，也可設定額外備份策略

## 🆘 常見問題

### Q: 連接失敗
**A**: 檢查環境變數是否正確，確認 Supabase 專案狀態

### Q: 權限錯誤
**A**: 確認使用正確的 API key，service_role key 用於後端操作

### Q: 資料遷移失敗
**A**: 檢查 JSON 檔案格式，確認資料庫表格已建立

### Q: Vercel 部署失敗
**A**: 確認環境變數在 Vercel 中設定正確

### Q: 資料庫連接失敗？
- 檢查 `.env.local` 中的 URL 和金鑰是否正確
- 確認專案已完全建立（等待時間足夠）

### Q: SQL 執行錯誤？
- 確認複製了完整的 SQL 內容
- 在 SQL Editor 中一次執行全部，不要分段

### Q: 忘記資料庫密碼？
- 在專案設定中可以重設密碼
- 不影響 API 金鑰的使用

## 📞 支援

如有問題，可以：
1. 查看 [Supabase 文檔](https://supabase.com/docs)
2. 檢查專案的 GitHub Issues
3. 聯絡開發團隊

---

**🎉 完成後，你的豪德農場網站就能在 Vercel 上完全正常運作，包括所有的管理功能！**

💡 **小提示**：完成設定後，建議在 Supabase Dashboard 中瀏覽各個表格，熟悉資料結構。