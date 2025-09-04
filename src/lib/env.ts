/**
 * 環境變數驗證和類型定義
 *
 * 統一的環境變數驗證系統，分離客戶端和伺服器端變數
 * 使用 Zod 進行嚴格的類型檢查和驗證
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'

// ==========================================
// 客戶端環境變數 Schema（可暴露給瀏覽器）
// ==========================================
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine(url => url.includes('.supabase.co'), {
      message: '必須是有效的 Supabase URL',
    }),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, { message: 'Supabase Anon Key 必須至少 20 字元' }),

  NEXT_PUBLIC_BASE_URL: z.string().url().optional().default('http://localhost:3000'),

  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-/, { message: 'GA Measurement ID 必須以 G- 開頭' })
    .optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// ==========================================
// 伺服器端環境變數 Schema（敏感資料）
// ==========================================
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, { message: 'Service Role Key 必須至少 20 字元' })
    .refine(
      value => {
        // Service role key 不應該與 anon key 相同
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        return value !== anonKey
      },
      { message: 'Service Role Key 不能與 Anon Key 相同' }
    ),

  // 可選的安全配置
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT Secret 必須至少 32 字元' })
    .refine(
      value => {
        // 檢查是否包含不安全的預設值
        const unsafePatterns = [
          'fallback-secret',
          'change-in-production',
          'your-super-secret',
          'default',
          'example',
        ]
        const lowerValue = value.toLowerCase()
        return !unsafePatterns.some(pattern => lowerValue.includes(pattern))
      },
      { message: 'JWT Secret 不能包含預設值' }
    )
    .optional(),

  ADMIN_API_KEY: z
    .string()
    .min(32, { message: 'Admin API Key 必須至少 32 字元' })
    .refine(
      value => {
        const unsafePatterns = [
          'your-admin-api-key',
          'change-this',
          'default',
          'example',
          'test-key',
        ]
        const lowerValue = value.toLowerCase()
        return !unsafePatterns.some(pattern => lowerValue.includes(pattern))
      },
      { message: 'Admin API Key 不能包含預設值' }
    )
    .optional(),

  // 第三方服務配置
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^sk_/, { message: 'Stripe Secret Key 必須以 sk_ 開頭' })
    .optional(),

  RESEND_API_KEY: z
    .string()
    .regex(/^re_/, { message: 'Resend API Key 必須以 re_ 開頭' })
    .optional(),

  GOOGLE_MAPS_API_KEY: z
    .string()
    .min(20, { message: 'Google Maps API Key 必須至少 20 字元' })
    .optional(),

  // Vercel KV 快取配置
  KV_REST_API_URL: z.string().url({ message: 'KV REST API URL 必須是有效的 URL' }).optional(),

  KV_REST_API_TOKEN: z
    .string()
    .min(20, { message: 'KV REST API Token 必須至少 20 字元' })
    .optional(),

  UPSTASH_REDIS_REST_URL: z
    .string()
    .url({ message: 'Upstash Redis REST URL 必須是有效的 URL' })
    .optional(),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(20, { message: 'Upstash Redis REST Token 必須至少 20 字元' })
    .optional(),

  // NextAuth 配置
  NEXTAUTH_URL: z.string().url({ message: 'NextAuth URL 必須是有效的 URL' }).optional(),
})

// ==========================================
// 類型定義
// ==========================================
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

// ==========================================
// 驗證函數
// ==========================================

/**
 * 驗證客戶端環境變數
 */
function validateClientEnv(): ClientEnv {
  try {
    return clientEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map(issue => {
          const path = issue.path.join('.')
          return `${path}: ${issue.message}`
        })
        .join('\n')

      logger.error('客戶端環境變數驗證失敗', error, {
        module: 'EnvValidation',
        action: 'validateClientEnv',
        metadata: { issues },
      })

      throw new Error(`客戶端環境變數驗證失敗:\n${issues}`)
    }
    throw error
  }
}

/**
 * 驗證伺服器端環境變數
 */
function validateServerEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const criticalIssues: string[] = []
      const warningIssues: string[] = []

      error.issues.forEach(issue => {
        const path = issue.path.join('.')
        const message = `${path}: ${issue.message}`

        // 判斷是否為關鍵錯誤
        const criticalVars = ['SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET', 'ADMIN_API_KEY']

        if (criticalVars.some(v => path.includes(v))) {
          criticalIssues.push(`[CRITICAL] ${message}`)
        } else {
          warningIssues.push(`[WARNING] ${message}`)
        }
      })

      if (criticalIssues.length > 0) {
        logger.error('伺服器端環境變數驗證失敗（關鍵錯誤）', error, {
          module: 'EnvValidation',
          action: 'validateServerEnv',
          metadata: { criticalIssues, warningIssues },
        })

        const allIssues = [...criticalIssues, ...warningIssues].join('\n')
        throw new Error(`伺服器端環境變數驗證失敗:\n${allIssues}`)
      } else if (warningIssues.length > 0) {
        // 只有警告，記錄但不停止
        logger.warn('伺服器端環境變數警告', {
          module: 'EnvValidation',
          action: 'validateServerEnv',
          metadata: { warningIssues },
        })
      }
    }
    throw error
  }
}

// ==========================================
// 導出驗證後的環境變數
// ==========================================

// 客戶端環境變數（安全暴露）
export const clientEnv = validateClientEnv()

// 伺服器端環境變數（僅在伺服器端使用）
let _serverEnv: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('伺服器端環境變數不能在客戶端使用！')
  }

  if (_serverEnv === null) {
    _serverEnv = validateServerEnv()
  }

  return _serverEnv
}

// ==========================================
// 工具函數
// ==========================================

/**
 * 檢查環境變數配置狀態
 */
export function getEnvStatus() {
  const status = {
    client: {} as Record<string, string>,
    server: {} as Record<string, string>,
    isValid: true,
    warnings: [] as string[],
  }

  // 檢查客戶端變數
  try {
    const client = validateClientEnv()
    Object.keys(client).forEach(key => {
      const value = client[key as keyof ClientEnv]
      status.client[key] = value ? '✅ 已設定' : '❌ 未設定'
    })
  } catch (error) {
    status.isValid = false
    status.client.error = '❌ 驗證失敗'
  }

  // 檢查伺服器端變數（僅在伺服器端）
  if (typeof window === 'undefined') {
    try {
      const server = getServerEnv()
      Object.keys(serverEnvSchema.shape).forEach(key => {
        const value = process.env[key]
        if (value) {
          // 敏感資料只顯示前幾個字元
          if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
            status.server[key] = `✅ 已設定 (${value.substring(0, 4)}...)`
          } else {
            status.server[key] = `✅ 已設定`
          }
        } else {
          status.server[key] = '❌ 未設定'
          if (serverEnvSchema.shape[key as keyof ServerEnv]?.isOptional?.()) {
            status.warnings.push(`${key} 未設定（可選）`)
          }
        }
      })
    } catch (error) {
      status.server.error = '❌ 驗證失敗'
      if (process.env.NODE_ENV === 'production') {
        status.isValid = false
      }
    }
  }

  return status
}

/**
 * 在應用啟動時執行完整驗證
 */
export function validateOnStartup(): void {
  logger.info('開始環境變數驗證', {
    module: 'EnvValidation',
    action: 'validateOnStartup',
  })

  const status = getEnvStatus()

  if (!status.isValid) {
    logger.error('環境變數驗證失敗', new Error('Environment validation failed'), {
      module: 'EnvValidation',
      action: 'validateOnStartup',
      metadata: { status },
    })

    if (process.env.NODE_ENV === 'production') {
      logger.fatal('生產環境環境變數配置錯誤，停止應用')
      process.exit(1)
    }
  } else {
    logger.info('環境變數驗證通過', {
      module: 'EnvValidation',
      action: 'validateOnStartup',
      metadata: {
        warningsCount: status.warnings.length,
        clientVarsCount: Object.keys(status.client).length,
        serverVarsCount: Object.keys(status.server).length,
      },
    })

    if (status.warnings.length > 0) {
      status.warnings.forEach(warning => {
        logger.warn(warning, {
          module: 'EnvValidation',
          action: 'validateOnStartup',
        })
      })
    }
  }
}

// ==========================================
// 常數定義（避免硬編碼）
// ==========================================
export const ENV_KEYS = {
  // 客戶端變數
  CLIENT: {
    SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    BASE_URL: 'NEXT_PUBLIC_BASE_URL',
    GA_MEASUREMENT_ID: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    NODE_ENV: 'NODE_ENV',
  },

  // 伺服器端變數
  SERVER: {
    SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
    JWT_SECRET: 'JWT_SECRET',
    ADMIN_API_KEY: 'ADMIN_API_KEY',
    STRIPE_SECRET_KEY: 'STRIPE_SECRET_KEY',
    RESEND_API_KEY: 'RESEND_API_KEY',
    GOOGLE_MAPS_API_KEY: 'GOOGLE_MAPS_API_KEY',
    KV_REST_API_URL: 'KV_REST_API_URL',
    KV_REST_API_TOKEN: 'KV_REST_API_TOKEN',
    UPSTASH_REDIS_REST_URL: 'UPSTASH_REDIS_REST_URL',
    UPSTASH_REDIS_REST_TOKEN: 'UPSTASH_REDIS_REST_TOKEN',
    NEXTAUTH_URL: 'NEXTAUTH_URL',
  },
} as const
