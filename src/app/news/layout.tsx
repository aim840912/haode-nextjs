import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '農場新聞 | 豪德農場 - 最新消息與產季資訊',
  description: '豪德農場最新消息，包括產季資訊、農場活動、種植技術分享等。了解最新的農產品動態和農場故事。',
  keywords: ['豪德', '農場新聞', '產季資訊', '農場活動', '種植技術', '豪德農場消息', '豪德製茶所', '農業資訊', '製茶新聞'],
  openGraph: {
    title: '農場新聞 | 豪德農場',
    description: '豪德農場最新消息與產季資訊',
    images: ['/images/news/red_plum_smile.jpg'],
    url: 'https://haode-nextjs.vercel.app/news',
  },
  twitter: {
    card: 'summary_large_image',
    title: '農場新聞 | 豪德農場',
    description: '豪德農場最新消息與產季資訊',
    images: ['/images/news/red_plum_smile.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/news',
  },
}

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}