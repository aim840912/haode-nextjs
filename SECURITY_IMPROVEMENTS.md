# 專案安全改進計畫

## 🔒 安全性評估報告

### 評估日期
2025-08-24

### 評估範圍
- 認證與授權機制
- 資料庫安全（RLS 政策）
- API 端點安全
- 輸入驗證與清理
- 環境變數管理
- CSRF 保護

---

## ✅ 良好的安全實踐

### 1. 環境變數管理
- `.env*` 檔案已正確加入 `.gitignore`
- 提供 `.env.local.example` 範例檔案
- 敏感資訊（API Keys、資料庫密鑰）使用環境變數管理

### 2. 認證與授權系統
- 使用 Supabase 內建認證系統
- 實作角色基礎的權限控制（admin/customer）
- API 路由有 `requireAuth` 中間件保護

### 3. 輸入驗證與清理
- 實作 `sanitizeInput` 函數進行 XSS 防護
- Email 格式驗證
- 檔案上傳有類型和大小限制
- 圖片上傳驗證（`validateImageFile`）

### 4. 資料庫安全
- 使用 Supabase Row Level Security (RLS)
- 詢價單、審計日誌有適當的存取控制政策
- 使用參數化查詢避免 SQL injection

---

## ⚠️ 需要改進的安全問題

### 🔴 **高優先級**

#### 1. JWT Secret 使用不安全的預設值
**檔案**: `src/lib/auth-middleware.ts:4`
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
```
**風險**: 硬編碼的預設密鑰可能被攻擊者利用偽造 JWT token
**影響**: 高 - 可能導致身份偽造

#### 2. 部分資料表缺乏 RLS 保護
**檔案**: 
- `supabase/migrations/005_temp_disable_rls.sql` - profiles 表
- `supabase/migrations/007_disable_user_interests_rls.sql` - user_interests 表

**風險**: 使用者可能存取他人的個人資料
**影響**: 高 - 資料洩露風險

### 🟠 **中優先級**

#### 3. Admin API Key 驗證不強制
**檔案**: 
- `src/app/api/admin/locations/route.ts:12`
- `src/app/api/admin/products/route.ts:12`

```typescript
console.warn('ADMIN_API_KEY not set in environment variables')
```
**風險**: 管理員功能可能在沒有正確驗證的情況下被存取
**影響**: 中 - 未授權的管理操作

#### 4. CSRF 保護不完整
**檔案**: `src/lib/auth-middleware.ts:34-36`
```typescript
if (process.env.NODE_ENV === 'development') {
  return true  // 完全跳過 CSRF 檢查
}
```
**風險**: 開發環境容易受到 CSRF 攻擊
**影響**: 中 - 跨站請求偽造

### 🟡 **低優先級**

#### 5. 缺乏 Rate Limiting
**風險**: API 容易受到暴力攻擊和 DoS 攻擊
**影響**: 低 - 服務可用性

#### 6. 缺乏安全標頭
**風險**: 瀏覽器安全功能未充分利用
**影響**: 低 - XSS 和點擊劫持風險

---

## 🔧 詳細改進方案

### 1. 修復 JWT Secret 問題

#### 步驟 1: 修改 auth-middleware.ts
```typescript
// 修改前
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// 修改後
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

#### 步驟 2: 更新環境變數範例
在 `.env.local.example` 添加：
```bash
# JWT 簽名密鑰（必填）
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

#### 步驟 3: 生成安全的 JWT Secret
```bash
# 生成 256 位隨機密鑰
openssl rand -base64 32
```

### 2. 重新啟用 RLS 保護

#### 創建新的 Migration: `013_restore_rls_security.sql`
```sql
-- 為 profiles 表重新啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看和編輯自己的 profile
CREATE POLICY "users_can_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 管理員可以查看所有 profiles
CREATE POLICY "admins_can_view_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 為 user_interests 表重新啟用 RLS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_manage_own_interests" ON user_interests
  FOR ALL USING (user_id = auth.uid());
```

### 3. 加強 Admin API 驗證

#### 修改 Admin API 路由
```typescript
// 修改前
const envAdminKey = process.env.ADMIN_API_KEY
if (!envAdminKey) {
  console.warn('ADMIN_API_KEY not set in environment variables')
}

// 修改後
const envAdminKey = process.env.ADMIN_API_KEY
if (!envAdminKey) {
  return NextResponse.json(
    { error: 'Server configuration error' },
    { status: 500 }
  )
}

const providedKey = request.headers.get('x-admin-key')
if (providedKey !== envAdminKey) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
```

### 4. 改善 CSRF 保護

#### 實作 CSRF Token 機制
```typescript
// 新增 CSRF token 生成和驗證
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(request: NextRequest): boolean {
  const token = request.headers.get('x-csrf-token');
  const sessionToken = request.cookies.get('csrf-token')?.value;
  
  return token && sessionToken && token === sessionToken;
}
```

### 5. 添加 Rate Limiting

#### 改進現有的 Rate Limiting 中間件
```typescript
// 增加更嚴格的 rate limiting
export function strictRateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  return rateLimit(maxRequests, windowMs, {
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });
}
```

### 6. 配置安全標頭

#### 修改 next.config.ts
```typescript
const nextConfig = {
  // 現有配置...
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

---

## 📋 實施檢查清單

### 高優先級（立即執行）
- [ ] 修復 JWT Secret 硬編碼問題
- [ ] 為 profiles 表重新啟用 RLS
- [ ] 為 user_interests 表重新啟用 RLS
- [ ] 強制驗證 Admin API Key

### 中優先級（本週內完成）
- [ ] 改善 CSRF 保護機制
- [ ] 實作 CSRF token 驗證
- [ ] 添加更嚴格的 rate limiting
- [ ] 配置安全標頭

### 低優先級（下個版本）
- [ ] 實作 Content Security Policy
- [ ] 添加安全審計日誌
- [ ] 定期安全掃描
- [ ] 設置入侵檢測

---

## 🔍 定期安全審計

### 每月檢查項目
- [ ] 檢查是否有新的依賴套件漏洞
- [ ] 審查新添加的 API 端點安全性
- [ ] 檢查環境變數是否正確配置
- [ ] 審查 RLS 政策是否正常運作

### 每季檢查項目
- [ ] 完整的滲透測試
- [ ] 審查用戶權限分配
- [ ] 檢查審計日誌異常活動
- [ ] 更新安全依賴套件

### 年度檢查項目
- [ ] 全面安全架構審查
- [ ] 災難恢復計畫測試
- [ ] 員工安全培訓
- [ ] 第三方安全評估

---

## 🚀 最佳實踐指南

### 開發時的安全準則

1. **永遠驗證輸入**
   - 使用 `sanitizeInput` 清理所有用戶輸入
   - 驗證檔案上傳類型和大小
   - 使用正規表達式驗證格式

2. **最小權限原則**
   - 用戶只能存取自己的資料
   - API 端點按需要設置權限檢查
   - 定期檢查和清理不必要的權限

3. **敏感資料處理**
   - 密碼必須使用 bcrypt 或類似強雜湊
   - 敏感資料加密存儲
   - 審計日誌記錄敏感操作

4. **錯誤處理**
   - 不在錯誤訊息中洩露敏感資訊
   - 記錄詳細錯誤到伺服器日誌
   - 給用戶顯示通用錯誤訊息

### 部署前檢查清單
- [ ] 所有環境變數都已正確設定
- [ ] 移除或註解掉所有 console.log
- [ ] JWT_SECRET 已設定為強密鑰
- [ ] RLS 政策已啟用且測試通過
- [ ] Admin API Key 已配置
- [ ] 安全標頭已設置
- [ ] Rate limiting 已啟用

---

## 📞 緊急事件處理

### 發現安全問題時的處理步驟
1. **立即響應**
   - 評估影響範圍
   - 如需要，立即停止受影響的服務
   - 保留相關日誌和證據

2. **修復與恢復**
   - 實施臨時修復措施
   - 開發永久解決方案
   - 測試修復效果

3. **事後分析**
   - 分析根本原因
   - 更新安全措施
   - 記錄經驗教訓

### 聯絡資訊
- 開發團隊負責人：[填入聯絡方式]
- 系統管理員：[填入聯絡方式]
- 安全專家：[填入聯絡方式]

---

*最後更新：2025-08-24*
*下次審查：2025-09-24*