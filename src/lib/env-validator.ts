/**
 * 環境變數驗證器
 * 
 * 在應用啟動時驗證所有必要的環境變數是否正確設定
 * 確保安全相關的配置符合最低要求
 */

import { logger } from '@/lib/logger';

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
    required: false, // 可選，因為並非所有部署都需要
    minLength: 32,
    securityLevel: 'critical',
    validator: (value) => {
      if (!value) return true; // 允許為空
      if (value.length < 32) return false;
      
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
    required: false, // 可選，因為使用 Supabase Auth
    minLength: 32,
    securityLevel: 'critical',
    validator: (value) => {
      if (!value) return true; // 允許為空
      if (value.length < 32) return false;
      
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
  },
  
  // === 第三方服務配置 ===
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    pattern: /^sk_/,
    securityLevel: 'high',
    message: 'STRIPE_SECRET_KEY 必須以 sk_ 開頭'
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    pattern: /^re_/,
    securityLevel: 'high',
    message: 'RESEND_API_KEY 必須以 re_ 開頭'
  },
  {
    name: 'GOOGLE_MAPS_API_KEY',
    required: false,
    minLength: 20,
    securityLevel: 'medium',
    message: 'GOOGLE_MAPS_API_KEY 必須至少 20 字元'
  },
  {
    name: 'NEXT_PUBLIC_GA_ID',
    required: false,
    pattern: /^G-/,
    securityLevel: 'low',
    message: 'NEXT_PUBLIC_GA_ID 必須以 G- 開頭'
  },
  {
    name: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    required: false,
    pattern: /^G-/,
    securityLevel: 'low',
    message: 'NEXT_PUBLIC_GA_MEASUREMENT_ID 必須以 G- 開頭'
  },
  
  // === Vercel KV 快取配置 ===
  {
    name: 'KV_REST_API_URL',
    required: false,
    pattern: /^https?:\/\/.+$/,
    securityLevel: 'medium',
    message: 'KV_REST_API_URL 必須是有效的 URL'
  },
  {
    name: 'KV_REST_API_TOKEN',
    required: false,
    minLength: 20,
    securityLevel: 'medium',
    message: 'KV_REST_API_TOKEN 必須設定'
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    pattern: /^https?:\/\/.+$/,
    securityLevel: 'medium',
    message: 'UPSTASH_REDIS_REST_URL 必須是有效的 URL'
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    minLength: 20,
    securityLevel: 'medium',
    message: 'UPSTASH_REDIS_REST_TOKEN 必須設定'
  },
  
  // === 基礎配置 ===
  {
    name: 'NEXT_PUBLIC_BASE_URL',
    required: false,
    pattern: /^https?:\/\/.+$/,
    securityLevel: 'low',
    message: 'NEXT_PUBLIC_BASE_URL 必須是有效的 URL'
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
    logger.error('========================================');
    logger.error('環境變數驗證失敗');
    logger.error('========================================');
    
    result.errors.forEach(error => {
      logger.error(error, new Error(error), { metadata: { type: 'env_validation' } });
    });
    
    if (result.warnings.length > 0) {
      logger.warn('');
      logger.warn('警告');
      result.warnings.forEach(warning => {
        logger.warn(warning, { metadata: { type: 'env_validation' } });
      });
    }
    
    logger.error('========================================');
    logger.error('請檢查 .env.local 檔案並確保所有必要的環境變數都已正確設定');
    logger.error('參考 .env.local.example 檔案了解所需的環境變數');
    logger.error('========================================');
    
    // 在生產環境中，如果關鍵配置缺失，應該停止應用
    if (process.env.NODE_ENV === 'production') {
      const hasCriticalError = result.errors.some(e => e.includes('[CRITICAL]'));
      if (hasCriticalError) {
        logger.fatal('發現關鍵安全配置錯誤，停止應用啟動');
        process.exit(1);
      }
    }
  } else {
    logger.info('環境變數驗證通過');
    
    if (result.warnings.length > 0) {
      logger.warn('');
      logger.warn('環境變數警告');
      result.warnings.forEach(warning => {
        logger.warn(warning, { metadata: { type: 'env_validation' } });
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
  // 安全配置
  ADMIN_API_KEY: 'ADMIN_API_KEY',
  JWT_SECRET: 'JWT_SECRET',
  
  // Supabase 配置
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  
  // 基礎配置
  NODE_ENV: 'NODE_ENV',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  BASE_URL: 'NEXT_PUBLIC_BASE_URL',
  
  // 第三方服務
  STRIPE_SECRET_KEY: 'STRIPE_SECRET_KEY',
  RESEND_API_KEY: 'RESEND_API_KEY',
  GOOGLE_MAPS_API_KEY: 'GOOGLE_MAPS_API_KEY',
  GA_ID: 'NEXT_PUBLIC_GA_ID',
  GA_MEASUREMENT_ID: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  
  // Vercel KV 快取
  KV_REST_API_URL: 'KV_REST_API_URL',
  KV_REST_API_TOKEN: 'KV_REST_API_TOKEN',
  UPSTASH_REDIS_REST_URL: 'UPSTASH_REDIS_REST_URL',
  UPSTASH_REDIS_REST_TOKEN: 'UPSTASH_REDIS_REST_TOKEN'
} as const;