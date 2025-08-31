import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleAnalytics } from "@next/third-parties/google";
import GoogleAnalyticsProvider from "@/components/GoogleAnalyticsProvider";
import { InquiryStatsProvider } from "@/contexts/InquiryStatsContext";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-noto-serif-tc",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "豪德農場 Haude Farm - 嘉義梅山優質農產",
  description: "座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動。新鮮直送、有機栽培、產地直銷",
  keywords: [
    "豪德",
    "豪德農場",
    "豪德製茶所",
    "嘉義梅山",
    "紅肉李",
    "高山茶",
    "有機農產",
    "農場體驗",
    "季節水果",
    "自然農法",
    "產地直送",
    "台灣農產品",
    "梅山特產",
    "農場導覽",
    "製茶工藝",
    "茶葉加工"
  ],
  authors: [{ name: "豪德農場" }],
  creator: "豪德農場",
  publisher: "豪德農場",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://haode-nextjs.vercel.app/',
    siteName: '豪德農場 Haude Farm',
    title: '豪德農場 Haude Farm - 嘉義梅山優質農產',
    description: '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動',
    images: [
      {
        url: '/images/hero/scene1.jpg',
        width: 1200,
        height: 630,
        alt: '豪德農場風景',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '豪德農場 Haude Farm - 嘉義梅山優質農產',
    description: '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品',
    images: ['/images/hero/scene1.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/',
  },
  // Note: Google Site Verification code should be added when registering with Google Search Console
  // other: {
  //   'google-site-verification': 'YOUR_VERIFICATION_CODE',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${notoSansTC.variable} ${notoSerifTC.variable} ${inter.variable} antialiased flex flex-col min-h-screen`}>
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
      </body>
    </html>
  );
}