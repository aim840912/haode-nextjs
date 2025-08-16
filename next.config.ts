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
  },
  
  // 實驗性功能
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
    optimizeCss: true
  },
  
  // Webpack 設定優化
  webpack: (config, { dev, isServer }) => {
    // 生產環境優化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
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
  
  // 嚴格模式
  reactStrictMode: true,
  
  // ESLint 設定 - 啟用程式碼品質檢查
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src']
  },
  
  // TypeScript 檢查優化
  typescript: {
    ignoreBuildErrors: false
  },
  
  // 輸出配置 - 使用 standalone 模式減少部署大小
  output: 'standalone',
  
  // Gzip 壓縮設定
  compress: true,
};

export default nextConfig;
