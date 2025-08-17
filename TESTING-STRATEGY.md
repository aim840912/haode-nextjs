# 電商專案測試策略

> **原則：只測試會影響營收的關鍵功能**
> 
> 個人電商專案不需要完整測試覆蓋，專注於最重要的業務邏輯即可。

## 🚨 必須測試（Priority 1）

### 1. 價格計算系統
**為什麼重要**：錯誤會直接導致財務損失

```javascript
// 測試案例
describe('價格計算', () => {
  test('折扣不能讓價格變成負數', () => {
    const price = calculateDiscountPrice(100, 150) // 150% 折扣
    expect(price).toBeGreaterThanOrEqual(0)
  })
  
  test('運費計算正確', () => {
    const shipping = calculateShipping('台北', 1.5) // 1.5kg
    expect(shipping).toBe(80) // 預期運費
  })
  
  test('總價包含稅金', () => {
    const total = calculateTotal([
      { price: 100, tax: 0.05 }
    ])
    expect(total).toBe(105)
  })
})
```

### 2. 庫存管理
**為什麼重要**：超賣會造成客戶不滿和退款問題

```javascript
describe('庫存管理', () => {
  test('不能超賣', () => {
    const canOrder = checkAvailability(productId, 5, 3) // 要買5個，庫存3個
    expect(canOrder).toBe(false)
  })
  
  test('訂單成功後扣除庫存', () => {
    processOrder(productId, 2)
    const remaining = getStock(productId)
    expect(remaining).toBe(1) // 原本3個，賣掉2個
  })
})
```

### 3. 訂單狀態流程
**為什麼重要**：錯誤的狀態會影響後續處理

```javascript
describe('訂單狀態', () => {
  test('付款後狀態變更為已付款', () => {
    const order = { status: 'pending', id: '123' }
    const updated = updateOrderStatus(order.id, 'paid')
    expect(updated.status).toBe('paid')
  })
  
  test('已出貨的訂單不能取消', () => {
    const order = { status: 'shipped', id: '123' }
    const result = cancelOrder(order.id)
    expect(result.success).toBe(false)
  })
})
```

## ⚠️ 建議測試（Priority 2）

### 4. 購物車邏輯
```javascript
describe('購物車', () => {
  test('商品數量不能超過庫存', () => {
    const result = addToCart(productId, 999)
    expect(result.success).toBe(false)
  })
  
  test('移除商品後總價正確', () => {
    removeFromCart(productId)
    const total = getCartTotal()
    expect(total).toBe(expectedTotal)
  })
})
```

### 5. 會員等級與折扣
```javascript
describe('會員折扣', () => {
  test('VIP會員享有正確折扣', () => {
    const discount = getMemberDiscount('VIP', 1000)
    expect(discount).toBe(100) // 10% 折扣
  })
})
```

## ❌ 不需要測試

### UI 元件
- 按鈕樣式
- 顏色變化
- 動畫效果
- RWD 排版

### 靜態功能
- 產品列表顯示
- 頁面導航
- 文字內容

### 第三方服務
- 金流串接（ECPay、Stripe）
- 物流查詢
- 簡訊通知

## 🛠️ 實用做法

### 1. 使用 TypeScript 防錯
```typescript
interface Order {
  id: string
  amount: number // 強制數字類型
  status: 'pending' | 'paid' | 'shipped' // 限制狀態值
}
```

### 2. 運行時檢查
```javascript
function calculateTotal(items) {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  
  // 簡單的防護檢查
  if (total < 0) throw new Error('總價不能為負數')
  if (isNaN(total)) throw new Error('總價必須是數字')
  
  return total
}
```

### 3. 關鍵路徑手動測試
每次部署前手動測試：
- [ ] 加入購物車
- [ ] 修改數量
- [ ] 結帳流程
- [ ] 付款成功
- [ ] 訂單確認

## 📈 發展階段建議

### MVP 階段（0-1萬營收）
- ❌ 不寫測試，專注快速上線
- ✅ 用 TypeScript 和 Lint
- ✅ 手動測試核心流程

### 成長階段（1-10萬營收）
- ✅ 為價格計算加測試
- ✅ 為庫存管理加測試
- ❌ 其他仍用手動測試

### 穩定階段（10萬+營收）
- ✅ 完整的業務邏輯測試
- ✅ 自動化測試流程
- ✅ 考慮 E2E 測試

## 🎯 快速檢查清單

部署前檢查：
```bash
# 1. 類型檢查
npm run type-check

# 2. 程式碼規範
npm run lint

# 3. 手動測試關鍵流程
# - 購買流程
# - 訂單管理
# - 庫存正確性

# 4. 有測試的話，跑一下測試
npm test
```

---

**記住：測試是手段，不是目的。讓客戶能順利購買比完美的測試覆蓋更重要！**