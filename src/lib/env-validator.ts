/**
 * 環境變數驗證器
 * 
 * 在應用啟動時驗證所有必要的環境變數是否正確設定
 * 確保安全相關的配置符合最低要求
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVariable {
  name: string;
  required: boolean;
  validator?: (value: string | undefined) => boolean;
  message?: string;
  minLength?: number;
  pattern?: RegExp;
  securityLevel?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * 環境變數定義和驗證規則
 */
const ENV_VARIABLES: EnvVariable[] = [
  // === 關鍵安全配置 ===
  {
    name: 'ADMIN_API_KEY',
    required: true,
    minLength: 32,
    securityLevel: 'critical',
    validator: (value) => {
      if (!value || value.length < 32) return false;
      
      // 檢查是否包含不安全的預設值
      const unsafePatterns = [
        'your-admin-api-key',
        'change-this',
        'default',
        'example',
        'test-key'
      ];
      
      const lowerValue = value.toLowerCase();
      return !unsafePatterns.some(pattern => lowerValue.includes(pattern));
    },
    message: 'ADMIN_API_KEY 必須至少 32 字元且不能包含預設值'
  },
  {
    name: 'JWT_SECRET',
    required: true,
    minLength: 32,
    securityLevel: 'critical',
    validator: (value) => {
      if (!value || value.length < 32) return false;
      
      const unsafePatterns = [
        'fallback-secret',
        'change-in-production',
        'your-super-secret',
        'default',
        'example'
      ];
      
      const lowerValue = value.toLowerCase();
      return !unsafePatterns.some(pattern => lowerValue.includes(pattern));
    },
    message: 'JWT_SECRET 必須至少 32 字元且不能包含預設值'
  },
  
  // === Supabase 配置 ===
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    pattern: /^https:\/\/.+\.supabase\.co$/,
    securityLevel: 'high',
    message: 'NEXT_PUBLIC_SUPABASE_URL 必須是有效的 Supabase URL'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    minLength: 20,
    securityLevel: 'high',
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY 必須設定'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    minLength: 20,
    securityLevel: 'critical',
    validator: (value) => {
      if (!value || value.length < 20) return false;
      
      // Service role key 不應該與 anon key 相同
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return value !== anonKey;
    },
    message: 'SUPABASE_SERVICE_ROLE_KEY 必須設定且不能與 ANON_KEY 相同'
  },
  
  // === 可選配置 ===
  {
    name: 'NODE_ENV',
    required: false,
    pattern: /^(development|production|test)$/,
    securityLevel: 'medium',
    message: 'NODE_ENV 必須是 development、production 或 test'
  },
  {
    name: 'NEXTAUTH_URL',
    required: false,
    pattern: /^https?:\/\/.+$/,
    securityLevel: 'medium',
    message: 'NEXTAUTH_URL 必須是有效的 URL'
  }
];

/**
 * 驗證單個環境變數
 */
function validateEnvVariable(envVar: EnvVariable): string | null {
  const value = process.env[envVar.name];
  
  // 檢查必填
  if (envVar.required && !value) {
    return `${envVar.name} 是必填的環境變數`;
  }
  
  // 如果不是必填且沒有值，跳過其他驗證
  if (!value) {
    return null;
  }
  
  // 檢查最小長度
  if (envVar.minLength && value.length < envVar.minLength) {
    return `${envVar.name} 長度必須至少 ${envVar.minLength} 字元`;
  }
  
  // 檢查正則表達式
  if (envVar.pattern && !envVar.pattern.test(value)) {
    return envVar.message || `${envVar.name} 格式不正確`;
  }
  
  // 自定義驗證器
  if (envVar.validator && !envVar.validator(value)) {
    return envVar.message || `${envVar.name} 驗證失敗`;
  }
  
  return null;
}

/**
 * 驗證所有環境變數
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 按安全等級分組
  const criticalVars = ENV_VARIABLES.filter(v => v.securityLevel === 'critical');
  const highVars = ENV_VARIABLES.filter(v => v.securityLevel === 'high');
  const otherVars = ENV_VARIABLES.filter(v => !['critical', 'high'].includes(v.securityLevel || ''));
  
  // 驗證關鍵變數
  for (const envVar of criticalVars) {
    const error = validateEnvVariable(envVar);
    if (error) {
      errors.push(`[CRITICAL] ${error}`);
    }
  }
  
  // 驗證高優先級變數
  for (const envVar of highVars) {
    const error = validateEnvVariable(envVar);
    if (error) {
      errors.push(`[HIGH] ${error}`);
    }
  }
  
  // 驗證其他變數
  for (const envVar of otherVars) {
    const error = validateEnvVariable(envVar);
    if (error) {
      if (envVar.required) {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }
  }
  
  // 額外的安全檢查
  if (process.env.NODE_ENV === 'production') {
    // 生產環境的額外檢查
    if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes('localhost')) {
      warnings.push('生產環境應該設定正確的 NEXTAUTH_URL');
    }
    
    // 檢查是否使用 HTTPS
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      warnings.push('生產環境應該使用 HTTPS');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 在應用啟動時執行驗證
 * 可以在 app.ts 或 server.ts 中調用
 */
export function validateOnStartup(): void {
  const result = validateEnvironment();
  
  if (!result.isValid) {
    console.error('========================================');
    console.error('環境變數驗證失敗！');
    console.error('========================================');
    
    result.errors.forEach(error => {
      console.error(`❌ ${error}`);
    });
    
    if (result.warnings.length > 0) {
      console.warn('');
      console.warn('警告：');
      result.warnings.forEach(warning => {
        console.warn(`⚠️  ${warning}`);
      });
    }
    
    console.error('========================================');
    console.error('請檢查 .env.local 檔案並確保所有必要的環境變數都已正確設定');
    console.error('參考 .env.local.example 檔案了解所需的環境變數');
    console.error('========================================');
    
    // 在生產環境中，如果關鍵配置缺失，應該停止應用
    if (process.env.NODE_ENV === 'production') {
      const hasCriticalError = result.errors.some(e => e.includes('[CRITICAL]'));
      if (hasCriticalError) {
        console.error('發現關鍵安全配置錯誤，停止應用啟動');
        process.exit(1);
      }
    }
  } else {
    console.log('✅ 環境變數驗證通過');
    
    if (result.warnings.length > 0) {
      console.warn('');
      console.warn('環境變數警告：');
      result.warnings.forEach(warning => {
        console.warn(`⚠️  ${warning}`);
      });
    }
  }
}

/**
 * 獲取環境變數的安全摘要（用於調試）
 * 不會暴露實際的值
 */
export function getEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};
  
  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];
    
    if (!value) {
      summary[envVar.name] = '❌ Not set';
    } else if (envVar.securityLevel === 'critical') {
      // 關鍵變數只顯示是否設定和長度
      summary[envVar.name] = `✅ Set (${value.length} chars)`;
    } else if (envVar.name.includes('KEY') || envVar.name.includes('SECRET')) {
      // 包含敏感關鍵字的變數
      summary[envVar.name] = `✅ Set (${value.substring(0, 4)}...)`;
    } else {
      // 非敏感變數可以顯示部分值
      summary[envVar.name] = value.length > 20 
        ? `✅ ${value.substring(0, 20)}...`
        : `✅ ${value}`;
    }
  }
  
  return summary;
}

/**
 * 檢查特定環境變數是否安全設定
 */
export function isEnvSecure(name: string): boolean {
  const envVar = ENV_VARIABLES.find(v => v.name === name);
  if (!envVar) return true; // 未定義的變數不做檢查
  
  const error = validateEnvVariable(envVar);
  return error === null;
}

// 導出環境變數名稱常數，避免硬編碼
export const ENV_KEYS = {
  ADMIN_API_KEY: 'ADMIN_API_KEY',
  JWT_SECRET: 'JWT_SECRET',
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  NODE_ENV: 'NODE_ENV',
  NEXTAUTH_URL: 'NEXTAUTH_URL'
} as const;