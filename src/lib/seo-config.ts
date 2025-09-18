// SEO 設定檔案 - 統一管理所有 SEO 相關設定

export const siteConfig = {
  name: '豪德農場',
  title: '豪德農場 Haude Farm - 嘉義梅山優質農產',
  description:
    '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動。新鮮直送、有機栽培、產地直銷',
  url: 'https://haode-nextjs.vercel.app/',
  ogImage: '/images/hero/scene1.jpg',
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
  ],
  author: '豪德農場',
  creator: '豪德農場',
  publisher: '豪德農場',
}

export const contactInfo = {
  phone: '+886-5-2561843',
  email: 'aim840912@gmail.com',
  address: {
    street: '梅山鄉太和村一鄰八號',
    city: '梅山鄉',
    state: '嘉義縣',
    postalCode: '603',
    country: '台灣',
  },
  coordinates: {
    latitude: '23.5833',
    longitude: '120.5833',
  },
}

export const socialLinks = {
  facebook: 'https://www.facebook.com/groups/284358098576086/?locale=zh_TW',
  instagram: 'https://www.instagram.com/haudefarm',
  line: 'https://line.me/haudefarm',
  youtube: 'https://www.youtube.com/haudefarm',
}

export const businessHours = {
  monday: '08:00-17:00',
  tuesday: '08:00-17:00',
  wednesday: '08:00-17:00',
  thursday: '08:00-17:00',
  friday: '08:00-17:00',
  saturday: '08:00-17:00',
  sunday: '08:00-17:00',
  openingHours: 'Mo-Su 08:00-17:00',
}

// 生成頁面專用的 metadata
export function generatePageMetadata({
  title,
  description,
  keywords = [],
  image,
  path = '',
}: {
  title: string
  description: string
  keywords?: string[]
  image?: string
  path?: string
}) {
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`
  const url = `${siteConfig.url}${path}`

  return {
    title: fullTitle,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    openGraph: {
      type: 'website',
      locale: 'zh_TW',
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image || siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image || siteConfig.ogImage],
    },
    alternates: {
      canonical: url,
    },
  }
}

// 常用的 metadata 模板
export const pageMetadata = {
  home: generatePageMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: '',
  }),

  products: generatePageMetadata({
    title: '精選農產品',
    description:
      '豪德農場精選農產品，包括紅肉李、高山茶葉、季節水果、有機蔬菜等。新鮮直送，品質保證，體驗台灣最優質的農產品。',
    keywords: [
      '豪德',
      '農產品',
      '紅肉李',
      '高山茶',
      '有機蔬菜',
      '季節水果',
      '豪德農場產品',
      '豪德製茶所',
      '嘉義特產',
      '製茶工藝',
      '茶葉加工',
    ],
    image: '/images/products/red_plum_2.jpg',
    path: '/products',
  }),

  news: generatePageMetadata({
    title: '農場新聞',
    description:
      '豪德農場最新消息，包括產季資訊、農場活動、種植技術分享等。了解最新的農產品動態和農場故事。',
    keywords: [
      '豪德',
      '農場新聞',
      '產季資訊',
      '農場活動',
      '種植技術',
      '豪德農場消息',
      '豪德製茶所',
      '農業資訊',
      '製茶新聞',
    ],
    image: '/images/news/red_plum_smile.jpg',
    path: '/news',
  }),

  moments: generatePageMetadata({
    title: '精彩時刻',
    description:
      '分享豪德農場的精彩時刻，記錄農場生活的美好瞬間，從日常農作到節慶活動，感受農場生活的豐富多彩。',
    keywords: [
      '豪德',
      '精彩時刻',
      '農場生活',
      '農場活動',
      '時光典藏',
      '生活照片',
      '豪德農場記錄',
      '豪德製茶所',
      '農場故事',
      '美好時光',
    ],
    image: '/images/moments/farm-life.jpg',
    path: '/moments',
  }),

  farmTour: generatePageMetadata({
    title: '農場體驗',
    description:
      '豪德農場提供四季不同的農場體驗活動，讓您親身感受農業生活，了解農產品從種植到收穫的完整過程。',
    keywords: ['豪德', '農場體驗', '農業體驗', '農場導覽', '親子活動', '生態教育', '農村旅遊'],
    image: '/images/farm-tour/many_people_1.jpg',
    path: '/farm-tour',
  }),

  locations: generatePageMetadata({
    title: '農場位置',
    description: '豪德農場位於嘉義縣梅山鄉，交通便利，提供詳細的交通指南和聯絡資訊，歡迎預約參觀。',
    keywords: ['豪德', '農場位置', '交通指南', '聯絡資訊', '預約參觀', '嘉義梅山', '農場地址'],
    image: '/images/locations/mountain.jpg',
    path: '/locations',
  }),
}
