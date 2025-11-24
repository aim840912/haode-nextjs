# 詢價單系統優化方案

查看詢價單系統的完整分析、痛點識別、優化建議和實作計劃。

## 使用時機

- 準備優化詢價流程，提升轉換率
- 需要降低表單填寫門檻
- 計劃整合社交通訊工具（LINE、WhatsApp）
- 希望改善行動裝置體驗

---

## 一、當前系統概覽

### 系統架構

**前端元件**
- `/src/app/inquiry/page.tsx` - 單一產品詢價表單
- `/src/app/inquiries/create/page.tsx` - 通用詢價建立頁面
- `/src/hooks/useEnhancedInquiryForm.ts` - 增強型表單 Hook（525行）

**後端服務**
- API: `/src/app/api/inquiries/route.ts`
- Service層: CQRS 架構（Query/Command/Inventory/Coordinator）
- 驗證: `/src/lib/validation/domain/inquiry-schemas.ts`

### 當前表單欄位（8個）

**必填（3個）**
1. customer_name - 客戶姓名
2. customer_email - Email
3. items - 詢價項目

**選填（5個）**
4. customer_phone - 聯絡電話
5. delivery_address - 配送地址
6. preferred_delivery_date - 希望配送日期
7. notes - 備註
8. quantity - 產品數量（預設1）

### 現有優勢功能

✅ 自動儲存機制（2秒延遲、24小時有效期）
✅ 即時驗證（onChange + onBlur）
✅ 已登入使用者自動填充 Email
✅ Mobile 友善設計（響應式、44x44px 觸控）
✅ 錯誤追蹤系統

---

## 二、痛點識別

### 使用者體驗痛點

❌ **欄位過多造成認知負擔**
- 8個欄位對快速詢價來說偏多
- 業界研究：每增加1個欄位，轉換率降低 11-13%

❌ **缺乏漸進式引導**
- 所有欄位一次呈現
- 沒有步驟指示或進度條

❌ **未登入使用者體驗不佳**
- 未登入無法提交（顯示黃色警告）
- 應允許訪客詢價，後續再引導註冊

❌ **產品資訊展示不夠直觀**
- 缺少產品圖片
- 沒有價格參考資訊

❌ **缺少社交化詢價通道**
- 未整合 LINE、WhatsApp
- 台灣 LINE 使用率極高，應提供快速聯繫

### 技術架構痛點

⚠️ 手機號碼驗證過於嚴格（可能拒絕國際電話、分機）
⚠️ 表單狀態管理複雜度高（525行 Hook）
⚠️ 缺少詢價範本功能（重複購買需每次重填）

---

## 三、優化方案（5個）

### 方案一：極簡快速詢價 ⭐ 推薦

**目標**：欄位縮減至核心3個，轉換率預期提升 40-60%

**設計**
```typescript
// 最小化欄位
{
  product_id: string      // 自動帶入
  quantity: number        // 預設1
  contact_method: 'email' | 'phone'  // 二選一
}
```

**流程**
1. 選擇產品、數量
2. 留下單一聯絡方式（Email 或 手機）
3. 顯示成功，提供「補充更多資訊」選項

**優勢**
- ✅ 降低75%欄位數量（8→3）
- ✅ 符合業界3-5欄位最佳實踐
- ✅ 行動裝置友善
- ✅ 降低使用者決策疲勞

**實作難度**：⭐⭐（中等）
**預期效果**：⭐⭐⭐⭐⭐（極高）

**實作要點**
```typescript
// 新建 /src/app/inquiry/quick/page.tsx
export default function QuickInquiryPage() {
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email')

  return (
    <form>
      <ProductInfo product={product} quantity={quantity} />

      <ContactMethodSelector
        value={contactMethod}
        onChange={setContactMethod}
      />

      {contactMethod === 'email' ? (
        <EmailInput />
      ) : (
        <PhoneInput />
      )}

      <SubmitButton />
    </form>
  )
}

// 更新 inquiry-schemas.ts
export const QuickInquirySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  contact_method: z.enum(['email', 'phone']),
  contact_value: z.string()
})
```

---

### 方案二：兩步驟詢價（平衡方案）

**目標**：平衡資訊收集與使用者體驗

**第一步：基本資訊（3欄位）**
- customer_name
- customer_email
- items

**第二步：配送細節（選填，可跳過）**
- customer_phone
- delivery_address
- preferred_delivery_date
- notes

**視覺設計**
- 步驟指示器（1/2）
- 「跳過此步驟」按鈕
- 進度條視覺化

**優勢**
- ✅ 漸進式披露資訊
- ✅ 給予使用者控制感
- ✅ 保留完整資料收集能力

**實作難度**：⭐⭐⭐（中高）
**預期效果**：⭐⭐⭐⭐（高）

---

### 方案三：社交化快速詢價

**目標**：整合台灣主流溝通工具

**新增功能**
```typescript
<QuickContactOptions>
  <LineButton />      // LINE 官方帳號
  <WhatsAppButton />  // WhatsApp
  <PhoneButton />     // 直接撥打
  <FormButton />      // 傳統表單
</QuickContactOptions>
```

**LINE 整合方案**
1. 點擊「LINE 詢價」按鈕
2. 開啟 LINE 對話視窗
3. 自動帶入產品資訊訊息範本

**訊息範本**
```
您好！我想詢問以下產品：
📦 產品：{product_name}
📊 數量：{quantity}

請提供報價和相關資訊，謝謝！
```

**優勢**
- ✅ 符合台灣使用者習慣
- ✅ 零學習曲線
- ✅ 即時對話體驗
- ✅ 降低表單填寫障礙

**實作難度**：⭐⭐⭐⭐（高）
**預期效果**：⭐⭐⭐⭐⭐（極高，台灣市場特別有效）

**實作要點**
```typescript
// LINE 按鈕元件
export function LineInquiryButton({ product, quantity }) {
  const handleLineInquiry = () => {
    const message = `您好！我想詢問：\n` +
      `📦 產品：${product.name}\n` +
      `📊 數量：${quantity}\n\n` +
      `請提供報價，謝謝！`

    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  return (
    <button onClick={handleLineInquiry}>
      <LineIcon /> LINE 快速詢價
    </button>
  )
}
```

---

### 方案四：智慧預填與範本系統

**目標**：提升回頭客體驗

**功能設計**

**1. 自動預填（已登入使用者）**
```typescript
{
  customer_name: user.profile.name,
  customer_email: user.email,
  customer_phone: user.profile.phone,
  delivery_address: user.profile.default_address
}
```

**2. 詢價範本**
```typescript
interface InquiryTemplate {
  id: string
  name: string              // "每週蔬菜箱"
  items: InquiryItem[]
  delivery_address: string
  preferred_delivery_date: 'weekly' | 'monthly'
}
```

**3. 快速複製**
- 在詢價歷史列表提供「再次詢價」按鈕
- 一鍵複製上次內容

**優勢**
- ✅ 大幅縮短回購時間
- ✅ 提升客戶忠誠度
- ✅ 適合訂閱制或定期採購

**實作難度**：⭐⭐⭐（中高）
**預期效果**：⭐⭐⭐（中，對回頭客特別有效）

---

### 方案五：訪客詢價（降低註冊障礙）

**目標**：允許未登入使用者提交詢價

**流程改造**
```typescript
// 現況：未登入 → 顯示警告 → 無法提交
// 改為：未登入 → 可提交 → 後續引導註冊
```

**實作策略**

**步驟1：允許訪客詢價**
- 移除登入檢查
- 僅要求 Email

**步驟2：提交後引導**
```
提交成功 → 顯示訊息：
「您的詢價已送出！
 註冊帳號可以：
 ✓ 追蹤詢價進度
 ✓ 查看歷史記錄
 ✓ 獲得更快回覆」

[立即註冊] [稍後再說]
```

**步驟3：Email 確認**
- 發送確認信
- 包含「建立帳號」連結

**優勢**
- ✅ 降低首次詢價門檻
- ✅ 擴大潛在客戶池
- ✅ 漸進式引導註冊
- ✅ 提升初次轉換率

**實作難度**：⭐⭐（中等）
**預期效果**：⭐⭐⭐⭐（高）

**實作要點**
```typescript
// /src/app/api/inquiries/guest/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = GuestInquirySchema.safeParse(body)

  const inquiry = await inquiryService.createGuestInquiry({
    ...result.data,
    is_guest: true
  })

  await sendInquiryConfirmationEmail(inquiry)
  return created(inquiry, '詢價已送出')
}
```

---

## 四、實作優先級與時程

### Phase 1（立即實作）- 2週 ⭐⭐⭐⭐⭐

**目標**：快速提升轉換率

1. **極簡快速詢價頁面**（3欄位）
   - 預期轉換率提升 40-60%
   - 實作時間：3-4天

2. **訪客詢價功能**
   - 擴大潛在客戶池
   - 實作時間：2-3天

3. **優化現有表單的欄位順序**
   - 低摩擦欄位優先
   - 實作時間：1天

### Phase 2（短期實作）- 4週

**目標**：整合台灣在地化功能

4. **LINE 快速詢價按鈕**
   - 台灣市場特有優勢
   - 實作時間：1週

5. **智慧預填功能**（已登入使用者）
   - 提升回購體驗
   - 實作時間：3-4天

### Phase 3（中期實作）- 6週

**目標**：完善進階功能

6. **詢價範本系統**
   - 適合定期採購
   - 實作時間：2週

7. **兩步驟詢價流程**（作為進階選項）
   - 保留完整資料收集
   - 實作時間：1週

---

## 五、成功指標（KPI）

### 追蹤指標

**轉換漏斗**
- 表單開始率：進入頁面 → 開始填寫
- 表單完成率：開始填寫 → 成功提交
- 整體轉換率：頁面訪問 → 詢價提交

**使用者體驗**
- 平均填寫時間：應從 2-3分鐘降至 30-60秒
- 錯誤率：驗證失敗次數
- 放棄率：各欄位的放棄比例

**業務指標**
- 詢價數量增長
- 回頭詢價率
- 訪客 vs 會員詢價比例

### 目標設定

| 指標 | 當前 | 目標 | 提升幅度 |
|------|------|------|----------|
| 表單完成率 | 基準 | +40% | 中 |
| 平均填寫時間 | 2-3分鐘 | 30-60秒 | -60% |
| 整體轉換率 | 基準 | +30% | 高 |
| 行動裝置轉換率 | 基準 | +50% | 高 |
| 詢價數量 | 基準 | 2-3倍 | 極高 |

---

## 六、風險與緩解策略

### 潛在風險

⚠️ **資料完整度降低**
- 極簡表單可能缺少配送資訊
- **緩解**：漸進式資料收集（首次最小、確認時補充、下單時完整）

⚠️ **假詢價增加**
- 訪客詢價可能增加無效詢價
- **緩解**：Email 驗證、reCAPTCHA、手機號碼 OTP（選用）

⚠️ **系統相容性**
- LINE 整合需測試多種裝置
- **緩解**：保留傳統表單、提供多種聯繫方式

---

## 七、業界參考數據

### B2B 表單優化研究（2025）

**核心數據**
- 每增加1個欄位，轉換率降低 **11-13%**
- B2B 表單最佳欄位數：**3-5個**
- 減少1個欄位可提升轉換率 **50%**
- 電話欄位平均降低轉換率 **5%**

**最佳實踐**
1. 最小化欄位 - 只問關鍵問題
2. 多步驟表單 - 降低認知負擔
3. 漸進式收集資料 - 分階段取得
4. 策略性欄位排序 - 低摩擦優先
5. 行動裝置優化 - 44x44px 觸控目標

---

## 八、快速執行檢查清單

在開始實作前，確認以下事項：

### 技術準備
- [ ] 已執行 `/opt-status` 檢查是否有相關優化歷史
- [ ] 確認當前系統架構（CQRS、Service 層）
- [ ] 檢查資料庫 schema 是否需要調整（訪客詢價需新增 `is_guest` 欄位）
- [ ] 確認 Email 服務可用（訪客確認信）

### 開發前檢查
- [ ] 執行 `/pre-dev-check 詢價單優化`
- [ ] 確認不與現有功能衝突
- [ ] 評估對效能的影響

### 實作後驗證
- [ ] 執行 `/api-check` 檢查新 API
- [ ] 測試所有裝置（Desktop、Mobile、Tablet）
- [ ] 確認 Email 通知正常運作
- [ ] 驗證表單驗證邏輯
- [ ] 檢查資料完整性

### 上線前確認
- [ ] A/B 測試設定（比較新舊流程）
- [ ] 監控儀表板就緒
- [ ] 回滾計劃準備
- [ ] 團隊培訓完成

---

## 九、相關文件

- 詢價單 API 文檔：`/src/app/api/inquiries/route.ts`
- 表單 Hook：`/src/hooks/useEnhancedInquiryForm.ts`
- 驗證 Schema：`/src/lib/validation/domain/inquiry-schemas.ts`
- 優化歷史：`docs/optimization/OPTIMIZATION_HISTORY.md`

---

## 總結

**核心問題**：當前詢價門檻過高（8欄位、強制登入、缺少快速聯繫）

**推薦方案**：
1. 立即實作極簡快速詢價（3欄位）+ 訪客詢價
2. 短期整合 LINE 快速詢價
3. 中期完善範本和兩步驟流程

**預期效果**：
- 整體轉換率提升 50-80%
- 填寫時間從 3分鐘 → 30秒
- 詢價數量增加 2-3倍
