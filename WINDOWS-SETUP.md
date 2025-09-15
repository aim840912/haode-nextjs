# Windows 環境設定說明

## 🖥️ Windows 使用者設定指南

此專案完全支援 Windows 開發環境。以下是 Windows 特定的設定說明：

### 📋 系統需求

- **Node.js**: >= 18.17.0 (建議使用 LTS 版本)
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0
- **Git**: >= 2.30.0
- **VS Code**: 建議安裝 (或其他支援 TypeScript 的編輯器)

### 🚀 快速開始

1. **Clone 專案**
   ```bash
   git clone https://github.com/your-username/haode-nextjs.git
   cd haode-nextjs
   ```

2. **安裝依賴**
   ```bash
   npm install
   # 或使用 pnpm
   pnpm install
   ```

3. **設定環境變數**
   ```bash
   # 複製環境變數模板
   copy .env.example .env.local
   # 手動編輯 .env.local 填入必要的環境變數
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   預設會在 `http://localhost:3001` 啟動

### ⚠️ Windows 特定注意事項

#### Port 設定
- 專案預設使用 port 3001
- 如果 port 被占用，可以設定環境變數：
  ```bash
  set PORT=3002
  npm run dev
  ```

#### 防火牆設定
- Windows 防火牆可能會阻擋 localhost 連線
- 第一次啟動時會跳出防火牆提示，請選擇「允許」

#### 路徑分隔符號
- 專案使用 Node.js 的 `path` 模組自動處理路徑
- 無需手動調整任何路徑設定

#### PowerShell 權限
如果遇到執行政策錯誤：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 🧪 測試環境

#### Playwright 測試
1. **安裝瀏覽器**
   ```bash
   npx playwright install
   ```

2. **執行測試**
   ```bash
   npm run test:e2e
   ```

#### 疑難排解
- 如果 Playwright 安裝失敗，嘗試以管理員身份執行
- 某些防毒軟體可能會阻擋瀏覽器下載，請暫時停用

### 🔧 開發工具建議

#### VS Code 擴充套件
```json
{
  "recommendations": [
    "ms-typescript.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "esbenp.prettier-vscode"
  ]
}
```

#### Git 設定
確保 Git 正確處理換行符號：
```bash
git config --global core.autocrlf true
git config --global core.safecrlf false
```

### 📝 常見問題

#### Q: npm install 時出現權限錯誤
A: 以管理員身份開啟命令提示字元或 PowerShell

#### Q: 無法啟動開發伺服器
A: 檢查 port 3001 是否被占用，或設定 PORT 環境變數

#### Q: Supabase 連線問題
A: 確認 `.env.local` 中的 Supabase 設定正確

#### Q: 圖片上傳失敗
A: 檢查檔案權限和防毒軟體設定

### 🔗 相關連結

- [Node.js Windows 安裝指南](https://nodejs.org/en/download/)
- [Git for Windows](https://gitforwindows.org/)
- [VS Code 下載](https://code.visualstudio.com/)
- [Playwright 文檔](https://playwright.dev/docs/intro)

### 💡 效能優化建議

1. **使用 pnpm** 而不是 npm（更快的安裝速度）
2. **啟用 Windows 開發者模式**（改善檔案系統效能）
3. **排除 node_modules** 從防毒軟體掃描
4. **使用 WSL2**（可選，獲得更好的 Linux 相容性）

---

如有任何 Windows 特定問題，請參考專案的 Issue 頁面或聯絡開發團隊。