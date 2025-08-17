import { NextResponse } from 'next/server'
import { CacheManager } from '@/lib/cache-server'
import { getProductService } from '@/services/serviceFactory'

export async function GET() {
  try {
    // 檢查快取配置
    const hasKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
    
    // 獲取服務實例並檢查快取統計
    const productService = await getProductService()
    let cacheStats = null
    
    // 檢查是否是快取服務
    if ('getCacheStats' in productService && typeof productService.getCacheStats === 'function') {
      cacheStats = (productService as any).getCacheStats()
    }

    // 快取配置檢查
    const cacheConfig = {
      kvAvailable: hasKV,
      kvUrl: hasKV ? (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) : null,
      memoryFallback: true
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cacheEnabled: !!cacheStats,
      config: cacheConfig,
      stats: cacheStats || {
        message: '快取服務未啟用或不支援統計'
      },
      recommendations: generateCacheRecommendations(hasKV, cacheStats)
    })
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '快取狀態檢查失敗'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    
    if (action === 'clear') {
      // 清除快取
      const productService = await getProductService()
      
      if ('clearCache' in productService && typeof productService.clearCache === 'function') {
        await (productService as any).clearCache()
        
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          message: '快取已清除',
          action: 'clear'
        })
      } else {
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          message: '快取服務不支援清除功能',
          action: 'clear'
        }, { status: 400 })
      }
    }
    
    if (action === 'warmup') {
      // 快取預熱
      const productService = await getProductService()
      
      console.log('🔥 開始快取預熱...')
      const start = Date.now()
      
      // 預熱產品列表
      await productService.getProducts()
      
      const duration = Date.now() - start
      console.log(`🔥 快取預熱完成 (${duration}ms)`)
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        message: '快取預熱完成',
        action: 'warmup',
        duration
      })
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Invalid action',
      availableActions: ['clear', 'warmup']
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '快取操作失敗'
    }, { status: 500 })
  }
}

function generateCacheRecommendations(hasKV: boolean, cacheStats: any): string[] {
  const recommendations: string[] = []
  
  if (!hasKV) {
    recommendations.push('建議在 Vercel Dashboard 設定 KV Storage 以獲得更好的快取效能')
    recommendations.push('目前使用內存快取，重新部署時快取會清空')
  }
  
  if (cacheStats) {
    const hitRate = parseFloat(cacheStats.hitRate)
    
    if (hitRate < 50) {
      recommendations.push('快取命中率較低，考慮增加 TTL 時間或預熱熱門資料')
    } else if (hitRate > 90) {
      recommendations.push('快取命中率優秀！系統效能良好')
    }
    
    if (cacheStats.errors > 0) {
      recommendations.push('偵測到快取錯誤，請檢查 KV 連線狀態')
    }
    
    if (cacheStats.misses > cacheStats.hits * 2) {
      recommendations.push('快取未命中率高，考慮調整快取策略或增加快取時間')
    }
  } else {
    recommendations.push('快取服務未啟用，效能可能受影響')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('快取設定正常，運行良好！')
  }
  
  return recommendations
}