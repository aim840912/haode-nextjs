Logger 系統遷移 Vercel 建置錯誤修復進行中

已修復問題：
- LogContext 類型定義嚴格化導致的編譯錯誤
- Logger 調用格式問題 (需要 error as Error 轉型)
- metadata 欄位需要包裝額外屬性

剩餘需修復的檔案：
- 部分 React 頁面組件中的 logger 調用格式問題

修復中... 將在下次提交完成所有修復。

