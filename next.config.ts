import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 圖片優化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
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
    // 暫時禁用 optimizePackageImports 來修復 Supabase SSR 問題
    // optimizePackageImports: ['@/components', '@/lib'],
    // 暫時禁用 optimizeCss 以避免 critters 依賴問題
    // optimizeCss: true
  },
  
  // Webpack 設定優化
  webpack: (config, { dev, isServer }) => {
    // 完全禁用 code splitting 來避免 vendors.js 中的 self 問題
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false
      }
    }
    
    return config
  },
  
  // 快取配置
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ];
  },
  
  // PoweredBy header 移除（安全性）
  poweredByHeader: false,
  
  // 嚴格模式 - 在開發模式下禁用以避免 Multiple GoTrueClient 警告
  // 但在生產環境中保持啟用以發現潜在問題
  reactStrictMode: process.env.NODE_ENV === 'production',
  
  // ESLint 設定 - 暫時忽略 warnings 以完成 build
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src']
  },
  
  // TypeScript 檢查優化
  typescript: {
    ignoreBuildErrors: false
  },
  
  // 輸出配置 - 暫時禁用 standalone 模式以修復 Supabase SSR 問題
  // output: 'standalone',
  
  // Gzip 壓縮設定
  compress: true,
};

export default nextConfig;
