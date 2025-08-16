import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // 可選的第三方服務
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  
  // Vercel KV 快取配置 (可選)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
})

// 驗證環境變數
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(issue => issue.path.join('.')).join(', ')
      throw new Error(`Missing or invalid environment variables: ${missing}`)
    }
    throw error
  }
}

export const env = validateEnv()
export type Env = z.infer<typeof envSchema>