# 權限系統改進計畫

## 概述

本文件分析目前詢價系統的權限架構，並提出多種改進方案以加強隱私保護和存取控制。

## 現況分析

### 目前權限架構

系統使用 Supabase Row Level Security (RLS) 實作權限控制：

#### 一般使用者權限
- 只能查看、建立和更新自己的詢價單
- 無法存取其他使用者的資料

#### 管理員權限
- **完整存取權限**：可以查看所有使用者的詢價紀錄
- **管理操作**：可以更新任何詢價單狀態、刪除詢價單
- **統計查看**：可以存取詢價統計資訊

### 權限實作位置

1. **資料庫層級** (`supabase/migrations/009_create_inquiry_tables.sql`)
   ```sql
   -- 管理員可以查看所有詢價單
   CREATE POLICY "Admins can view all inquiries" ON inquiries
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM profiles 
         WHERE profiles.id = auth.uid() 
         AND profiles.role = 'admin'
       )
     );
   ```

2. **前端層級** (`src/app/admin/inquiries/page.tsx`)
   - 管理員介面顯示所有詢價單
   - 包含完整的客戶資訊（姓名、email、電話、地址）

### 隱私考量

目前設計符合一般商業系統需求，但可能存在以下考量：
- 管理員可存取所有客戶個人資訊
- 沒有存取行為的追蹤記錄
- 缺乏資料存取的細粒度控制

## 改進方案

### 方案一：實作審計日誌系統

**目標**：追蹤和記錄所有資料存取行為

#### 資料庫設計
```sql
-- 建立審計日誌表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL, -- 'view', 'update', 'delete', 'export'
  resource_type VARCHAR(50) NOT NULL, -- 'inquiry', 'customer_data'
  resource_id VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

#### 實作步驟
1. 建立審計日誌資料表
2. 在 API 路由中加入日誌記錄
3. 建立審計日誌查看介面
4. 實作定期審查機制

#### 程式碼範例
```typescript
// 審計日誌服務
export class AuditLogService {
  static async log(params: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: any;
    request?: Request;
  }) {
    const { data, error } = await createServiceSupabaseClient()
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        ip_address: params.request?.headers.get('x-forwarded-for') || 'unknown',
        user_agent: params.request?.headers.get('user-agent') || 'unknown',
        metadata: params.metadata || {}
      });
    
    if (error) {
      console.error('Audit log failed:', error);
    }
  }
}
```

### 方案二：資料最小化原則

**目標**：限制管理員預設可見的敏感資訊

#### 實作概念
- 管理員預設只看到業務必要資訊
- 敏感資訊需要額外權限或操作才能查看
- 實作資料遮罩功能

#### 資料庫修改
```sql
-- 建立敏感資料存取權限表
CREATE TABLE sensitive_data_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  permission_type VARCHAR(50) NOT NULL, -- 'view_phone', 'view_address', 'view_email'
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 前端實作
```typescript
// 敏感資料組件
const SensitiveDataField = ({ 
  value, 
  type, 
  hasPermission 
}: {
  value: string;
  type: 'phone' | 'email' | 'address';
  hasPermission: boolean;
}) => {
  if (!hasPermission) {
    return (
      <span className="text-gray-400">
        {maskSensitiveData(value, type)}
        <button onClick={() => requestAccess(type)}>
          請求查看
        </button>
      </span>
    );
  }
  return <span>{value}</span>;
};
```

### 方案三：角色權限細分

**目標**：建立更細粒度的權限控制

#### 角色定義
- **客服人員 (customer_service)**：可查看詢價單，但不能刪除
- **業務經理 (sales_manager)**：可處理詢價單，包含報價功能
- **系統管理員 (admin)**：完整系統權限
- **稽核人員 (auditor)**：只能查看審計日誌

#### 資料庫修改
```sql
-- 修改 profiles 表支援更多角色
ALTER TABLE profiles 
DROP CONSTRAINT profiles_role_check,
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'customer_service', 'sales_manager', 'admin', 'auditor'));

-- 建立角色權限表
CREATE TABLE role_permissions (
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  PRIMARY KEY (role, resource, action)
);

-- 插入權限配置
INSERT INTO role_permissions VALUES
  ('customer_service', 'inquiry', 'view'),
  ('customer_service', 'inquiry', 'update_status'),
  ('sales_manager', 'inquiry', 'view'),
  ('sales_manager', 'inquiry', 'update'),
  ('sales_manager', 'inquiry', 'quote'),
  ('admin', 'inquiry', 'all'),
  ('auditor', 'audit_log', 'view');
```

#### RLS 政策更新
```sql
-- 替換現有的管理員政策
DROP POLICY "Admins can view all inquiries" ON inquiries;

CREATE POLICY "Staff can view inquiries based on role" ON inquiries
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() 
      AND rp.resource = 'inquiry'
      AND rp.action IN ('view', 'all')
    )
  );
```

### 方案四：敏感資料加密

**目標**：在資料庫層級保護客戶隱私資料

#### 實作方式
- 使用 Supabase 的加密功能或應用層加密
- 敏感欄位加密儲存
- 僅在必要時解密

#### 資料庫函數範例
```sql
-- 建立加密解密函數
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 使用 pgcrypto 加密
  RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 解密資料
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql;
```

#### 應用層實作
```typescript
// 加密服務
export class EncryptionService {
  private static readonly KEY = process.env.ENCRYPTION_KEY!;
  
  static encrypt(data: string): string {
    // 實作加密邏輯
    return crypto.encrypt(data, this.KEY);
  }
  
  static decrypt(encryptedData: string): string {
    // 實作解密邏輯
    return crypto.decrypt(encryptedData, this.KEY);
  }
}
```

## 實作優先順序建議

### 第一階段：基礎安全強化
1. **實作審計日誌系統** - 高優先級
   - 影響：高（提供完整追蹤能力）
   - 複雜度：中等
   - 時間估計：1-2 週

### 第二階段：權限細化
2. **角色權限細分** - 中等優先級
   - 影響：中等（提供更精確的權限控制）
   - 複雜度：高
   - 時間估計：2-3 週

### 第三階段：隱私增強
3. **資料最小化原則** - 中等優先級
   - 影響：中等（減少不必要的資料曝露）
   - 複雜度：中等
   - 時間估計：1-2 週

4. **敏感資料加密** - 低優先級
   - 影響：高（最強的資料保護）
   - 複雜度：高
   - 時間估計：3-4 週

## 結論

目前的權限系統已經提供了基本的安全保護，符合一般商業系統的需求。建議的改進方案可以根據實際的隱私需求和法規要求選擇性實作。

**立即建議**：
- 實作審計日誌系統作為第一步
- 評估業務需求，決定是否需要更嚴格的隱私控制
- 考慮法規遵循要求（如 GDPR、個資法等）

**長期規劃**：
- 建立定期的安全審查機制
- 實作更細粒度的權限控制
- 考慮引入資料保留和刪除政策