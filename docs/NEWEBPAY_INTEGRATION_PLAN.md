# 藍新 NewebPay 金流整合計畫

> 建立日期：2025-11-21
> 狀態：規劃中

---

## 目錄

- [一、前置準備](#一前置準備)
- [二、資料庫設計](#二資料庫設計)
- [三、後端 API 開發](#三後端-api-開發)
- [四、前端整合](#四前端整合)
- [五、付款方式支援](#五付款方式支援)
- [六、安全性考量](#六安全性考量)
- [七、測試驗證](#七測試驗證)
- [八、時程規劃](#八時程規劃)

---

## 一、前置準備

### 1.1 藍新帳號資訊

需要準備以下資訊：

| 項目 | 說明 | 範例 |
|------|------|------|
| 商店代號 | MerchantID | `MS12345678` |
| HashKey | 加密金鑰 | `abcdefghij...` |
| HashIV | 加密向量 | `1234567890...` |

### 1.2 環境設定

在 `.env.local` 新增：

```env
# 藍新金流設定
NEWEBPAY_MERCHANT_ID=your_merchant_id
NEWEBPAY_HASH_KEY=your_hash_key
NEWEBPAY_HASH_IV=your_hash_iv

# API 端點（測試環境）
NEWEBPAY_API_URL=https://ccore.newebpay.com/MPG/mpg_gateway
NEWEBPAY_QUERY_URL=https://ccore.newebpay.com/API/QueryTradeInfo

# API 端點（正式環境）
# NEWEBPAY_API_URL=https://core.newebpay.com/MPG/mpg_gateway
# NEWEBPAY_QUERY_URL=https://core.newebpay.com/API/QueryTradeInfo
```

### 1.3 回調 URL 設定

```env
# 付款完成後返回頁面
NEWEBPAY_RETURN_URL=https://your-domain.com/api/payments/return

# 付款結果通知（後端對後端）
NEWEBPAY_NOTIFY_URL=https://your-domain.com/api/payments/notify
```

---

## 二、資料庫設計

### 2.1 擴充 orders 表

建立 Migration：`011_add_payment_fields.sql`

```sql
-- 擴充 orders 表的付款相關欄位
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_trade_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_bank_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS payment_va_account VARCHAR(20);

-- 新增索引
CREATE INDEX IF NOT EXISTS idx_orders_payment_trade_no
ON public.orders(payment_trade_no);

-- 欄位說明
COMMENT ON COLUMN public.orders.payment_method IS '付款方式：CREDIT, VACC, CVS, LINEPAY';
COMMENT ON COLUMN public.orders.payment_trade_no IS '藍新交易編號';
COMMENT ON COLUMN public.orders.payment_time IS '付款完成時間';
COMMENT ON COLUMN public.orders.payment_bank_code IS 'ATM 銀行代碼';
COMMENT ON COLUMN public.orders.payment_va_account IS 'ATM 虛擬帳號';
```

### 2.2 建立 payment_logs 表（選用）

用於記錄所有金流回調，方便除錯和對帳：

```sql
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  trade_no VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type VARCHAR(50),
  raw_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 只有管理員可以查看
CREATE POLICY "Admin can view payment logs" ON public.payment_logs
  FOR SELECT USING (is_admin());
```

---

## 三、後端 API 開發

### 3.1 API 端點規劃

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/payments/create` | 建立付款訂單 |
| POST | `/api/payments/notify` | 接收藍新付款通知 |
| GET | `/api/payments/return` | 付款完成返回頁 |
| GET | `/api/payments/[orderId]/status` | 查詢付款狀態 |

### 3.2 付款建立 API

`POST /api/payments/create`

**Request Body:**
```typescript
{
  orderId: string;
  paymentMethod: 'CREDIT' | 'VACC' | 'CVS';
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    paymentUrl: string;      // 藍新付款頁面 URL
    merchantOrderNo: string; // 商店訂單編號
    tradeInfo: string;       // 加密後的交易資訊
    tradeSha: string;        // 交易資訊雜湊
  }
}
```

### 3.3 付款通知 API

`POST /api/payments/notify`

藍新會 POST 以下資料：
- `Status`: 付款狀態
- `MerchantID`: 商店代號
- `TradeInfo`: AES 加密的交易資訊
- `TradeSha`: SHA256 雜湊

**處理流程：**
1. 驗證 TradeSha
2. 解密 TradeInfo
3. 更新訂單狀態
4. 記錄 payment_logs
5. 回傳 "OK"

### 3.4 Service 層設計

```typescript
// src/services/core/payment/PaymentService.ts

export class PaymentService {
  // === 查詢方法 ===
  async getPaymentStatus(orderId: string): Promise<PaymentStatus>;
  async getPaymentByTradeNo(tradeNo: string): Promise<Payment>;

  // === 命令方法 ===
  async createPayment(orderId: string, method: PaymentMethod): Promise<PaymentForm>;
  async processNotify(tradeInfo: string, tradeSha: string): Promise<void>;
  async queryFromNewebPay(orderId: string): Promise<PaymentStatus>;
}
```

---

## 四、前端整合

### 4.1 結帳流程

```
[購物車] → [確認訂單] → [選擇付款] → [藍新付款頁] → [付款結果]
```

### 4.2 結帳頁面元件

`src/app/(main)/checkout/page.tsx`

功能：
- 顯示訂單摘要
- 選擇付款方式
- 確認付款按鈕
- 導向藍新付款頁面

### 4.3 付款結果頁面

`src/app/(main)/payment/result/page.tsx`

功能：
- 顯示付款成功/失敗
- 顯示訂單資訊
- 提供下一步操作（查看訂單、繼續購物）

### 4.4 訂單狀態顯示

在「我的訂單」頁面顯示：
- 付款狀態（待付款、已付款、付款失敗）
- 付款方式
- ATM 帳號（如適用）
- 超商代碼（如適用）

---

## 五、付款方式支援

### 5.1 信用卡 (CREDIT)

| 項目 | 說明 |
|------|------|
| 支援卡別 | VISA, MasterCard, JCB |
| 手續費 | 2.5% - 2.8% |
| 特點 | 即時完成付款 |

### 5.2 ATM 虛擬帳號 (VACC)

| 項目 | 說明 |
|------|------|
| 繳費期限 | 預設 7 天 |
| 手續費 | $15/筆 |
| 特點 | 需等待用戶轉帳 |

### 5.3 超商代碼 (CVS)

| 項目 | 說明 |
|------|------|
| 支援超商 | 7-11, 全家, 萊爾富, OK |
| 繳費期限 | 預設 7 天 |
| 手續費 | $25/筆 |
| 金額限制 | $30 - $20,000 |

---

## 六、安全性考量

### 6.1 參數加密

使用 AES-256-CBC 加密交易資訊：

```typescript
import crypto from 'crypto';

function encryptTradeInfo(data: object): string {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    HASH_KEY,
    HASH_IV
  );
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

### 6.2 SHA256 驗證

```typescript
function generateTradeSha(tradeInfo: string): string {
  const data = `HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`;
  return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
}
```

### 6.3 回調驗證

1. 驗證 TradeSha 是否正確
2. 驗證 MerchantID 是否匹配
3. 驗證訂單金額是否一致
4. 記錄來源 IP

### 6.4 防止重複處理

```typescript
// 使用交易編號作為唯一識別
const existing = await getPaymentByTradeNo(tradeNo);
if (existing) {
  return; // 已處理過
}
```

---

## 七、測試驗證

### 7.1 測試環境

- API 端點：`https://ccore.newebpay.com/MPG/mpg_gateway`
- 測試信用卡：`4000-2211-1111-1111`
- 有效期限：大於當前月份
- CVV：任意三碼

### 7.2 測試案例

- [ ] 信用卡付款成功
- [ ] 信用卡付款失敗（餘額不足）
- [ ] ATM 虛擬帳號產生
- [ ] ATM 付款完成通知
- [ ] 超商代碼產生
- [ ] 超商繳費完成通知
- [ ] 付款逾期處理
- [ ] 重複通知處理

### 7.3 本地測試回調

使用 ngrok 將本地端暴露到網路：

```bash
ngrok http 3000
```

將產生的 URL 設定為回調 URL。

---

## 八、時程規劃

### 階段一：基礎建設（1-2 天）

- [ ] 資料庫 Migration
- [ ] 環境變數設定
- [ ] PaymentService 基礎架構

### 階段二：核心 API（2-3 天）

- [ ] 付款建立 API
- [ ] 加密/解密工具
- [ ] 付款通知 API
- [ ] 狀態查詢 API

### 階段三：前端整合（1-2 天）

- [ ] 結帳頁面
- [ ] 付款結果頁面
- [ ] 訂單狀態更新

### 階段四：測試驗證（1-2 天）

- [ ] 測試環境驗證
- [ ] 各種付款方式測試
- [ ] 錯誤處理測試

### 總計：5-7 天

---

## 參考資源

- [藍新金流 API 文件](https://www.newebpay.com/website/Page/content/download_api)
- [藍新測試環境](https://cwww.newebpay.com/)
- [MPG 串接規格書](https://www.newebpay.com/website/Page/content/download_api)

---

## 待確認事項

1. [ ] 藍新商店代號和金鑰
2. [ ] 需要支援哪些付款方式
3. [ ] 測試環境還是正式環境
4. [ ] ATM/超商繳費期限（預設 7 天）
5. [ ] 是否需要電子發票整合
