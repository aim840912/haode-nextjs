# Deprecated Services / 已棄用服務

此資料夾包含已被 v2 架構取代的舊版服務檔案。

## 棄用原因

這些服務已經透過適配器模式遷移到統一的 v2 架構，具備以下優勢：

- ✅ 統一的錯誤處理 (ErrorFactory.fromSupabaseError)
- ✅ 結構化日誌記錄 (dbLogger)
- ✅ 標準化的服務介面
- ✅ 向後相容性保證

## 檔案列表

### inquiryService.ts
- **棄用日期**: 2025-09-03
- **替代方案**: `inquiryServiceAdapter.ts` + `v2/inquiryServiceSimple.ts`
- **狀態**: 所有 API 路由已更新使用適配器

## 清理計畫

這些檔案將在以下條件滿足後安全刪除：
1. 確認所有 API 路由和服務都使用適配器
2. 完成一個完整的測試週期
3. 在生產環境中穩定運行至少一週

---

*此資料夾由服務層統一化收尾工作創建 - 2025-09-03*