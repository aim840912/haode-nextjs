import type { Metadata } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import HeaderSpacer from '@/components/HeaderSpacer'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GoogleAnalytics } from '@next/third-parties/google'
import GoogleAnalyticsProvider from '@/components/GoogleAnalyticsProvider'
import { InquiryStatsProvider } from '@/contexts/InquiryStatsContext'
import { validateOnStartup } from '@/lib/env-validator'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// 在應用程式啟動時驗證所有必要的環境變數
validateOnStartup()

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
})

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  variable: '--font-noto-serif-tc',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: '豪德農場 Haude Farm - 嘉義梅山優質農產',
    template: '%s | 豪德農場 Haude Farm',
  },
  description:
    '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動。新鮮直送、有機栽培、產地直銷',
  keywords: [
    '豪德',
    '豪德農場',
    '豪德製茶所',
    '嘉義梅山',
    '紅肉李',
    '高山茶',
    '有機農產',
    '農場體驗',
    '季節水果',
    '自然農法',
    '產地直送',
    '台灣農產品',
    '梅山特產',
    '農場導覽',
    '製茶工藝',
    '茶葉加工',
    '阿里山',
    '台灣茶',
    '有機認證',
    '農產品電商',
  ],
  authors: [{ name: '豪德農場', url: 'https://haode-nextjs.vercel.app' }],
  creator: '豪德農場',
  publisher: '豪德農場',
  category: '農業',
  classification: '農場',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
      noimageindex: false,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://haode-nextjs.vercel.app/',
    siteName: '豪德農場 Haude Farm',
    title: '豪德農場 Haude Farm - 嘉義梅山優質農產',
    description:
      '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動。新鮮直送、有機栽培、產地直銷',
    images: [
      {
        url: '/images/hero/scene1.jpg',
        width: 1200,
        height: 630,
        alt: '豪德農場風景 - 嘉義梅山優質農產',
        type: 'image/jpeg',
      },
      {
        url: '/images/hero/scene2.jpg',
        width: 1200,
        height: 630,
        alt: '豪德農場產品 - 有機農產品',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@haudefarm',
    creator: '@haudefarm',
    title: '豪德農場 Haude Farm - 嘉義梅山優質農產',
    description: '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品',
    images: [
      {
        url: '/images/hero/scene1.jpg',
        alt: '豪德農場風景',
      },
    ],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/',
  },
  applicationName: '豪德農場',
  referrer: 'origin-when-cross-origin',
  generator: 'Next.js',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Add structured data for organization
  other: {
    // Google Site Verification (should be configured when setting up Google Search Console)
    // 'google-site-verification': 'YOUR_VERIFICATION_CODE',
    // Facebook Domain Verification
    // 'facebook-domain-verification': 'YOUR_FB_VERIFICATION_CODE',
    // JSON-LD for Organization
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '豪德農場 Haude Farm',
      alternateName: '豪德製茶所',
      url: 'https://haode-nextjs.vercel.app',
      logo: 'https://haode-nextjs.vercel.app/images/logo.png',
      description:
        '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TW',
        addressLocality: '嘉義縣',
        addressRegion: '梅山鄉',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: '客戶服務',
        availableLanguage: ['zh-TW', 'zh-CN'],
      },
      sameAs: [
        // Add social media URLs when available
        // 'https://www.facebook.com/haudefarm',
        // 'https://www.instagram.com/haudefarm',
      ],
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body
        className={`${notoSansTC.variable} ${notoSerifTC.variable} ${inter.variable} antialiased flex flex-col min-h-screen`}
      >
        <ErrorBoundary>
          <GoogleAnalyticsProvider>
            <ToastProvider>
              <AuthProvider>
                <InquiryStatsProvider>
                  <Header />
                  <main className="flex-grow">
                    <HeaderSpacer />
                    {children}
                  </main>
                  <Footer />
                </InquiryStatsProvider>
              </AuthProvider>
            </ToastProvider>
          </GoogleAnalyticsProvider>
        </ErrorBoundary>
        {/* Google Analytics 4 整合 */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID &&
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID !== 'G-PLACEHOLDER' && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}

        {/* Vercel Analytics - 只在生產環境啟用 */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
