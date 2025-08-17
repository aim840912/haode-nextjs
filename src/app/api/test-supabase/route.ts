import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 測試用的 Supabase Admin 客戶端
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET() {
  const results = []
  
  try {
    // Test 1: 環境變數檢查
    const envTest = {
      name: '環境變數檢查',
      status: 'success' as const,
      details: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
    
    if (!envTest.details.NEXT_PUBLIC_SUPABASE_URL || 
        !envTest.details.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
        !envTest.details.SUPABASE_SERVICE_ROLE_KEY) {
      envTest.status = 'error'
    }
    
    results.push(envTest)

    // Test 2: Service Role 連線測試
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const start = Date.now()
      
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('count')
        .limit(1)
      
      const duration = Date.now() - start
      
      results.push({
        name: 'Service Role 連線',
        status: error ? 'error' : 'success',
        message: error ? error.message : `連線成功，響應時間: ${duration}ms`,
        duration
      })
    } catch (err) {
      results.push({
        name: 'Service Role 連線',
        status: 'error',
        message: err instanceof Error ? err.message : '連線失敗'
      })
    }

    // Test 3: 資料庫表格檢查
    try {
      const supabaseAdmin = getSupabaseAdmin()
      
      // 檢查常見表格是否存在
      const tables = ['products', 'users', 'orders', 'profiles']
      const tableResults = []
      
      for (const table of tables) {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .select('count')
            .limit(1)
          
          tableResults.push({
            table,
            exists: !error,
            error: error?.message
          })
        } catch (err) {
          tableResults.push({
            table,
            exists: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }
      
      results.push({
        name: '資料庫表格檢查',
        status: 'success',
        details: tableResults
      })
    } catch (err) {
      results.push({
        name: '資料庫表格檢查',
        status: 'error',
        message: err instanceof Error ? err.message : '檢查失敗'
      })
    }

    // Test 4: RLS 繞過測試（僅 service_role 可以）
    try {
      const supabaseAdmin = getSupabaseAdmin()
      
      // 嘗試存取可能有 RLS 保護的表格
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1)
      
      results.push({
        name: 'RLS 繞過測試',
        status: error ? 'error' : 'success',
        message: error 
          ? `無法繞過 RLS: ${error.message}` 
          : 'Service role 成功繞過 RLS 限制'
      })
    } catch (err) {
      results.push({
        name: 'RLS 繞過測試',
        status: 'error',
        message: err instanceof Error ? err.message : '測試失敗'
      })
    }

    // Test 5: 寫入權限測試
    try {
      const supabaseAdmin = getSupabaseAdmin()
      
      const testData = {
        name: `API_測試_${Date.now()}`,
        description: 'Server 端測試資料',
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabaseAdmin
        .from('test_data')
        .insert(testData)
        .select()
      
      if (error && error.code === '42P01') {
        results.push({
          name: '寫入權限測試',
          status: 'warning',
          message: 'test_data 表不存在，跳過寫入測試'
        })
      } else if (error) {
        results.push({
          name: '寫入權限測試',
          status: 'error',
          message: `寫入失敗: ${error.message}`
        })
      } else {
        results.push({
          name: '寫入權限測試',
          status: 'success',
          message: '成功建立測試資料',
          data: data?.[0]
        })
      }
    } catch (err) {
      results.push({
        name: '寫入權限測試',
        status: 'error',
        message: err instanceof Error ? err.message : '寫入測試失敗'
      })
    }

    // 計算整體狀態
    const hasErrors = results.some(r => r.status === 'error')
    const hasWarnings = results.some(r => r.status === 'warning')
    
    let overallStatus = 'success'
    if (hasErrors) overallStatus = 'error'
    else if (hasWarnings) overallStatus = 'warning'

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: overallStatus,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        warning: results.filter(r => r.status === 'warning').length,
        error: results.filter(r => r.status === 'error').length
      },
      tests: results,
      recommendations: hasErrors ? [
        '檢查 .env.local 檔案中的環境變數',
        '確認 Supabase 專案設定正確',
        '驗證 API Keys 是否為最新版本',
        '檢查資料庫表格和 RLS 政策'
      ] : [
        'Supabase 設定看起來正常！',
        '可以開始開發核心功能了'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: 'error',
      error: error instanceof Error ? error.message : 'Server test failed',
      message: '伺服器端測試失敗，請檢查環境變數設定'
    }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET method to run Supabase tests'
  }, { status: 405 })
}