# 🔐 最高權限帳號安全強化實施計劃

> **文件版本**: 1.0.0  
> **建立日期**: 2025-09-09  
> **專案**: Haude 農業電商平台  
> **優先級**: 極高  
> **預估工時**: 8-14 小時  

## 📋 執行摘要

本文件描述如何全面強化 Haude 平台最高權限帳號（如 admin@gmail.com）的安全性，透過多層次防護機制降低帳號被盜用的風險。

### 核心目標
- 🎯 防止帳號被盗用或未授權存取
- 🎯 實施即時威脅監控和通知
- 🎯 建立多因素身份驗證機制
- 🎯 確保敏感操作的完整審計追蹤

## 🔍 現況分析

### ✅ 現有安全機制

| 機制 | 狀態 | 位置 |
|------|------|------|
| Supabase Auth 身份驗證 | ✅ 已實施 | `src/lib/supabase-server.ts` |
| JWT Token 加密 | ✅ 已實施 | `src/lib/auth-middleware.ts:5-13` |
| CSRF 保護 | ✅ 已實施 | `src/middleware.ts:19-328` |
| Rate Limiting | ✅ 已實施 | `src/middleware.ts` |
| 審計日誌系統 | ✅ 已實施 | `src/types/audit.ts` |
| 統一錯誤處理 | ✅ 已實施 | `src/lib/api-middleware/auth.ts` |

### ❌ 安全缺口

| 風險 | 影響級別 | 目前狀況 |
|------|----------|----------|
| 硬編碼管理員 Email | 🔴 高風險 | `admin@example.com` 在程式碼中 |
| 缺少雙因素認證 | 🔴 高風險 | 僅依賴密碼驗證 |
| 無 IP 白名單 | 🟡 中風險 | 任何位置都可登入 |
| 無設備追蹤 | 🟡 中風險 | 無法識別可疑設備 |
| 缺少登入通知 | 🟡 中風險 | 無法即時發現異常登入 |

## 🏗️ 安全強化架構

### 多層次防護體系

```
┌─────────────────────┐
│   第1層：身份驗證    │ ← 密碼 + 2FA + 硬體金鑰
├─────────────────────┤
│   第2層：存取控制    │ ← IP白名單 + 設備驗證 + 時間限制
├─────────────────────┤
│   第3層：行為監控    │ ← 異常偵測 + 即時通知 + 審計日誌
├─────────────────────┤
│   第4層：Session管理  │ ← 自動登出 + 並行限制 + 強制重新認證
└─────────────────────┘
```

## 📐 實施階段

### 第一階段：立即安全修復（2-3小時）

#### 1.1 移除硬編碼的管理員 Email

**問題**: 目前管理員 Email 硬編碼在程式碼中
```typescript
// 🔴 風險：src/lib/email-service.ts:23
adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com'
```

**解決方案**:
```typescript
// ✅ 安全：動態獲取超級管理員 Email
async function getSuperAdminEmails(): Promise<string[]> {
  const supabase = createServiceSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('is_super_admin', true)
    .eq('active', true)
  
  return data?.map(p => p.email) || []
}

// 更新 EmailService 配置
export class EmailService {
  private async getAdminEmails(): Promise<string[]> {
    // 優先使用環境變數（緊急聯絡）
    const envEmail = process.env.ADMIN_EMAIL
    if (envEmail) return [envEmail]
    
    // 從資料庫動態獲取
    return await getSuperAdminEmails()
  }
}
```

#### 1.2 實施登入通知系統

**檔案**: `src/lib/services/security-notification.ts`

```typescript
interface LoginInfo {
  ip: string
  userAgent: string
  location?: string
  device: string
  timestamp: Date
}

export class SecurityNotificationService {
  async notifyAdminLogin(user: User, loginInfo: LoginInfo) {
    // 1. 記錄審計日誌
    await auditLogService.log({
      user_id: user.id,
      action: 'admin_login',
      resource_type: 'security',
      resource_id: user.id,
      metadata: {
        ip: loginInfo.ip,
        userAgent: loginInfo.userAgent,
        location: loginInfo.location,
        device: loginInfo.device,
        loginTime: loginInfo.timestamp.toISOString()
      }
    })

    // 2. 檢查是否為異常登入
    const isUnusual = await this.detectUnusualLogin(user, loginInfo)
    
    // 3. 發送通知（如果異常或超級管理員）
    if (isUnusual || user.is_super_admin) {
      await this.sendLoginAlert(user, loginInfo, isUnusual)
    }
  }

  private async detectUnusualLogin(user: User, loginInfo: LoginInfo): Promise<boolean> {
    // 檢查：新 IP、新設備、異常時間、異常地點
    const recentLogins = await this.getRecentLogins(user.id, 30) // 30天內
    
    const checks = {
      newIP: !recentLogins.some(l => l.ip === loginInfo.ip),
      newDevice: !recentLogins.some(l => l.device === loginInfo.device),
      unusualTime: this.isUnusualTime(loginInfo.timestamp),
      unusualLocation: await this.isUnusualLocation(loginInfo.ip, recentLogins)
    }
    
    return Object.values(checks).some(Boolean)
  }
}
```

#### 1.3 環境變數安全化

**檔案**: `.env.local` 新增變數
```bash
# 安全設定
ADMIN_EMAIL=your-secure-email@company.com
SECURITY_NOTIFICATION_EMAIL=security@company.com
MAX_LOGIN_ATTEMPTS=3
SESSION_TIMEOUT=1800  # 30分鐘
LOGIN_NOTIFICATION_ENABLED=true

# 2FA 設定（第二階段使用）
ENABLE_MFA_FOR_ADMINS=true
MFA_ISSUER_NAME="Haude Admin"
```

### 第二階段：雙因素認證（4-6小時）

#### 2.1 啟用 Supabase MFA

**檔案**: `src/lib/services/mfa-service.ts`

```typescript
export class MFAService {
  private supabase = createServiceSupabaseClient()

  async setupTOTP(userId: string) {
    // 1. 為使用者啟用 MFA
    const { data: factor, error } = await this.supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: process.env.MFA_ISSUER_NAME || 'Haude'
    })

    if (error) throw new Error(`MFA 設定失敗: ${error.message}`)

    // 2. 生成 QR Code 供使用者掃描
    const qrCodeUrl = await this.generateQRCode(factor.totp.qr_code)
    
    // 3. 記錄審計日誌
    await auditLogService.log({
      user_id: userId,
      action: 'create',
      resource_type: 'security',
      resource_id: factor.id,
      metadata: { action_type: 'mfa_setup_initiated' }
    })

    return {
      factorId: factor.id,
      qrCode: qrCodeUrl,
      secret: factor.totp.secret
    }
  }

  async verifyTOTP(factorId: string, code: string) {
    const { data, error } = await this.supabase.auth.mfa.verify({
      factorId,
      challengeId: '', // 需要從 challenge 流程獲取
      code
    })

    if (error) throw new Error(`驗證失敗: ${error.message}`)
    
    return data
  }

  async requireMFAForSuperAdmin(userId: string) {
    // 檢查超級管理員是否已啟用 MFA
    const { data: factors } = await this.supabase.auth.mfa.listFactors()
    const verifiedFactors = factors?.filter(f => f.status === 'verified') || []

    if (verifiedFactors.length === 0) {
      throw new AuthorizationError('超級管理員必須啟用雙因素認證')
    }
  }
}
```

#### 2.2 MFA 設定頁面

**檔案**: `src/app/admin/security/mfa/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MFAService } from '@/lib/services/mfa-service'
import QRCode from 'qrcode.react'

export default function MFASetupPage() {
  const { user } = useAuth()
  const [setupData, setSetupData] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const mfaService = new MFAService()

  const handleSetupMFA = async () => {
    try {
      const data = await mfaService.setupTOTP(user.id)
      setSetupData(data)
    } catch (error) {
      toast.error('MFA 設定失敗')
    }
  }

  const handleVerifyMFA = async () => {
    try {
      await mfaService.verifyTOTP(setupData.factorId, verifyCode)
      toast.success('MFA 啟用成功！')
      router.push('/admin/dashboard')
    } catch (error) {
      toast.error('驗證碼錯誤')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">設定雙因素認證</h1>
      
      {!setupData ? (
        <div>
          <p className="mb-4">為了加強帳號安全，超級管理員必須啟用雙因素認證。</p>
          <button
            onClick={handleSetupMFA}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            開始設定 MFA
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">掃描 QR Code</h2>
          <div className="flex justify-center mb-4">
            <QRCode value={setupData.qrCode} size={200} />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              輸入驗證碼
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="6位數驗證碼"
              maxLength={6}
            />
          </div>
          
          <button
            onClick={handleVerifyMFA}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            驗證並啟用
          </button>
        </div>
      )}
    </div>
  )
}
```

#### 2.3 強制 MFA 政策

**資料庫遷移**:
```sql
-- 新增 MFA 狀態檢查函數
CREATE OR REPLACE FUNCTION check_super_admin_mfa()
RETURNS BOOLEAN AS $$
BEGIN
  -- 檢查當前使用者是否為超級管理員
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_super_admin = true
  ) THEN
    -- 檢查是否有已驗證的 MFA 因子
    IF NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors 
      WHERE user_id = auth.uid() AND status = 'verified'
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 套用到敏感操作的 RLS 政策
CREATE POLICY "Super admin operations require MFA" ON profiles
FOR UPDATE USING (
  -- 如果要更新權限相關欄位，必須通過 MFA 檢查
  (OLD.role = NEW.role AND OLD.is_super_admin = NEW.is_super_admin) 
  OR 
  check_super_admin_mfa()
);
```

### 第三階段：存取控制強化（5-7小時）

#### 3.1 IP 白名單機制

**資料庫結構**:
```sql
-- IP 白名單表
CREATE TABLE admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  ip_range CIDR, -- 支援 IP 範圍，如 192.168.1.0/24
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used TIMESTAMPTZ,
  
  CONSTRAINT unique_user_ip UNIQUE(user_id, ip_address)
);

-- 索引優化
CREATE INDEX idx_ip_whitelist_user_active ON admin_ip_whitelist(user_id, is_active);
CREATE INDEX idx_ip_whitelist_ip ON admin_ip_whitelist USING GIST (ip_address inet_ops);
```

**檔案**: `src/lib/middleware/ip-whitelist.ts`

```typescript
export class IPWhitelistService {
  private supabase = createServiceSupabaseClient()

  async verifyAdminIP(userId: string, clientIP: string): Promise<boolean> {
    // 1. 獲取使用者的 IP 白名單
    const { data: whitelist } = await this.supabase
      .from('admin_ip_whitelist')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`ip_address.eq.${clientIP},ip_range.cs.${clientIP}`)
      .gte('expires_at', new Date().toISOString())

    // 2. 更新最後使用時間
    if (whitelist && whitelist.length > 0) {
      await this.supabase
        .from('admin_ip_whitelist')
        .update({ last_used: new Date().toISOString() })
        .eq('id', whitelist[0].id)
      
      return true
    }

    // 3. 記錄未授權的 IP 存取嘗試
    await auditLogService.log({
      user_id: userId,
      action: 'unauthorized_access',
      resource_type: 'security',
      resource_id: userId,
      metadata: { 
        reason: 'ip_not_whitelisted',
        attempted_ip: clientIP,
        timestamp: new Date().toISOString()
      }
    })

    return false
  }

  async addIPToWhitelist(userId: string, ipAddress: string, description: string, expiresInDays = 90) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const { data, error } = await this.supabase
      .from('admin_ip_whitelist')
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        description,
        expires_at: expiresAt.toISOString(),
        created_by: userId
      })
      .select()

    if (error) throw new Error(`新增 IP 白名單失敗: ${error.message}`)

    // 記錄審計日誌
    await auditLogService.log({
      user_id: userId,
      action: 'create',
      resource_type: 'security',
      resource_id: data[0].id,
      metadata: {
        action_type: 'ip_whitelist_added',
        ip_address: ipAddress,
        description,
        expires_at: expiresAt.toISOString()
      }
    })

    return data[0]
  }
}

// 中間件整合
export function requireWhitelistedIP(handler: AdminHandler) {
  return requireAdmin(async (req, context) => {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    
    const ipService = new IPWhitelistService()
    const isAllowed = await ipService.verifyAdminIP(context.user.id, clientIP)
    
    if (!isAllowed) {
      // 發送安全警告
      await securityNotificationService.sendIPViolationAlert(
        context.user, 
        clientIP
      )
      
      throw new AuthorizationError(`此 IP (${clientIP}) 未授權存取管理功能`)
    }
    
    return handler(req, context)
  })
}
```

#### 3.2 設備追蹤與管理

**檔案**: `src/lib/services/device-management.ts`

```typescript
interface DeviceInfo {
  fingerprint: string
  name: string
  browser: string
  os: string
  userAgent: string
}

export class DeviceManagementService {
  private supabase = createServiceSupabaseClient()

  generateDeviceFingerprint(req: NextRequest): string {
    const userAgent = req.headers.get('user-agent') || ''
    const acceptLanguage = req.headers.get('accept-language') || ''
    const acceptEncoding = req.headers.get('accept-encoding') || ''
    
    // 使用多個標頭生成設備指紋
    const fingerprint = crypto
      .createHash('sha256')
      .update(userAgent + acceptLanguage + acceptEncoding)
      .digest('hex')
    
    return fingerprint
  }

  async registerDevice(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    const { error } = await this.supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        device_fingerprint: deviceInfo.fingerprint,
        device_name: deviceInfo.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        user_agent: deviceInfo.userAgent,
        last_used: new Date().toISOString()
      })

    if (error) throw new Error(`設備註冊失敗: ${error.message}`)

    // 記錄審計日誌
    await auditLogService.log({
      user_id: userId,
      action: 'create',
      resource_type: 'security',
      resource_id: deviceInfo.fingerprint,
      metadata: {
        action_type: 'device_registered',
        device_name: deviceInfo.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      }
    })
  }

  async verifyDevice(userId: string, fingerprint: string): Promise<boolean> {
    const { data: device } = await this.supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint)
      .single()

    if (!device) {
      // 新設備，需要驗證
      await this.sendDeviceVerificationEmail(userId, fingerprint)
      return false
    }

    // 更新最後使用時間
    await this.supabase
      .from('user_devices')
      .update({ last_used: new Date().toISOString() })
      .eq('id', device.id)

    return device.trusted || false
  }
}
```

### 第四階段：進階安全功能（6-8小時）

#### 4.1 時間基礎存取控制

**檔案**: `src/lib/middleware/time-based-access.ts`

```typescript
interface BusinessHours {
  start: number // 24小時制
  end: number
  timezone: string
  allowedDays: number[] // 0-6, 0=週日
}

export class TimeBasedAccessControl {
  private readonly businessHours: BusinessHours = {
    start: 8,  // 8:00 AM
    end: 20,   // 8:00 PM
    timezone: 'Asia/Taipei',
    allowedDays: [1, 2, 3, 4, 5] // 週一到週五
  }

  async checkBusinessHours(userId: string): Promise<{
    allowed: boolean
    reason?: string
    requiresApproval: boolean
  }> {
    const now = new Date()
    const localTime = new Intl.DateTimeFormat('zh-TW', {
      timeZone: this.businessHours.timezone,
      hour: 'numeric',
      weekday: 'numeric'
    })

    const currentHour = now.getHours()
    const currentDay = now.getDay()

    // 檢查工作日
    if (!this.businessHours.allowedDays.includes(currentDay)) {
      return {
        allowed: false,
        reason: 'weekend_access_denied',
        requiresApproval: true
      }
    }

    // 檢查工作時間
    if (currentHour < this.businessHours.start || currentHour > this.businessHours.end) {
      // 記錄非工作時間存取
      await auditLogService.log({
        user_id: userId,
        action: 'unauthorized_access',
        resource_type: 'security',
        resource_id: userId,
        metadata: {
          reason: 'after_hours_access',
          access_time: now.toISOString(),
          local_hour: currentHour
        }
      })

      return {
        allowed: true, // 允許但需要額外記錄
        reason: 'after_hours_access_logged',
        requiresApproval: false
      }
    }

    return { allowed: true, requiresApproval: false }
  }
}

// 中間件整合
export function requireBusinessHours(handler: AdminHandler) {
  return requireAdmin(async (req, context) => {
    const timeControl = new TimeBasedAccessControl()
    const { allowed, reason, requiresApproval } = await timeControl.checkBusinessHours(context.user.id)
    
    if (!allowed && !requiresApproval) {
      throw new AuthorizationError(`非工作時間禁止存取: ${reason}`)
    }
    
    if (requiresApproval) {
      // 發送緊急存取通知
      await securityNotificationService.sendEmergencyAccessAlert(
        context.user,
        reason || 'unknown'
      )
    }
    
    return handler(req, context)
  })
}
```

#### 4.2 風險評分系統

**檔案**: `src/lib/services/risk-assessment.ts`

```typescript
interface RiskFactors {
  newIP: boolean
  newDevice: boolean
  unusualTime: boolean
  suspiciousLocation: boolean
  rapidRequests: boolean
  sensitiveAction: boolean
}

export class RiskAssessmentService {
  async calculateRiskScore(userId: string, request: NextRequest, action: string): Promise<{
    score: number // 0-1, 1 = 最高風險
    factors: RiskFactors
    recommendation: 'allow' | 'challenge' | 'block'
  }> {
    const factors: RiskFactors = {
      newIP: await this.isNewIP(userId, this.getClientIP(request)),
      newDevice: await this.isNewDevice(userId, request),
      unusualTime: this.isUnusualTime(new Date()),
      suspiciousLocation: await this.isSuspiciousLocation(this.getClientIP(request)),
      rapidRequests: await this.hasRapidRequests(userId),
      sensitiveAction: this.isSensitiveAction(action)
    }

    // 風險權重
    const weights = {
      newIP: 0.3,
      newDevice: 0.25,
      unusualTime: 0.1,
      suspiciousLocation: 0.15,
      rapidRequests: 0.1,
      sensitiveAction: 0.1
    }

    // 計算加權風險分數
    const score = Object.entries(factors).reduce((total, [key, value]) => {
      return total + (value ? weights[key as keyof RiskFactors] : 0)
    }, 0)

    // 決定建議動作
    let recommendation: 'allow' | 'challenge' | 'block' = 'allow'
    if (score > 0.8) recommendation = 'block'
    else if (score > 0.4) recommendation = 'challenge'

    // 記錄風險評估
    await auditLogService.log({
      user_id: userId,
      action: 'view',
      resource_type: 'security',
      resource_id: `risk-assessment-${Date.now()}`,
      metadata: {
        risk_score: score,
        risk_factors: factors,
        recommendation,
        action_attempted: action
      }
    })

    return { score, factors, recommendation }
  }

  private isSensitiveAction(action: string): boolean {
    const sensitiveActions = [
      'update_user_permissions',
      'delete_user',
      'system_configuration',
      'export_data',
      'admin_login'
    ]
    return sensitiveActions.includes(action)
  }

  private async hasRapidRequests(userId: string): Promise<boolean> {
    // 檢查過去5分鐘內的請求數
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { data } = await this.supabase
      .from('audit_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', fiveMinutesAgo.toISOString())

    return (data?.length || 0) > 50 // 5分鐘內超過50個請求
  }
}
```

## 🔧 管理介面

### 安全設定頁面

**檔案**: `src/app/admin/security/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { IPWhitelistService } from '@/lib/services/ip-whitelist'
import { DeviceManagementService } from '@/lib/services/device-management'
import { SecurityNotificationService } from '@/lib/services/security-notification'

export default function SecuritySettingsPage() {
  const { user } = useAuth()
  const [ipWhitelist, setIPWhitelist] = useState([])
  const [devices, setDevices] = useState([])
  const [recentLogins, setRecentLogins] = useState([])

  // 載入安全資料
  useEffect(() => {
    if (user?.is_super_admin) {
      loadSecurityData()
    }
  }, [user])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">安全設定</h1>

      {/* MFA 狀態 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">雙因素認證</h2>
        <MFAStatus user={user} />
      </div>

      {/* IP 白名單管理 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">IP 白名單</h2>
        <IPWhitelistManager 
          whitelist={ipWhitelist}
          onUpdate={loadSecurityData}
        />
      </div>

      {/* 設備管理 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">授權設備</h2>
        <DeviceManager 
          devices={devices}
          onUpdate={loadSecurityData}
        />
      </div>

      {/* 最近登入記錄 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">登入記錄</h2>
        <LoginHistory logins={recentLogins} />
      </div>
    </div>
  )
}
```

## 📊 監控和告警

### 安全事件監控

**檔案**: `src/lib/services/security-monitoring.ts`

```typescript
export class SecurityMonitoringService {
  async detectAnomalies(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []

    // 1. 檢查異常登入模式
    const suspiciousLogins = await this.findSuspiciousLogins()
    alerts.push(...suspiciousLogins)

    // 2. 檢查權限濫用
    const permissionAbuse = await this.detectPermissionAbuse()
    alerts.push(...permissionAbuse)

    // 3. 檢查批量操作
    const bulkOperations = await this.detectBulkOperations()
    alerts.push(...bulkOperations)

    return alerts
  }

  private async findSuspiciousLogins(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = []
    
    // 查找過去24小時內的登入
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const { data: logins } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'admin_login')
      .gte('created_at', yesterday.toISOString())

    // 分析登入模式
    const loginsByUser = this.groupBy(logins || [], 'user_id')
    
    for (const [userId, userLogins] of Object.entries(loginsByUser)) {
      // 檢查多地點登入
      const locations = new Set(userLogins.map(l => l.metadata?.ip))
      if (locations.size > 3) {
        alerts.push({
          type: 'multiple_locations',
          severity: 'high',
          userId,
          message: `使用者從 ${locations.size} 個不同 IP 登入`,
          metadata: { locations: Array.from(locations) }
        })
      }

      // 檢查頻繁登入
      if (userLogins.length > 10) {
        alerts.push({
          type: 'frequent_logins',
          severity: 'medium',
          userId,
          message: `24小時內登入 ${userLogins.length} 次`,
          metadata: { loginCount: userLogins.length }
        })
      }
    }

    return alerts
  }

  async sendDailySecurityReport(): Promise<void> {
    const alerts = await this.detectAnomalies()
    const stats = await this.getSecurityStats()

    const report = {
      date: new Date().toISOString().split('T')[0],
      alerts,
      stats,
      summary: this.generateSummary(alerts, stats)
    }

    // 發送給所有超級管理員
    const admins = await getSuperAdminEmails()
    for (const email of admins) {
      await emailService.sendSecurityReport(email, report)
    }
  }
}
```

## 🚀 部署檢查清單

### 開發環境設定

```bash
# 1. 更新環境變數
cp .env.example .env.local

# 新增安全相關變數
ADMIN_EMAIL=your-secure-admin@company.com
SECURITY_NOTIFICATION_EMAIL=security@company.com
MAX_LOGIN_ATTEMPTS=3
SESSION_TIMEOUT=1800
ENABLE_MFA_FOR_ADMINS=true
MFA_ISSUER_NAME="Haude Admin"
```

### 資料庫遷移

```sql
-- 執行所有安全相關的資料庫更新
-- 1. IP 白名單表
-- 2. 設備管理表
-- 3. MFA 政策
-- 4. 審計日誌增強
```

### 驗證步驟

- [ ] 硬編碼 Email 已移除
- [ ] 登入通知正常運作
- [ ] 2FA 設定流程完整
- [ ] IP 白名單功能正確
- [ ] 設備追蹤正常
- [ ] 審計日誌完整記錄
- [ ] 安全報告自動發送

## ⚠️ 風險評估

| 風險 | 機率 | 影響 | 緩解措施 |
|------|------|------|----------|
| 2FA 設定失敗導致鎖定 | 中 | 高 | 保留緊急存取機制 + 備用驗證碼 |
| IP 白名單過於嚴格 | 中 | 中 | 提供緊急 IP 新增流程 |
| 使用者體驗影響 | 高 | 低 | 段階式實施 + 使用者培訓 |
| 設備識別不準確 | 中 | 低 | 多因子設備指紋 + 手動驗證 |

## 📈 成功指標

- ✅ 0 個硬編碼的敏感資訊
- ✅ 100% 超級管理員啟用 2FA
- ✅ 95% 以上的異常登入被檢測
- ✅ < 2秒 的安全檢查回應時間
- ✅ 24小時內安全事件通知覆蓋率

## 🔄 維護計劃

### 每日
- 檢查安全警告
- 審查異常登入
- 監控風險分數

### 每週
- 清理過期的 IP 白名單
- 審查未使用的設備
- 更新威脅情報

### 每月
- 全面安全審計
- 更新安全政策
- 進行滲透測試
- 備份恢復演練

---

**重要提醒**：
1. 實施前請先在開發環境完整測試
2. 建議分階段部署，避免影響現有使用者
3. 保留緊急存取機制以防配置錯誤
4. 定期檢查和更新安全設定

**聯絡資訊**：
- 技術負責人：系統架構師
- 安全審查：資安團隊
- 緊急聯絡：security@company.com