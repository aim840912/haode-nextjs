# OAuth 社交登入設定指南

本文件說明如何在 Supabase 專案中配置 Google、Facebook 社交登入功能。

> **📌 注意**：目前僅支援 **Google** 和 **Facebook** 登入。
> LINE Login 因 Supabase 尚未原生支援，已暫時隱藏，相關程式碼已預留，未來可輕鬆啟用。

---

## 📋 目錄

1. [Supabase Dashboard 設定](#1-supabase-dashboard-設定)
2. [Google OAuth 設定](#2-google-oauth-設定)
3. [Facebook Login 設定](#3-facebook-login-設定)
4. [測試指南](#4-測試指南)
5. [常見問題排解](#5-常見問題排解)
6. [附錄：LINE Login 設定（未來功能）](#6-附錄line-login-設定未來功能)

---

## 1. Supabase Dashboard 設定

### 1.1 前置作業

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 導航至 **Authentication** → **Providers**

### 1.2 設定 Redirect URLs

在開始配置 OAuth Providers 之前，請先確認您的 Redirect URLs：

**本地開發環境**：
```
http://localhost:3000/auth/callback
```

**生產環境**：
```
https://your-domain.com/auth/callback
```

---

## 2. Google OAuth 設定

### 2.1 在 Google Cloud Console 建立專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 專案名稱建議：`Haude Tea OAuth`

### 2.2 啟用 Google+ API

1. 在左側選單選擇 **APIs & Services** → **Library**
2. 搜尋 **Google+ API**
3. 點擊 **Enable**

### 2.3 建立 OAuth 2.0 憑證

1. 導航至 **APIs & Services** → **Credentials**
2. 點擊 **Create Credentials** → **OAuth client ID**
3. 選擇 **Application type**: **Web application**
4. 輸入名稱：`Haude Tea Web Client`

### 2.4 設定 Authorized redirect URIs

在 **Authorized redirect URIs** 欄位中添加：

**本地開發**：
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

**範例**：
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

> **重要**：這是 Supabase 的 callback URL，不是您的應用程式 URL

### 2.5 取得憑證

完成後會取得：
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

### 2.6 在 Supabase 設定 Google Provider

1. 回到 Supabase Dashboard → **Authentication** → **Providers**
2. 找到 **Google** 並點擊編輯
3. 啟用 **Enable Sign in with Google**
4. 填入：
   - **Client ID**: 從 Google Cloud Console 取得
   - **Client Secret**: 從 Google Cloud Console 取得
5. 點擊 **Save**

---

## 3. Facebook Login 設定

### 3.1 建立 Meta for Developers 帳號

1. 前往 [Meta for Developers](https://developers.facebook.com/)
2. 使用 Facebook 帳號登入
3. 如果是新開發者，完成註冊流程

### 3.2 建立應用程式

1. 點擊 **My Apps** → **Create App**
2. 選擇應用程式類型：**Consumer**
3. 填寫資訊：
   - **App name**: `Haude Tea`
   - **App contact email**: 您的聯絡 Email
4. 點擊 **Create App**

### 3.3 添加 Facebook Login 產品

1. 在應用程式儀表板中，找到 **Add a Product**
2. 選擇 **Facebook Login** 並點擊 **Set Up**

### 3.4 配置 Facebook Login 設定

1. 在左側選單選擇 **Facebook Login** → **Settings**
2. 在 **Valid OAuth Redirect URIs** 欄位中添加：

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

3. 點擊 **Save Changes**

### 3.5 取得憑證

1. 在左側選單選擇 **Settings** → **Basic**
2. 找到：
   - **App ID**: `1234567890123456`
   - **App Secret**: 點擊 **Show** 顯示密鑰

### 3.6 在 Supabase 設定 Facebook Provider

1. 回到 Supabase Dashboard → **Authentication** → **Providers**
2. 找到 **Facebook** 並點擊編輯
3. 啟用 **Enable Sign in with Facebook**
4. 填入：
   - **Client ID**: App ID
   - **Client Secret**: App Secret
5. 點擊 **Save**

### 3.7 將應用程式切換為 Live 模式

> **重要**：開發模式下，只有測試使用者可以登入

1. 在應用程式儀表板頂部，將模式從 **Development** 切換為 **Live**
2. 可能需要完成應用程式審核（依 Facebook 要求）

---

## 4. 測試指南

### 4.1 本地開發測試

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 導航至登入頁面：`http://localhost:3000/login`

3. 測試社交登入按鈕：
   - 點擊 **使用 Google 登入**
   - 點擊 **使用 Facebook 登入**

4. 檢查是否：
   - 正確導向到 OAuth 授權頁面
   - 授權後導回到應用程式
   - 成功建立使用者 session
   - `profiles` 表中建立新記錄

### 4.2 檢查資料庫

使用 Supabase Dashboard 檢查：

1. **Authentication** → **Users**：確認新使用者已建立
2. **Table Editor** → **profiles**：確認 profile 資料已同步

### 4.3 檢查日誌

查看應用程式日誌確認：
- OAuth 登入流程無錯誤
- Profile 同步成功
- 無異常錯誤記錄

---

## 5. 常見問題排解

### 5.1 錯誤：redirect_uri_mismatch

**原因**：OAuth Provider 的 Redirect URI 設定不正確

**解決方案**：
1. 確認 Redirect URI 使用 Supabase 的 callback URL
2. 格式：`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. 確保沒有多餘的空格或斜線
4. 本地測試時，確保在 OAuth Provider 中添加本地 URL

### 5.2 錯誤：Invalid OAuth 2.0 Client

**原因**：Client ID 或 Client Secret 錯誤

**解決方案**：
1. 重新檢查從 OAuth Provider 取得的憑證
2. 確認 Client ID 和 Client Secret 沒有複製錯誤
3. 在 Supabase Dashboard 重新輸入憑證

### 5.3 登入後未建立 Profile

**原因**：Profile 同步邏輯未執行

**解決方案**：
1. 檢查 `/auth/callback` route 是否正常運作
2. 檢查 `syncOAuthProfile` 函數日誌
3. 確認 `profiles` 表結構正確
4. 檢查是否有資料庫權限問題

### 5.4 OAuth 頁面顯示「此應用程式未經驗證」

**Google**：
- 開發階段正常，生產環境需通過 Google 審核
- 或將測試使用者加入 Google Cloud Console 的測試清單

**Facebook**：
- 確保應用程式已切換為 Live 模式
- 可能需要完成 Facebook App Review

### 5.5 LINE Login 未顯示

**原因**：Supabase 可能尚未原生支援 LINE

**解決方案**：
1. 檢查 Supabase 最新文件確認支援狀態
2. 考慮使用自訂 OAuth 實作
3. 或暫時移除 LINE 登入選項

---

## 6. 安全性建議

### 6.1 環境變數管理

- 永不在程式碼中硬編碼 Client Secret
- 使用 `.env.local` 管理本地密鑰
- 在 Vercel/Netlify 等平台的環境變數中設定生產密鑰

### 6.2 定期更新密鑰

- 定期輪換 OAuth Client Secret
- 監控異常登入活動
- 使用 Supabase 的安全功能（如 Rate Limiting）

### 6.3 權限最小化

- 只請求必要的 OAuth 範圍（scopes）
- 定期審查應用程式權限

---

## 7. 生產環境部署注意事項

### 7.1 更新 Redirect URLs

部署到生產環境時：

1. 在各 OAuth Provider 中添加生產環境 Redirect URI
2. 範例：`https://haudetea.com/auth/callback`
3. 確保 Supabase callback URL 也包含生產環境

### 7.2 測試所有 OAuth Providers

部署後逐一測試：
- Google Login
- Facebook Login

確認每個 Provider 在生產環境中正常運作。

### 7.3 監控和日誌

- 啟用生產環境日誌
- 監控 OAuth 登入成功率
- 設定異常告警

---

## 8. 參考資源

### 官方文件

- [Supabase Auth - Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)

### 相關工具

- [Google Cloud Console](https://console.cloud.google.com/)
- [LINE Developers Console](https://developers.line.biz/)
- [Meta for Developers](https://developers.facebook.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 9. 附錄：LINE Login 設定（未來功能）

> **⚠️ 注意**：此章節保留供未來參考。
>
> 目前 Supabase 尚未原生支援 LINE Login，因此此功能暫時不可用。UI 中已隱藏 LINE 登入選項。
>
> 當 Supabase 官方支援 LINE Login 後，可按照以下步驟配置，並在前端恢復 LINE 登入按鈕（將 `providers` 陣列改為 `['google', 'line', 'facebook']`）。

### 9.1 註冊 LINE Developers 帳號

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 使用 LINE 帳號登入
3. 如果是新帳號，需要完成開發者註冊

### 9.2 建立 Provider

1. 點擊 **Create New Provider**
2. 輸入 Provider 名稱：`Haude Tea`
3. 點擊 **Create**

### 9.3 建立 Channel

1. 在您的 Provider 中，點擊 **Create a LINE Login channel**
2. 填寫資訊：
   - **Channel name**: `Haude Tea Login`
   - **Channel description**: `豪德製茶所社交登入`
   - **App types**: 勾選 **Web app**
3. 同意服務條款並建立

### 9.4 取得憑證

在 Channel 的 **Basic settings** 頁面找到：
- **Channel ID**: `1234567890`
- **Channel Secret**: `xxxxxxxxxxxxx`

### 9.5 前端恢復 LINE 登入

當 Supabase 支援 LINE 後，在以下檔案中恢復 LINE 選項：

```typescript
// src/app/login/page.tsx
// src/app/register/page.tsx
<SocialLoginSection providers={['google', 'line', 'facebook']} redirectTo="/" />
```

---

## 10. 更新記錄

- **2025-11-11**：建立 OAuth 配置指南（支援 Google、Facebook）
- **2025-11-11**：將 LINE Login 標記為未來功能

---

**有問題？** 請參考 [Supabase Community](https://github.com/supabase/supabase/discussions) 或專案內部文檔。
