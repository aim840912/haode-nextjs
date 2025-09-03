/**
 * Rate Limiting 配置中心
 * 
 * 定義不同 API 端點和情境的 rate limiting 策略
 * 根據業務需求和安全等級進行分級保護
 */

import { RateLimitConfig, IdentifierStrategy } from '@/lib/rate-limiter';

/**
 * 安全等級定義
 */
export enum SecurityLevel {
  /** 最高安全等級 - 登入、支付等 */
  CRITICAL = 'critical',
  /** 高安全等級 - 寫入操作 */
  HIGH = 'high',
  /** 中等安全等級 - 一般 API 操作 */
  MEDIUM = 'medium',
  /** 低安全等級 - 公開查詢 */
  LOW = 'low',
  /** 公開級別 - 靜態資源等 */
  PUBLIC = 'public'
}

/**
 * API 端點分類
 */
export enum APICategory {
  AUTHENTICATION = 'auth',
  PAYMENT = 'payment',
  ADMIN = 'admin',
  USER_DATA = 'user_data',
  PUBLIC_DATA = 'public_data',
  UPLOAD = 'upload',
  INQUIRY = 'inquiry',
  ORDER = 'order'
}

/**
 * 環境相關配置
 */
interface EnvironmentConfig {
  /** 開發環境是否啟用 rate limiting */
  enableInDevelopment: boolean;
  /** 生產環境白名單 IP */
  productionWhitelist: string[];
  /** 開發環境白名單 IP */
  developmentWhitelist: string[];
}

const ENVIRONMENT_CONFIG: EnvironmentConfig = {
  enableInDevelopment: process.env.NODE_ENV !== 'development' || 
                       process.env.ENABLE_DEV_RATE_LIMITING === 'true',
  productionWhitelist: [
    // 內部服務 IP
    '127.0.0.1',
    '::1',
    // Vercel 內部 IP（如果有的話）
    ...(process.env.VERCEL_INTERNAL_IPS?.split(',') || [])
  ],
  developmentWhitelist: [
    '127.0.0.1',
    '::1',
    'localhost'
  ]
};

/**
 * 基礎 Rate Limiting 配置模板
 */
const BASE_CONFIGS: Record<SecurityLevel, Partial<RateLimitConfig>> = {
  [SecurityLevel.CRITICAL]: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.COMBINED,
    enableAuditLog: true,
    includeHeaders: true,
    message: '安全限制：請求過於頻繁，請等待一分鐘後重試'
  },
  
  [SecurityLevel.HIGH]: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
    message: '請求過於頻繁，請稍後重試'
  },
  
  [SecurityLevel.MEDIUM]: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: true,
    includeHeaders: true,
    message: '請求頻率超出限制，請稍後重試'
  },
  
  [SecurityLevel.LOW]: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: false,
    includeHeaders: true
  },
  
  [SecurityLevel.PUBLIC]: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.IP,
    enableAuditLog: false,
    includeHeaders: false
  }
};

/**
 * 建立配置的輔助函數
 */
function createConfig(
  securityLevel: SecurityLevel, 
  overrides: Partial<RateLimitConfig> = {}
): RateLimitConfig {
  const baseConfig = BASE_CONFIGS[securityLevel];
  const whitelist = process.env.NODE_ENV === 'production' 
    ? ENVIRONMENT_CONFIG.productionWhitelist
    : ENVIRONMENT_CONFIG.developmentWhitelist;

  return {
    maxRequests: 100,
    windowMs: 60000,
    strategy: IdentifierStrategy.IP,
    enableAuditLog: false,
    includeHeaders: true,
    ...baseConfig,
    ...overrides,
    whitelist: [...whitelist, ...(overrides.whitelist || [])]
  };
}

/**
 * API 端點 Rate Limiting 配置
 */
export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // 認證相關 API - 最高安全等級
  '/api/auth/login': createConfig(SecurityLevel.CRITICAL, {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 分鐘
    message: '登入嘗試過於頻繁，請等待 5 分鐘後重試'
  }),

  '/api/auth/signup': createConfig(SecurityLevel.CRITICAL, {
    maxRequests: 2,
    windowMs: 10 * 60 * 1000, // 10 分鐘
    message: '註冊請求過於頻繁，請等待 10 分鐘後重試'
  }),

  '/api/auth/forgot-password': createConfig(SecurityLevel.CRITICAL, {
    maxRequests: 2,
    windowMs: 10 * 60 * 1000, // 10 分鐘
    message: '密碼重設請求過於頻繁，請等待 10 分鐘後重試'
  }),

  // 支付相關 API - 最高安全等級
  '/api/payment/**': createConfig(SecurityLevel.CRITICAL, {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 分鐘
    message: '支付請求過於頻繁，請聯絡客服協助'
  }),

  // 管理員 API - 高安全等級
  '/api/admin/**': createConfig(SecurityLevel.HIGH, {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.API_KEY,
    message: '管理員 API 使用頻率超出限制'
  }),

  // 庫存查詢相關 - 高安全等級（防止濫用）
  '/api/inquiries': createConfig(SecurityLevel.HIGH, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 10 分鐘
    message: '庫存查詢提交過於頻繁，請等待 10 分鐘後重試'
  }),

  // 庫存查詢統計 - 中等安全等級（允許頻繁查詢但有限制）
  '/api/inquiries/stats': createConfig(SecurityLevel.MEDIUM, {
    maxRequests: 120, // 每分鐘 120 次請求（適合 30 秒輪詢）
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.USER_ID,
    message: '統計資料請求過於頻繁，請稍後重試'
  }),

  // 訂單相關 - 高安全等級
  '/api/orders': createConfig(SecurityLevel.HIGH, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.USER_ID,
    message: '訂單操作頻率超出限制'
  }),

  // 購物車操作 - 中等安全等級
  '/api/cart/**': createConfig(SecurityLevel.MEDIUM, {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 分鐘
  }),


  // 檔案上傳 - 中等安全等級（但更嚴格）
  '/api/upload/**': createConfig(SecurityLevel.MEDIUM, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 分鐘
    message: '檔案上傳頻率超出限制，請稍後重試'
  }),

  // 審計日誌 - 高安全等級
  '/api/audit-logs/**': createConfig(SecurityLevel.HIGH, {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 分鐘
    strategy: IdentifierStrategy.USER_ID,
    message: '審計日誌查詢頻率超出限制'
  }),

  // 重置服務 - 關鍵安全等級
  '/api/reset-service': createConfig(SecurityLevel.CRITICAL, {
    maxRequests: 2,
    windowMs: 5 * 60 * 1000, // 5 分鐘
    message: '系統重置請求過於頻繁，請等待 5 分鐘後重試'
  }),

  // 資料策略 - 高安全等級
  '/api/data-strategy': createConfig(SecurityLevel.HIGH, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 分鐘
    message: '資料策略請求頻率超出限制'
  }),

  // 搜尋功能 - 低安全等級
  '/api/search': createConfig(SecurityLevel.LOW, {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 分鐘
  }),


  // 公開資料 API - 公開等級
  '/api/products': createConfig(SecurityLevel.PUBLIC, {
    maxRequests: 500,
    windowMs: 60 * 1000 // 1 分鐘
  }),

  '/api/locations': createConfig(SecurityLevel.PUBLIC),
  '/api/news': createConfig(SecurityLevel.PUBLIC),
  '/api/culture': createConfig(SecurityLevel.PUBLIC),
  '/api/farm-tour': createConfig(SecurityLevel.PUBLIC),
  '/api/schedule': createConfig(SecurityLevel.PUBLIC)
};

/**
 * 全域 Rate Limiting 配置
 */
export const GLOBAL_RATE_LIMIT: RateLimitConfig = createConfig(SecurityLevel.LOW, {
  maxRequests: 2000,
  windowMs: 15 * 60 * 1000, // 15 分鐘
  enableAuditLog: true,
  message: '請求頻率超出全域限制，請稍後重試'
});

/**
 * IP 級別嚴格限制（防止 DDoS）
 */
export const ANTI_DDOS_LIMIT: RateLimitConfig = createConfig(SecurityLevel.CRITICAL, {
  maxRequests: 5000,
  windowMs: 60 * 1000, // 1 分鐘
  strategy: IdentifierStrategy.IP,
  enableAuditLog: true,
  message: 'IP 級別限制觸發，請聯絡技術支援'
});

/**
 * 特殊路徑配置
 */
export const SPECIAL_PATHS = {
  /** 需要特殊處理的路徑 */
  WEBHOOK_PATHS: [
    '/api/payment/callback/**',
    '/api/webhooks/**'
  ],
  
  /** 完全排除 rate limiting 的路徑 */
  EXCLUDED_PATHS: [
    '/api/health',
    '/api/status',
    '/api/csrf-token',
    '/_next/**',
    '/favicon.ico',
    '/robots.txt'
  ],

  /** 只在生產環境啟用限制的路徑 */
  PRODUCTION_ONLY: [
    '/api/debug/**',
    '/api/test/**'
  ]
};

/**
 * 根據路徑獲取 rate limiting 配置
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  // 檢查是否為排除路徑
  if (SPECIAL_PATHS.EXCLUDED_PATHS.some(path => 
    pathname.startsWith(path.replace('/**', '')) || 
    pathname.match(path.replace('/**', '.*'))
  )) {
    return null;
  }

  // 檢查生產環境專用路徑
  if (process.env.NODE_ENV !== 'production' && 
      SPECIAL_PATHS.PRODUCTION_ONLY.some(path => 
        pathname.startsWith(path.replace('/**', ''))
      )) {
    return null;
  }

  // 開發環境檢查
  if (!ENVIRONMENT_CONFIG.enableInDevelopment) {
    return null;
  }

  // 匹配具體的 API 路徑配置
  for (const [pattern, config] of Object.entries(API_RATE_LIMITS)) {
    if (pattern.includes('**')) {
      // 萬用字元匹配
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*'));
      if (regex.test(pathname)) {
        return config;
      }
    } else if (pathname.startsWith(pattern)) {
      // 精確前綴匹配
      return config;
    }
  }

  // 預設返回全域限制
  return GLOBAL_RATE_LIMIT;
}

/**
 * 速率限制配置集合介面
 */
export interface RateLimitConfigCollection {
  securityLevels: typeof SecurityLevel;
  apiCategories: typeof APICategory;
  environmentConfig: typeof ENVIRONMENT_CONFIG;
  baseConfigs: typeof BASE_CONFIGS;
  apiRateLimits: typeof API_RATE_LIMITS;
  globalRateLimit: typeof GLOBAL_RATE_LIMIT;
  antiDdosLimit: typeof ANTI_DDOS_LIMIT;
  specialPaths: typeof SPECIAL_PATHS;
}

/**
 * 開發工具：列出所有配置
 */
export function listAllConfigs(): RateLimitConfigCollection {
  return {
    securityLevels: SecurityLevel,
    apiCategories: APICategory,
    environmentConfig: ENVIRONMENT_CONFIG,
    baseConfigs: BASE_CONFIGS,
    apiRateLimits: API_RATE_LIMITS,
    globalRateLimit: GLOBAL_RATE_LIMIT,
    antiDdosLimit: ANTI_DDOS_LIMIT,
    specialPaths: SPECIAL_PATHS
  };
}

/**
 * 配置驗證函數
 */
export function validateConfig(config: RateLimitConfig): boolean {
  if (!config.maxRequests || config.maxRequests <= 0) {
    console.error('[Rate Limit Config] Invalid maxRequests:', config.maxRequests);
    return false;
  }

  if (!config.windowMs || config.windowMs <= 0) {
    console.error('[Rate Limit Config] Invalid windowMs:', config.windowMs);
    return false;
  }

  if (!Object.values(IdentifierStrategy).includes(config.strategy)) {
    console.error('[Rate Limit Config] Invalid strategy:', config.strategy);
    return false;
  }

  return true;
}

// 開發環境下輸出配置資訊
if (process.env.NODE_ENV === 'development' && 
    process.env.DEBUG_RATE_LIMITING === 'true') {
  console.log('[Rate Limiting] Configuration loaded:');
  console.log(`- Environment: ${process.env.NODE_ENV}`);
  console.log(`- Rate limiting enabled: ${ENVIRONMENT_CONFIG.enableInDevelopment}`);
  console.log(`- Total API configs: ${Object.keys(API_RATE_LIMITS).length}`);
  console.log(`- Whitelist IPs: ${ENVIRONMENT_CONFIG.developmentWhitelist.length}`);
}