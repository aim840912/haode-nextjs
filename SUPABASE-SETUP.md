# Supabase 設定指南

## 🎯 設定步驟

### 1. 註冊 Supabase 帳號
- 前往：https://supabase.com
- 點擊「Start your project」
- 使用 GitHub 或 Google 帳號註冊

### 2. 建立新專案
- 點擊「New Project」
- 選擇組織（Organization）
- 填寫專案資訊：
  - **Name**: `haude-tea` 或自訂名稱
  - **Database Password**: 設定強密碼（記住此密碼）
  - **Region**: 選擇 `Northeast Asia (Tokyo)` 較近台灣
- 點擊「Create new project」
- ⏳ 等待 2-3 分鐘建立完成

### 3. 執行資料庫 Schema
- 在專案儀表板中，點擊左側選單「SQL Editor」
- 點擊「New query」
- 複製 `src/lib/database.sql` 檔案的完整內容
- 貼入查詢編輯器
- 點擊「RUN」按鈕執行
- ✅ 確認所有表格建立成功

### 4. 取得 API 金鑰
- 點擊左側選單「Settings」→「API」
- 複製以下兩個金鑰：
  - **Project URL**: `https://xxxxxxxx.supabase.co`
  - **anon public**: `eyJhbGc...` (公開金鑰)
  - **service_role**: `eyJhbGc...` (服務端金鑰，保密)

### 5. 更新環境變數
編輯 `.env.local` 檔案，填入實際值：

```env
# 將下面的值替換為你的 Supabase 專案資訊
NEXT_PUBLIC_SUPABASE_URL=https://你的專案ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon公開金鑰
SUPABASE_SERVICE_ROLE_KEY=你的service_role金鑰

# JWT 密鑰（隨機生成即可）
JWT_SECRET=your_random_jwt_secret_at_least_32_characters
```

### 6. 測試連接
```bash
npm run dev
```

開啟瀏覽器到 http://localhost:3000，確認沒有連接錯誤。

## 🔐 安全提醒

- ⚠️ **絕對不要**將 `service_role` 金鑰提交到 Git
- ✅ `.env.local` 已在 `.gitignore` 中，不會被提交
- 🔒 `service_role` 金鑰擁有完整資料庫權限，只能在伺服器端使用

## 📝 後續步驟

完成設定後，你可以：

1. 測試用戶註冊功能：`POST /api/auth/register`
2. 測試用戶登入功能：`POST /api/auth/login`
3. 在 Supabase Dashboard 的「Table Editor」中查看資料

## 🆘 常見問題

### Q: 資料庫連接失敗？
- 檢查 `.env.local` 中的 URL 和金鑰是否正確
- 確認專案已完全建立（等待時間足夠）

### Q: SQL 執行錯誤？
- 確認複製了完整的 SQL 內容
- 在 SQL Editor 中一次執行全部，不要分段

### Q: 忘記資料庫密碼？
- 在專案設定中可以重設密碼
- 不影響 API 金鑰的使用

---

💡 **小提示**：完成設定後，建議在 Supabase Dashboard 中瀏覽各個表格，熟悉資料結構。