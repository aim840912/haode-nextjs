# 綠界科技（ECPay）支付系統整合規劃

> 完整的技術架構設計、實作指南和安全性規範

---

## 📋 目錄

- [1. 現有架構分析](#1-現有架構分析)
- [2. 技術選型建議](#2-技術選型建議)
- [3. 檔案結構規劃](#3-檔案結構規劃)
- [4. 環境變數配置](#4-環境變數配置)
- [5. 核心功能實作](#5-核心功能實作)
- [6. 安全性實作重點](#6-安全性實作重點)
- [7. 資料庫設計](#7-資料庫設計)
- [8. 開發步驟](#8-開發步驟)
- [9. API 端點設計](#9-api-端點設計)
- [10. 測試策略](#10-測試策略)
- [11. 風險與挑戰](#11-風險與挑戰)

---

## 1. 現有架構分析

### 專案特點
- **Next.js 15** + **Turbopack**（最新架構）
- **Supabase** 作為資料庫（PostgreSQL）
- **統一錯誤處理系統**（`@/lib/errors`）
- **API 中間件組合系統**（`withAuthAndError`, `withAdminAndError`）
- **CQRS 模式訂單服務**（OrderQueryService + OrderCommandService）
- **完整日誌系統**（apiLogger, dbLogger）

### 現有訂單系統
- **API 端點**：`/api/orders`, `/api/admin/orders`
- **Service 層**：OrderService, OrderCommandService, OrderQueryService
- **類型定義**：Order, OrderItem, OrderStatus
- **資料表**：`orders`, `order_items`

### 支付方式欄位狀態
✅ 資料庫和類型定義已有 `paymentMethod` 欄位
❌ 缺少前端選擇介面和支付流程實作

---

## 2. 技術選型建議

### 推薦：自行實作（非使用 SDK）

#### 優勢
- ✅ **完全掌控**：不依賴第三方社群套件
- ✅ **輕量化**：僅實作需要的功能
- ✅ **安全性高**：自行審查加密邏輯
- ✅ **維護性佳**：與專案架構深度整合
- ✅ **彈性高**：可根據業務需求客製化

#### 技術實作
- Node.js 內建 `crypto` 模組計算 CheckMacValue
- `zod` 進行參數驗證（與專案一致）
- 整合現有的錯誤處理系統（ExternalServiceError）

---

## 3. 檔案結構規劃

```
src/
├── services/
│   ├── core/
│   │   └── payment/         # 新增：付款服務
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── PaymentService.ts
│   │       ├── PaymentQueryService.ts
│   │       └── PaymentCommandService.ts
│   └── infrastructure/
│       └── payment/         # 新增：支付提供商整合
│           ├── index.ts
│           ├── ecpay/
│           │   ├── ECPayService.ts          # ECPay 主服務
│           │   ├── ECPayCheckMacValue.ts    # CheckMacValue 加密工具
│           │   ├── ECPayValidator.ts        # 回應驗證工具
│           │   ├── types.ts                 # ECPay 類型定義
│           │   └── constants.ts             # ECPay 常數
│           └── IPaymentProvider.ts          # 支付提供商介面
│
├── app/api/
│   ├── payments/
│   │   ├── route.ts                 # 建立付款、查詢付款狀態
│   │   ├── [id]/route.ts            # 單一付款詳情
│   │   └── ecpay/
│   │       ├── create/route.ts      # 建立 ECPay 交易
│   │       ├── callback/route.ts    # ECPay 付款結果通知（POST）
│   │       └── return/route.ts      # ECPay 使用者返回頁面（GET）
│   └── admin/
│       └── payments/
│           └── route.ts             # 管理員查看所有付款記錄
│
├── lib/
│   └── validation/
│       └── domain/
│           └── payment-schemas.ts   # 付款相關 Zod Schema
│
├── types/
│   └── payment.ts                   # 付款類型定義
│
└── components/
    └── features/
        └── payment/
            ├── PaymentButton.tsx         # 付款按鈕
            ├── PaymentStatusBadge.tsx    # 付款狀態標籤
            └── ECPayForm.tsx             # ECPay 表單提交元件
```

---

## 4. 環境變數配置

### .env.example 新增內容

```bash
# ==========================================
# 💰 綠界科技 ECPay 金流設定
# ==========================================

# ECPay 商戶 ID（測試環境：2000132）
ECPAY_MERCHANT_ID=your_merchant_id

# ECPay Hash Key（用於加密 CheckMacValue）
ECPAY_HASH_KEY=your_hash_key

# ECPay Hash IV（用於加密 CheckMacValue）
ECPAY_HASH_IV=your_hash_iv

# ECPay 環境模式（development | production）
ECPAY_ENV=development

# ECPay 付款結果通知網址（必須為 HTTPS）
ECPAY_NOTIFY_URL=${NEXT_PUBLIC_BASE_URL}/api/payments/ecpay/callback

# ECPay 使用者返回網址
ECPAY_RETURN_URL=${NEXT_PUBLIC_BASE_URL}/orders/payment-result
```

### 測試環境參數
- 商戶 ID：`2000132`
- Hash Key：`5294y06JbISpM5x9`
- Hash IV：`v77hoKGq4kWxNNIS`
- API URL：`https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5`

### 安全性提醒
⚠️ **Hash Key 和 Hash IV** 絕不能暴露給客戶端
⚠️ **生產環境** 必須使用 HTTPS
⚠️ **Callback URL** 必須可公開訪問（開發可用 ngrok）

---

## 5. 核心功能實作

### 5.1 CheckMacValue 加密工具

```typescript
// src/services/infrastructure/payment/ecpay/ECPayCheckMacValue.ts
import crypto from 'crypto'

export class ECPayCheckMacValue {
  /**
   * 計算 CheckMacValue（遵循 ECPay 規格）
   */
  static generate(params: Record<string, any>, hashKey: string, hashIV: string): string {
    // 1. 參數排序（ASCII 由小到大）
    const sortedKeys = Object.keys(params).sort()

    // 2. 組合參數字串：HashKey=xxx&param1=value1&param2=value2&HashIV=xxx
    const paramString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&')
    const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`

    // 3. URL Encode（特殊字元處理）
    const encodedString = encodeURIComponent(rawString)
      .replace(/%20/g, '+')  // 空格轉為 +
      .toLowerCase()

    // 4. SHA256 加密並轉為大寫
    return crypto
      .createHash('sha256')
      .update(encodedString)
      .digest('hex')
      .toUpperCase()
  }

  /**
   * 驗證回調資料的 CheckMacValue
   */
  static verify(
    receivedParams: Record<string, any>,
    hashKey: string,
    hashIV: string
  ): boolean {
    const receivedCheckMacValue = receivedParams.CheckMacValue
    const { CheckMacValue, ...paramsWithoutMac } = receivedParams
    const calculatedCheckMacValue = this.generate(paramsWithoutMac, hashKey, hashIV)

    return receivedCheckMacValue === calculatedCheckMacValue
  }
}
```

### 5.2 建立 ECPay 交易

```typescript
// src/services/infrastructure/payment/ecpay/ECPayService.ts
export class ECPayService {
  async createPayment(order: Order, paymentMethod: string): Promise<PaymentFormData> {
    // 1. 生成商戶交易編號（唯一）
    const merchantTradeNo = `${order.orderNumber}_${Date.now()}`

    // 2. 組合 ECPay 參數
    const params = {
      MerchantID: process.env.ECPAY_MERCHANT_ID,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: this.formatDate(new Date()),
      PaymentType: 'aio',
      TotalAmount: order.totalAmount,
      TradeDesc: '豪德農場訂單付款',
      ItemName: this.formatItems(order.items),
      ReturnURL: process.env.ECPAY_RETURN_URL,
      ChoosePayment: paymentMethod,  // Credit/ATM/CVS/BARCODE
      ClientBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.id}`,
    }

    // 3. 計算 CheckMacValue
    params.CheckMacValue = ECPayCheckMacValue.generate(
      params,
      process.env.ECPAY_HASH_KEY!,
      process.env.ECPAY_HASH_IV!
    )

    // 4. 儲存付款記錄到資料庫
    await this.paymentService.createPayment({
      orderId: order.id,
      merchantTradeNo,
      paymentType: paymentMethod,
      amount: order.totalAmount,
      status: 'pending',
      ecpayRequest: params,
    })

    // 5. 返回前端表單提交所需資料
    return {
      action: this.getApiUrl(),
      method: 'POST',
      params,
    }
  }
}
```

### 5.3 處理付款回調

```typescript
// src/app/api/payments/ecpay/callback/route.ts
async function handlePOST(req: NextRequest) {
  const formData = await req.formData()
  const params = Object.fromEntries(formData)

  // 1. 驗證 CheckMacValue（防止偽造）
  const isValid = ECPayCheckMacValue.verify(
    params,
    process.env.ECPAY_HASH_KEY!,
    process.env.ECPAY_HASH_IV!
  )

  if (!isValid) {
    apiLogger.error('ECPay 回調驗證失敗', { params })
    return new Response('0|CheckMacValue verification failed')
  }

  // 2. 記錄回調日誌
  await paymentCallbackService.create({
    merchantTradeNo: params.MerchantTradeNo,
    callbackType: 'notify',
    rawData: params,
    verified: true,
  })

  // 3. 更新付款和訂單狀態
  if (params.RtnCode === '1') {  // 付款成功
    await paymentService.updatePaymentStatus(
      params.MerchantTradeNo,
      'success',
      { ecpayResponse: params }
    )

    await orderService.updateOrderStatus(orderId, 'confirmed', '付款成功')
  }

  // 4. 回應 ECPay（必須回傳 '1|OK'）
  return new Response('1|OK')
}

export const POST = withErrorHandler(handlePOST, { module: 'ECPayCallback' })
```

---

## 6. 安全性實作重點

### 關鍵安全措施

1. **CheckMacValue 驗證**
   - ✅ 所有 ECPay 回調必須驗證 CheckMacValue
   - ✅ 驗證失敗的請求記錄到日誌並拒絕處理

2. **重複通知防護**
   - ✅ 檢查 `merchant_trade_no` 是否已處理
   - ✅ 使用資料庫唯一約束防止重複付款

3. **金額驗證**
   - ✅ 回調金額必須與訂單金額一致
   - ✅ 金額不符記錄警告並通知管理員

4. **HTTPS 強制**
   - ✅ 生產環境強制使用 HTTPS
   - ✅ Callback URL 驗證（避免 SSRF 攻擊）

5. **敏感資料保護**
   - ✅ Hash Key/IV 僅存於伺服器端環境變數
   - ✅ ECPay 回應的敏感欄位謹慎處理

---

## 7. 資料庫設計

### Migration SQL

```sql
-- 009_create_payments_tables.sql

-- 付款交易表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  merchant_trade_no VARCHAR(20) UNIQUE NOT NULL,
  ecpay_trade_no VARCHAR(20),
  payment_type VARCHAR(20) NOT NULL,  -- Credit/ATM/CVS/BARCODE
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  amount INTEGER NOT NULL,
  ecpay_request JSONB,
  ecpay_response JSONB,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 付款回調日誌表
CREATE TABLE payment_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  merchant_trade_no VARCHAR(20) NOT NULL,
  callback_type VARCHAR(10) NOT NULL,  -- return/notify
  raw_data JSONB NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 擴充 orders 表
ALTER TABLE orders
  ADD COLUMN payment_id UUID REFERENCES payments(id),
  ADD COLUMN can_pay_immediately BOOLEAN DEFAULT TRUE;

-- 索引優化
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_merchant_trade_no ON payments(merchant_trade_no);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_callbacks_merchant_trade_no ON payment_callbacks(merchant_trade_no);
```

---

## 8. 開發步驟

### 階段 1：基礎設施建立（1-2 天）
1. ✅ 建立資料庫 Migration（payments 相關表）
2. ✅ 建立 ECPay 工具類別（CheckMacValue、常數定義）
3. ✅ 建立付款服務層（PaymentService、PaymentCommandService、PaymentQueryService）
4. ✅ 設定環境變數和配置

### 階段 2：核心功能實作（2-3 天）
5. ✅ 實作 ECPayService（建立交易、驗證回調）
6. ✅ 實作 API 端點：
   - `/api/payments/ecpay/create` - 建立付款
   - `/api/payments/ecpay/callback` - 處理回調
   - `/api/payments/ecpay/return` - 使用者返回頁面
7. ✅ 整合訂單服務（訂單狀態更新邏輯）

### 階段 3：前端整合（1-2 天）
8. ✅ 建立付款按鈕元件（PaymentButton）
9. ✅ 建立 ECPay 表單提交元件（自動提交 POST）
10. ✅ 建立付款結果頁面（/orders/payment-result）
11. ✅ 訂單詳情頁顯示付款狀態

### 階段 4：測試與優化（2-3 天）
12. ✅ 測試環境測試（使用 ECPay 測試商戶號）
13. ✅ 測試四種付款方式（信用卡、ATM、超商代碼、超商條碼）
14. ✅ 測試回調處理（成功、失敗、逾期）
15. ✅ 安全性測試（CheckMacValue 驗證、重複通知）
16. ✅ 錯誤處理和日誌驗證

### 階段 5：管理員功能（1 天）
17. ✅ 管理員查看付款記錄頁面
18. ✅ 付款狀態篩選和搜尋
19. ✅ 手動對帳功能（可選）

**總開發時間估計：7-11 天**

---

## 9. API 端點設計

### 使用者端 API

#### POST /api/payments/ecpay/create
**功能**：建立 ECPay 付款交易
**認證**：需要使用者登入
**請求**：
```json
{
  "orderId": "uuid",
  "paymentMethod": "Credit"
}
```
**回應**：
```json
{
  "success": true,
  "data": {
    "action": "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
    "method": "POST",
    "params": {
      "MerchantID": "2000132",
      "MerchantTradeNo": "ORD20250107001_1234567890",
      "CheckMacValue": "...",
    }
  }
}
```

#### POST /api/payments/ecpay/callback
**功能**：接收 ECPay 付款結果通知（WebHook）
**認證**：無（驗證 CheckMacValue）
**回應**：`1|OK` 或 `0|Error`

#### GET /api/payments/ecpay/return
**功能**：使用者付款完成後返回頁面
**重定向**：`/orders/payment-result?status=success&orderId=xxx`

### 管理員 API

#### GET /api/admin/payments
**功能**：查看所有付款記錄
**認證**：需要管理員權限
**查詢參數**：`status`, `paymentMethod`, `dateFrom`, `dateTo`

---

## 10. 測試策略

### 功能測試
1. 建立訂單 → 選擇付款方式 → 跳轉 ECPay
2. 完成付款 → 驗證回調 → 訂單狀態更新
3. 付款失敗 → 記錄失敗原因 → 允許重新付款
4. ATM 虛擬帳號 → 記錄帳號和期限 → 逾期處理
5. 超商代碼 → 記錄代碼和期限 → 逾期處理

### 安全性測試
1. 偽造 CheckMacValue → 驗證失敗 → 拒絕處理
2. 重複回調通知 → 冪等性檢查 → 不重複扣款
3. 金額不符 → 記錄警告 → 人工審核
4. 過期訂單付款 → 拒絕處理

### 效能測試
1. 並發建立付款請求（50+ QPS）
2. 高頻回調處理（防止 ECPay 重複通知）

---

## 11. 風險與挑戰

### 潛在風險

1. **開發環境回調問題**
   - **問題**：本地開發無法接收 ECPay HTTPS 回調
   - **解決**：使用 ngrok 或 Vercel Preview Deployment

2. **CheckMacValue 計算錯誤**
   - **問題**：字元編碼或排序錯誤導致驗證失敗
   - **解決**：參考官方範例，完整單元測試

3. **付款狀態同步延遲**
   - **問題**：使用者返回比通知回調更早到達
   - **解決**：前端輪詢付款狀態 API

4. **超商付款逾期處理**
   - **問題**：超商繳費期限（3-7 天）後需自動取消訂單
   - **解決**：使用 Cron Job 或 Vercel Cron 定期檢查

---

## 📚 相關資源

- **綠界官方文件**：https://www.ecpay.com.tw/Service/API_Dwnld
- **測試環境申請**：需聯繫綠界業務
- **Node.js crypto 文件**：https://nodejs.org/api/crypto.html

---

## 📝 總結

### 推薦方案摘要

| 項目 | 選擇 | 原因 |
|------|------|------|
| **SDK** | 自行實作 | 輕量、可控、安全 |
| **付款方式** | 信用卡/ATM/超商代碼/超商條碼 | 涵蓋主流支付習慣 |
| **資料庫** | 混合模式 | 查詢效能佳、歷史完整 |
| **安全性** | CheckMacValue + HTTPS + 日誌 | 符合金流安全標準 |

### 建議開發時程

- **最小可行版本（MVP）**：7 天（僅信用卡付款）
- **完整版本**：11 天（四種付款方式 + 管理功能）
- **生產就緒**：+3 天（測試、文檔、部署）

---

**文件版本**：v1.0
**最後更新**：2025-01-07
**維護者**：Claude Code

使用此規劃開始實作時，請先確認：
1. ECPay 測試帳號已申請
2. 環境變數已正確設定
3. 資料庫 Migration 已執行
4. 開發環境可接收 HTTPS 回調（ngrok/Vercel）
