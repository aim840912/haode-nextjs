# 智慧上傳 API 端點

本目錄包含智慧上傳系統的 API 路由：

## API 結構

### `/api/smart-upload/decision`
- `POST` - 獲取上傳決策建議
- 輸入：表單數據、使用者行為、系統狀態
- 輸出：決策結果和推理

### `/api/smart-upload/queue`
- `GET` - 獲取上傳佇列狀態
- `POST` - 添加檔案到上傳佇列
- `PUT` - 更新佇列項目狀態
- `DELETE` - 從佇列移除項目

### `/api/smart-upload/stats`
- `GET` - 獲取上傳統計數據
- 包含：成功率、平均速度、錯誤統計

## 設計原則

- RESTful API 設計
- 統一錯誤處理
- 權限控制
- 速率限制
- 詳細日誌記錄