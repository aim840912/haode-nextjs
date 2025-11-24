import { clearAllClientCaches } from '../src/lib/database/supabase-auth'

console.log('🧹 清除所有 Supabase 客戶端快取...')
clearAllClientCaches()
console.log('✅ 快取已清除！')
