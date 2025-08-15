import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '精選農產品 | 豪德農場 - 紅肉李、高山茶、有機蔬果',
  description: '豪德農場精選農產品，包括紅肉李、高山茶葉、季節水果、有機蔬菜等。新鮮直送，品質保證，體驗台灣最優質的農產品。',
  keywords: ['豪德', '農產品', '紅肉李', '高山茶', '有機蔬菜', '季節水果', '豪德農場產品', '豪德製茶所', '嘉義特產', '製茶工藝', '茶葉加工'],
  openGraph: {
    title: '精選農產品 | 豪德農場',
    description: '豪德農場精選農產品，新鮮直送，品質保證',
    images: ['/images/products/red_plum_2.jpg'],
    url: 'https://haode-nextjs.vercel.app/products',
  },
  twitter: {
    card: 'summary_large_image',
    title: '精選農產品 | 豪德農場',
    description: '豪德農場精選農產品，新鮮直送，品質保證',
    images: ['/images/products/red_plum_2.jpg'],
  },
  alternates: {
    canonical: 'https://haode-nextjs.vercel.app/products',
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}