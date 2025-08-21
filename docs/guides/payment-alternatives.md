# 支付系統替代方案指南

## 概述

對於農產品電商平台，不一定需要立即整合複雜的線上支付系統。許多成功的農產品電商採用更貼近在地農業的交易模式，如詢價、預訂、或面對面交易。本文件提供五種支付系統的替代方案，協助您選擇最適合的解決方案。

## 為什麼考慮替代方案？

- **降低開發複雜度**：避免處理金流、安全認證等複雜技術
- **減少法規負擔**：不需要處理 PCI DSS 等支付相關法規
- **建立信任關係**：面對面或電話聯絡更容易建立客戶信任
- **靈活定價**：可以根據季節、數量等因素調整價格
- **降低成本**：避免金流手續費和系統維護成本

## 五種替代方案

### 1. 詢價/預訂系統 ⭐ (最推薦)

**概念**：客戶選擇產品後提交詢價單，與賣家確認細節和價格後再進行交易。

**適用場景**：
- 產品價格會因季節、品質而變動
- 需要確認庫存和交貨時間
- 客製化包裝或大量採購

**優點**：
- 保留完整的產品瀏覽體驗
- 可以針對不同客戶提供不同報價
- 容易整合到現有系統
- 未來升級到支付系統很簡單

**實作要點**：
```sql
-- 詢價單主表
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- pending, quoted, confirmed, completed, cancelled
  notes TEXT,
  total_estimated_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 詢價單項目表
CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 聯絡表單系統

**概念**：每個產品頁面提供專用的聯絡表單，客戶可以直接詢問產品資訊。

**適用場景**：
- 產品種類較少
- 需要詳細說明產品特色
- 客製化需求較多

**優點**：
- 實作簡單快速
- 可以收集詳細的客戶需求
- 適合個人化服務

**實作範例**：
```typescript
interface ContactForm {
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  quantity?: number;
  message: string;
  preferredContactTime?: string;
}
```

### 3. 興趣清單轉訂單

**概念**：擴充現有的「我有興趣」功能，允許客戶將興趣清單轉為詢價單。

**適用場景**：
- 客戶需要比較多種產品
- 季節性採購
- 團購或大宗採購

**優點**：
- 充分利用現有功能
- 可以批次處理多項產品
- 提高客戶參與度

**實作要點**：
- 在興趣清單頁面加入「批次詢價」功能
- 允許編輯每項產品的數量
- 一次性提交所有感興趣的產品

### 4. LINE/WhatsApp 整合

**概念**：「立即詢問」按鈕直接導向 LINE 官方帳號或 WhatsApp，透過對話完成訂購。

**適用場景**：
- 目標客戶習慣使用即時通訊
- 重視即時回應和個人化服務
- 小規模經營，可以人工處理對話

**優點**：
- 即時互動體驗佳
- 可以發送產品照片和影片
- 建立長期客戶關係

**實作範例**：
```typescript
// LINE 深度連結
const createLineLink = (product: Product) => {
  const message = `您好，我對以下產品有興趣：
  
產品：${product.name}
價格：NT$ ${product.price}
連結：${window.location.origin}/products/${product.id}

請問目前有現貨嗎？`;
  
  return `https://line.me/ti/p/你的LINE官方帳號?text=${encodeURIComponent(message)}`;
};
```

### 5. 預約取貨系統

**概念**：客戶線上選擇產品，預約取貨時間和地點，現場付款取貨。

**適用場景**：
- 有實體店面或固定販售地點
- 農夫市集、展售活動
- 強調新鮮度，適合當天取貨

**優點**：
- 確保產品新鮮度
- 面對面建立信任
- 可以現場推薦其他產品

**資料結構**：
```sql
CREATE TABLE pickup_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  pickup_location VARCHAR(255) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time_slot VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  payment_method VARCHAR(50) DEFAULT 'cash_on_pickup',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 方案比較表

| 方案 | 開發難度 | 維護成本 | 用戶體驗 | 適用規模 | 信任建立 |
|------|----------|----------|----------|----------|----------|
| 詢價/預訂系統 | 中 | 中 | 優 | 中大型 | 優 |
| 聯絡表單系統 | 低 | 低 | 中 | 小型 | 優 |
| 興趣清單轉訂單 | 低 | 低 | 中 | 小中型 | 中 |
| LINE/WhatsApp整合 | 低 | 中 | 優 | 小型 | 優 |
| 預約取貨系統 | 中 | 中 | 中 | 小中型 | 優 |

## 實作指南：詢價/預訂系統

以下是實作詢價/預訂系統的詳細步驟：

### 步驟 1：資料庫設置

在 Supabase 中執行以下 SQL：

```sql
-- 建立詢價單表
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  total_estimated_amount DECIMAL(10,2),
  delivery_address TEXT,
  preferred_delivery_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立詢價單項目表
CREATE TABLE inquiry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 設定 RLS 政策
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_items ENABLE ROW LEVEL SECURITY;

-- 用戶只能看自己的詢價單
CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id);

-- 用戶只能建立自己的詢價單
CREATE POLICY "Users can insert own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理員可以看所有詢價單
CREATE POLICY "Admins can view all inquiries" ON inquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 步驟 2：修改購物車邏輯

```typescript
// types/inquiry.ts
export interface Inquiry {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  total_estimated_amount?: number;
  delivery_address?: string;
  preferred_delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  notes?: string;
}

// services/inquiryService.ts
export class InquiryService {
  static async createInquiry(inquiryData: Partial<Inquiry>, items: InquiryItem[]) {
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert(inquiryData)
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    const itemsWithInquiryId = items.map(item => ({
      ...item,
      inquiry_id: inquiry.id
    }));

    const { error: itemsError } = await supabase
      .from('inquiry_items')
      .insert(itemsWithInquiryId);

    if (itemsError) throw itemsError;

    return inquiry;
  }

  static async getUserInquiries(userId: string) {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        inquiry_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
```

### 步驟 3：修改前端介面

將現有的購物車頁面改為詢價單頁面：

```typescript
// pages/inquiry.tsx
export default function InquiryPage() {
  const { items: cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryAddress: '',
    notes: ''
  });

  const submitInquiry = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const inquiryData = {
        user_id: user.id,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.deliveryAddress,
        notes: customerInfo.notes,
        total_estimated_amount: totalAmount
      };

      const inquiryItems = cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_category: item.category,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      await InquiryService.createInquiry(inquiryData, inquiryItems);
      
      clearCart();
      alert('詢價單已送出，我們會盡快回覆您！');
      router.push('/inquiries');
    } catch (error) {
      console.error('提交詢價單失敗:', error);
      alert('提交失敗，請稍後再試');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">送出詢價單</h1>
      
      {/* 產品清單 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">選購產品</h2>
        {cartItems.map(item => (
          <div key={item.id} className="flex justify-between items-center py-3 border-b">
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-gray-600">數量: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">NT$ {item.price * item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 客戶資訊表單 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">聯絡資訊</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="姓名"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="tel"
            placeholder="電話"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="配送地址"
            value={customerInfo.deliveryAddress}
            onChange={(e) => setCustomerInfo({...customerInfo, deliveryAddress: e.target.value})}
            className="border rounded-lg px-3 py-2"
            rows={2}
          />
        </div>
        <textarea
          placeholder="備註或特殊需求"
          value={customerInfo.notes}
          onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
          className="border rounded-lg px-3 py-2 w-full mt-4"
          rows={3}
        />
      </div>

      {/* 送出按鈕 */}
      <div className="text-center">
        <button
          onClick={submitInquiry}
          disabled={!customerInfo.name || !customerInfo.email}
          className="bg-amber-900 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          送出詢價單
        </button>
      </div>
    </div>
  );
}
```

### 步驟 4：管理後台

為管理員建立詢價單管理介面：

```typescript
// pages/admin/inquiries.tsx
export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId);

    if (error) {
      console.error('更新狀態失敗:', error);
      return;
    }

    // 更新本地狀態
    setInquiries(inquiries.map(inquiry => 
      inquiry.id === inquiryId ? { ...inquiry, status } : inquiry
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">詢價單管理</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">詢價單號</th>
              <th className="px-4 py-3 text-left">客戶</th>
              <th className="px-4 py-3 text-left">狀態</th>
              <th className="px-4 py-3 text-left">金額</th>
              <th className="px-4 py-3 text-left">建立時間</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map(inquiry => (
              <tr key={inquiry.id} className="border-t">
                <td className="px-4 py-3">{inquiry.id.slice(0, 8)}</td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{inquiry.customer_name}</div>
                    <div className="text-sm text-gray-600">{inquiry.customer_email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={inquiry.status}
                    onChange={(e) => updateInquiryStatus(inquiry.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="pending">待處理</option>
                    <option value="quoted">已報價</option>
                    <option value="confirmed">已確認</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  NT$ {inquiry.total_estimated_amount || 0}
                </td>
                <td className="px-4 py-3">
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    查看詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Email 通知功能

設置自動 Email 通知：

```typescript
// utils/emailService.ts
export class EmailService {
  static async sendInquiryConfirmation(inquiry: Inquiry, items: InquiryItem[]) {
    const emailContent = `
      親愛的 ${inquiry.customer_name}，

      感謝您的詢價！我們已收到您的詢價單，編號：${inquiry.id}

      詢價內容：
      ${items.map(item => `- ${item.product_name} x ${item.quantity}`).join('\n')}

      我們會在24小時內回覆您詳細的報價和配送資訊。

      如有任何問題，請隨時聯絡我們。

      謝謝！
    `;

    // 這裡可以整合 SendGrid, Resend 或其他 Email 服務
    console.log('發送確認信給:', inquiry.customer_email);
    console.log('信件內容:', emailContent);
  }

  static async notifyAdminNewInquiry(inquiry: Inquiry) {
    // 通知管理員有新詢價單
    console.log('通知管理員新詢價單:', inquiry.id);
  }
}
```

## 未來升級建議

### 1. 整合支付系統
當業務成長到一定規模時，可以考慮整合：
- **台灣**：綠界科技 ECPay、藍新金流 NewebPay
- **國際**：Stripe、PayPal
- **行動支付**：LINE Pay、街口支付

### 2. 庫存管理
- 即時庫存更新
- 預訂庫存保留
- 缺貨通知功能

### 3. 物流整合
- 宅配通 API 整合
- 超商取貨付款
- 配送狀態追蹤

### 4. 客戶關係管理
- 客戶購買歷史
- 偏好商品推薦
- 會員等級制度

### 5. 數據分析
- 銷售報表
- 熱銷商品分析
- 客戶行為分析

## 結論

選擇適合的支付替代方案可以讓您快速上線並開始經營，同時保留未來升級的彈性。建議從**詢價/預訂系統**開始，因為它提供最完整的用戶體驗，且容易擴充。

隨著業務成長和客戶需求變化，再逐步整合更多功能。記住，最重要的是建立客戶信任和提供優質服務，而不是擁有最複雜的技術系統。