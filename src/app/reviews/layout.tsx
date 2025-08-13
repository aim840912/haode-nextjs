import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '顧客心聲 - 豪德茶業 | 真實評價與農場體驗分享',
  description: '查看豪德茶業的真實顧客評價，包含產品體驗、農場觀光心得與服務評分。500+ 滿意顧客，平均 4.8 星評分，95% 推薦率。',
  keywords: '豪德茶業評價, 顧客心聲, 農產品評價, 農場體驗, 茶葉評價, 紅肉李評價, 觀光果園心得',
  openGraph: {
    title: '顧客心聲 - 豪德茶業',
    description: '查看500+真實顧客評價，平均4.8星評分，了解豪德茶業的優質農產品與服務',
    url: '/reviews',
    siteName: '豪德茶業',
    images: [
      {
        url: '/images/og-reviews.jpg',
        width: 1200,
        height: 630,
        alt: '豪德茶業顧客心聲',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '顧客心聲 - 豪德茶業',
    description: '查看500+真實顧客評價，平均4.8星評分',
    images: ['/images/twitter-reviews.jpg'],
  },
  alternates: {
    canonical: '/reviews',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}