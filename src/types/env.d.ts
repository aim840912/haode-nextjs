/**
 * 環境變數全域類型宣告
 *
 * 為 process.env 和 NodeJS.ProcessEnv 提供完整的 TypeScript 類型支援
 * 確保在使用環境變數時有完整的智能提示和類型檢查
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // ==========================================
      // 客戶端環境變數（可暴露給瀏覽器）
      // ==========================================
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      NEXT_PUBLIC_BASE_URL?: string
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string
      NODE_ENV: 'development' | 'production' | 'test'

      // ==========================================
      // 伺服器端環境變數（敏感資料）
      // ==========================================
      SUPABASE_SERVICE_ROLE_KEY: string

      // 可選的安全配置
      JWT_SECRET?: string
      ADMIN_API_KEY?: string

      // 第三方服務配置
      STRIPE_SECRET_KEY?: string
      RESEND_API_KEY?: string
      GOOGLE_MAPS_API_KEY?: string

      // Vercel KV 快取配置
      KV_REST_API_URL?: string
      KV_REST_API_TOKEN?: string
      UPSTASH_REDIS_REST_URL?: string
      UPSTASH_REDIS_REST_TOKEN?: string

      // NextAuth 配置
      NEXTAUTH_URL?: string

      // ==========================================
      // 其他 Vercel/Next.js 系統變數
      // ==========================================
      VERCEL?: string
      VERCEL_ENV?: 'development' | 'preview' | 'production'
      VERCEL_URL?: string
      VERCEL_REGION?: string

      // 開發工具配置
      ANALYZE?: string
    }
  }
}

// 這個檔案必須是模組，否則 declare global 不會生效
export {}
