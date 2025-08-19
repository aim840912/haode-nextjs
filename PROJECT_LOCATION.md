# 專案位置說明

## 📍 新的專案位置

**專案已移動到 WSL2 原生檔案系統以獲得最佳開發體驗**

- **專案路徑**：`/home/aim840912/projects/haude`
- **環境**：WSL2 Ubuntu
- **主要優勢**：快速熱重載、高效能檔案操作

## 🚀 啟動開發環境

### 基本指令
```bash
# 進入專案目錄
cd ~/projects/haude

# 啟動開發伺服器
npm run dev

# 建置專案
npm run build

# 型別檢查
npm run type-check

# 程式碼檢查
npm run lint
```

### 開發伺服器資訊
- **本地存取**：http://localhost:3000
- **網路存取**：http://172.20.98.169:3000
- **熱重載**：✅ 已啟用
- **平均啟動時間**：~1.2 秒

## 💻 存取方式

### 在 VS Code 中開啟
```bash
# 方法一：從 WSL 終端開啟
cd ~/projects/haude
code .

# 方法二：使用 WSL 擴充套件
# 1. 開啟 VS Code
# 2. Ctrl+Shift+P
# 3. 輸入 "WSL: Open Folder in WSL..."
# 4. 選擇 /home/aim840912/projects/haude
```

### 從 Windows 檔案總管存取
- **路徑**：`\\wsl$\Ubuntu\home\aim840912\projects\haude`
- **注意**：僅限瀏覽和複製，編輯請使用 VS Code

## 📊 效能改善

### 開發效能對比
| 項目 | 舊位置 (Windows) | 新位置 (WSL2) | 改善程度 |
|------|------------------|---------------|----------|
| 啟動時間 | ~2-5 分鐘 | ~1.2 秒 | 🚀 150x 提升 |
| 熱重載 | ❌ 不穩定 | ✅ 即時更新 | 🎯 完美運作 |
| 編譯時間 | ~10-30 秒 | ~91ms | ⚡ 100x 提升 |
| npm install | ~2-5 分鐘 | ~11 秒 | 🏃 10x 提升 |

## 🔧 Git 配置

### 遠端儲存庫
```bash
origin  https://github.com/aim840912/haode-nextjs.git (fetch)
origin  https://github.com/aim840912/haode-nextjs.git (push)
```

### 目前分支
```bash
# 檢查狀態
git status

# 目前在 develop 分支
# 與 origin/develop 同步
```

## 📝 常用開發流程

### 日常開發
```bash
# 1. 進入專案目錄
cd ~/projects/haude

# 2. 拉取最新變更
git pull

# 3. 啟動開發伺服器
npm run dev

# 4. 開始開發...
# 檔案修改會自動反映在瀏覽器中

# 5. 提交變更
git add .
git commit -m "功能描述"
git push
```

### 建置和部署
```bash
# 型別檢查
npm run type-check

# 程式碼檢查
npm run lint

# 建置專案
npm run build

# 測試建置結果
npm start
```

## ⚠️ 注意事項

### 備份策略
- **主要備份**：Git 儲存庫（GitHub）
- **OneDrive 同步**：不適用於 WSL2 位置
- **建議**：定期 push 到 GitHub

### 環境變數
- **檔案位置**：`/home/aim840912/projects/haude/.env.local`
- **狀態**：✅ 已正確複製

### 檔案權限
- **所有者**：aim840912:aim840912
- **權限**：開發者完整存取權限

## 🎯 最佳實踐

1. **使用 WSL 終端**：所有指令都在 WSL 環境執行
2. **VS Code WSL 擴充套件**：確保已安裝並啟用
3. **定期備份**：善用 Git 版本控制
4. **避免跨系統編輯**：不要在 Windows 檔案總管中直接編輯檔案

## 📞 問題排解

### 常見問題
1. **熱重載不運作**：確認在 WSL2 環境中執行 `npm run dev`
2. **VS Code 找不到檔案**：使用 WSL 擴充套件開啟專案
3. **權限問題**：在 WSL 終端執行 `sudo chown -R $USER:$USER ~/projects/haude`

### 復原到舊位置（不建議）
如需復原到 Windows 檔案系統：
```bash
# 複製回 Windows 位置
rsync -av ~/projects/haude/ /mnt/c/Users/aim84/OneDrive/桌面/haude/

# 重新安裝依賴
cd /mnt/c/Users/aim84/OneDrive/桌面/haude
rm -rf node_modules .next
npm install
```

---

**更新日期**：2025-08-19  
**建立者**：Claude Code Assistant  
**專案**：豪德茶業網站