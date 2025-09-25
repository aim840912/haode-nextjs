  📖 如何讓 Claude 使用任務清單文檔

  1. 開始新任務時

  # 方式一：指定任務編號
  "Claude，請實作 PRODUCT_SMART_UPLOAD_TASKS.md 中的 T001"

  # 方式二：指定階段
  "Claude，請開始實作第一階段的環境設定任務"

  # 方式三：批量執行
  "Claude，請完成 T001 到 T005 的任務"

  2. 檢查進度時

  # 查看整體進度
  "Claude，請查看 PRODUCT_SMART_UPLOAD_TASKS.md 並告訴我目前進度"

  # 查看特定階段
  "Claude，第一階段完成了多少任務？"

  # 更新任務狀態
  "Claude，T001 已完成，請更新任務清單"

  3. 實作任務範例

  簡單明確的指令

  # ✅ 好的指令
  "Claude，請查看 PRODUCT_SMART_UPLOAD_TASKS.md 並實作 T006 建立 LocalImageCache.ts"

  # ✅ 含上下文的指令
  "Claude，參考 PRODUCT_SMART_UPLOAD_TASKS.md 和 docs/SMART_UPLOAD_TECHNICAL_SPEC.md，實作 T006"

  # ✅ 批次處理
  "Claude，今天目標是完成第一階段的核心服務建立（T006-T013）"

  進階使用方式

  # 帶條件的執行
  "Claude，如果 T001-T005 都完成了，請開始 T006"

  # 帶驗證的執行
  "Claude，完成 T014 後，請驗證預覽系統是否正常運作"

  # 帶優化的執行
  "Claude，實作 T019 時，請確保決策引擎的效能優化"

  4. 任務追蹤與更新

  // 更新單一任務
  "Claude，T001 完成了，請標記為 ✅ 並更新進度統計"

  // 批量更新
  "Claude，T001-T005 都完成了，請更新任務清單"

  // 添加備註
  "Claude，在 T006 旁邊加上備註：需要特別注意記憶體管理"

  // 調整任務
  "Claude，T010 遇到問題，請標記為 ❌ 並說明原因"

  5. 配合其他文檔使用

  # 技術實作參考
  "Claude，實作 T006 時，請參考：
  1. PRODUCT_SMART_UPLOAD_TASKS.md - 了解任務要求
  2. docs/SMART_UPLOAD_TECHNICAL_SPEC.md - 查看技術細節
  3. 實作 LocalImageCache 類別"

  # API 設計參考
  "Claude，實作 T032-T039 背景上傳系統時，
  請同時參考 docs/SMART_UPLOAD_API_DESIGN.md 的 API 設計"

  6. 實用的對話模式

  每日開始

  "Claude，請查看 PRODUCT_SMART_UPLOAD_TASKS.md，
  告訴我今天應該從哪個任務開始"

  遇到問題時

  "Claude，T019 實作有困難，
  請查看文檔並提供替代方案"

  完成階段時

  "Claude，第一階段所有任務完成了，
  請執行驗證檢查清單並準備進入第二階段"

  7. 最佳實踐建議

  // 🎯 推薦的工作流程
  const dailyWorkflow = {
    morning: "Claude，顯示今天待完成的任務",
    working: "Claude，實作 T[編號]",
    testing: "Claude，驗證 T[編號] 是否符合完成標準",
    evening: "Claude，更新今天完成的任務並顯示明天計畫"
  }

  // 📊 進度追蹤
  const weeklyReview = {
    monday: "Claude，顯示本週目標（第X階段）",
    friday: "Claude，總結本週完成的任務和下週計畫"
  }

  8. 常用指令模板

  | 情境     | 指令範例                                   |
  | -------- | ------------------------------------------ |
  | 開始任務 | 實作 PRODUCT_SMART_UPLOAD_TASKS.md 的 T006 |
  | 查看進度 | 顯示任務清單的完成進度                     |
  | 更新狀態 | 將 T006 標記為完成                         |
  | 批次處理 | 完成 T006-T010 的所有任務                  |
  | 驗證測試 | 執行第一階段的驗證檢查清單                 |
  | 問題處理 | T015 失敗了，提供解決方案                  |
  | 文檔參考 | 實作 T019，參考技術規格書                  |

  9. 小技巧 💡

  - 任務編號很重要 - 使用 T001-T056 精確指定
  - 階段性完成 - 不要跳過階段，按順序執行
  - 及時更新 - 完成即標記，保持進度準確
  - 遇到問題就問 - 讓 Claude 提供替代方案
  - 定期檢查 - 每週回顧進度和調整計畫