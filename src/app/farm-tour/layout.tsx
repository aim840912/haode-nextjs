import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '農場體驗 | 豪德農場 - 四季農業體驗活動',
  description: '豪德農場提供四季不同的農場體驗活動，讓您親身感受農業生活，了解農產品從種植到收穫的完整過程。',
  keywords: ['豪德', '農場體驗', '農業體驗', '農場導覽', '親子活動', '生態教育', '農村旅遊'],
  openGraph: {
    title: '農場體驗 | 豪德農場',
    description: '豪德農場四季農業體驗活動',
    images: ['/images/farm-tour/many_people_1.jpg'],
    url: 'https://haode-nextjs.vercel.app/farm-tour',
  },
  twitter: {
    card: 'summary_large_image',
    title: '農場體驗 | 豪德農場',
    description: '豪德農場四季農業體驗活動',
    images: ['/images/farm-tour/many_people_1.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/farm-tour',
  },
}

export default function FarmTourLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}