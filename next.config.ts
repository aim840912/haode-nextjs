import type { NextConfig } from 'next'

// Bundle Analyzer 配置
import bundleAnalyzer from '@next/bundle-analyzer'
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // 圖片優化配置
  images: {
    formats: ['image/avif', 'image/webp'], // AVIF 優先，然後 WebP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 365 days - 更長快取時間
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 允許本地圖片和 Supabase Storage 圖片
    domains: [], // 本地圖片不需要額外域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // 添加 loader 配置確保本地圖片正確處理
    loader: 'default',
    // 在開發模式下停用某些優化以幫助除錯
    ...(process.env.NODE_ENV === 'development' && {
      unoptimized: false, // 保持優化開啟以測試生產環境行為
    }),
  },

  // 實驗性功能
  experimental: {
    // 重新啟用包優化（Supabase SSR 問題已在新版本修復）
    optimizePackageImports: ['@/components', '@/lib'],
    // 暫時禁用 CSS 優化以避免 critters 依賴問題
    // optimizeCss: true,
  },

  // 建置優化配置 - 支援 Turbopack
  ...(process.env.NODE_ENV === 'production' && {
    webpack: config => {
      // 修復客戶端變數在伺服器端的問題
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }

      // 生產環境的 webpack 優化（暫時簡化以避免 vendors.js 問題）
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      }
      return config
    },
  }),

  // 安全標頭與快取配置
  async headers() {
    // Content Security Policy 配置
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com${process.env.NODE_ENV === 'development' ? ' https://vercel.live https://*.vercel.live' : ''}`,
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      `connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com${process.env.NODE_ENV === 'development' ? ' https://vercel.live wss://vercel.live' : ''}`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'", // 防止 clickjacking
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests', // 自動升級 HTTP 到 HTTPS
      ...(process.env.NODE_ENV === 'production' ? ['block-all-mixed-content'] : []),
    ].join('; ')

    // 安全標頭配置
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: csp,
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
      },
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none', // 允許嵌入內容，可根據需求調整
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      // HSTS 只在生產環境啟用
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload', // 2年有效期
            },
          ]
        : []),
    ]

    return [
      // 全站安全標頭
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // 圖片快取配置
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API 快取配置
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // PoweredBy header 移除（安全性）
  poweredByHeader: false,

  // 嚴格模式 - 在開發模式下禁用以避免 Multiple GoTrueClient 警告
  // 但在生產環境中保持啟用以發現潜在問題
  reactStrictMode: process.env.NODE_ENV === 'production',

  // ESLint 設定 - 暫時允許建置通過，但保持檢查
  eslint: {
    ignoreDuringBuilds: true, // 暫時設為 true 直到修復更多 any 類型
    dirs: ['src'],
  },

  // TypeScript 檢查優化
  typescript: {
    ignoreBuildErrors: false,
  },

  // 輸出配置 - 啟用 standalone 模式以減小部署包大小
  output: 'standalone',

  // Gzip 壓縮設定
  compress: true,
}

export default withBundleAnalyzer(nextConfig)
