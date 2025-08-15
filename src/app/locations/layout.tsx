import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '農場位置 | 豪德農場 - 嘉義梅山交通指南',
  description: '豪德農場位於嘉義縣梅山鄉，交通便利，提供詳細的交通指南和聯絡資訊，歡迎預約參觀。',
  keywords: ['豪德', '農場位置', '交通指南', '聯絡資訊', '預約參觀', '嘉義梅山', '農場地址'],
  openGraph: {
    title: '農場位置 | 豪德農場',
    description: '豪德農場位置與交通指南',
    images: ['/images/locations/mountain.jpg'],
    url: 'https://haode-nextjs.vercel.app/locations',
  },
  twitter: {
    card: 'summary_large_image',
    title: '農場位置 | 豪德農場',
    description: '豪德農場位置與交通指南',
    images: ['/images/locations/mountain.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/locations',
  },
}

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}