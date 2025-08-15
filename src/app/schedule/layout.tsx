import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '行程安排 | 豪德農場 - 農場活動時程表',
  description: '查看豪德農場的活動時程表，包括農場導覽、體驗活動、季節性活動等排程安排。',
  keywords: ['豪德', '行程安排', '活動時程', '農場導覽', '預約活動', '豪德農場行程'],
  openGraph: {
    title: '行程安排 | 豪德農場',
    description: '豪德農場活動時程表與行程安排',
    images: ['/images/schedule/tea_bag_2.jpg'],
    url: 'https://haode-nextjs.vercel.app/schedule',
  },
  twitter: {
    card: 'summary_large_image',
    title: '行程安排 | 豪德農場',
    description: '豪德農場活動時程表與行程安排',
    images: ['/images/schedule/tea_bag_2.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/schedule',
  },
}

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}