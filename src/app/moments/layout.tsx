import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '精彩時刻 | 豪德農場 - 農家生活的美好瞬間',
  description:
    '記錄豪德農場日常生活的精彩時刻，從農作活動到節慶慶典，用鏡頭捕捉農家生活的美好瞬間與珍貴回憶。',
  keywords: [
    '豪德',
    '精彩時刻',
    '農家生活',
    '生活照片',
    '活動記錄',
    '農場回憶',
    '豪德農場生活',
    '豪德製茶所',
    '茶園生活',
    '農村記憶',
  ],
  openGraph: {
    title: '精彩時刻 | 豪德農場',
    description: '豪德農場生活的美好瞬間與珍貴回憶',
    images: ['/images/moments/farm-life.jpg'],
    url: 'https://haode-nextjs.vercel.app/moments',
  },
  twitter: {
    card: 'summary_large_image',
    title: '精彩時刻 | 豪德農場',
    description: '豪德農場生活的美好瞬間與珍貴回憶',
    images: ['/images/moments/farm-life.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/moments',
  },
}

export default function MomentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
