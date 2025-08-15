import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '農場文化 | 豪德農場 - 傳統農業智慧與現代技術',
  description: '了解豪德農場的農業文化，從傳統農業智慧到現代種植技術，感受農場世代傳承的農業精神與對土地的熱愛。',
  keywords: ['豪德', '農場文化', '農業傳統', '種植技術', '農業智慧', '土地保育', '豪德農場故事', '豪德製茶所', '製茶文化', '茶藝傳承'],
  openGraph: {
    title: '農場文化 | 豪德農場',
    description: '豪德農場的農業文化與傳統智慧',
    images: ['/images/culture/mountain.jpg'],
    url: 'https://haode-nextjs.vercel.app/culture',
  },
  twitter: {
    card: 'summary_large_image',
    title: '農場文化 | 豪德農場',
    description: '豪德農場的農業文化與傳統智慧',
    images: ['/images/culture/mountain.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/culture',
  },
}

export default function CultureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}