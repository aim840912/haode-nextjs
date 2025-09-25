declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    sw?: string
    publicExcludes?: string[]
    buildExcludes?: string[]
    fallbacks?: {
      image?: string
      document?: string
      font?: string
      audio?: string
      video?: string
    }
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate'
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
          maxAgeSeconds?: number
          purgeOnQuotaError?: boolean
        }
        cacheKeyWillBeUsed?: string
        cacheWillUpdate?: string
        cacheableResponse?: {
          statuses?: number[]
          headers?: Record<string, string>
        }
        broadcastUpdate?: {
          channelName?: string
          options?: {
            headersToCheck?: string[]
          }
        }
        matchOptions?: {
          ignoreSearch?: boolean
          ignoreMethod?: boolean
          ignoreVary?: boolean
        }
        networkTimeoutSeconds?: number
        plugins?: Array<{
          cacheKeyWillBeUsed?: (param: { request: Request; mode: string }) => Promise<string>
          cacheWillUpdate?: (param: {
            request: Request
            response: Response
            event: ExtendableEvent
          }) => Promise<Response | undefined>
          cachedResponseWillBeUsed?: (param: {
            request: Request
            cachedResponse: Response
            event: ExtendableEvent
          }) => Promise<Response>
          requestWillFetch?: (param: {
            request: Request
            event: ExtendableEvent
          }) => Promise<Request>
          fetchDidFail?: (param: {
            originalRequest: Request
            request: Request
            error: Error
            event: ExtendableEvent
          }) => Promise<void>
          fetchDidSucceed?: (param: {
            request: Request
            response: Response
            event: ExtendableEvent
          }) => Promise<Response>
        }>
        precacheFallback?: {
          fallbackURL: string
        }
        rangeRequests?: boolean
      }
    }>
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    customWorkerDir?: string
    workboxOptions?: any
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
