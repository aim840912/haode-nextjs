import { FC } from 'react'
import {
  sanitizeStructuredData,
  validateStructuredData,
} from '@/lib/utils/structured-data-sanitizer'
import { logger } from '@/lib/logger'

interface StructuredDataProps {
  data: Record<string, unknown>
}

/**
 * 結構化資料元件
 *
 * 安全性說明：
 * - 使用 dangerouslySetInnerHTML 來嵌入 JSON-LD 結構化資料
 * - 透過 sanitizeStructuredData 清理資料，防止 XSS 攻擊
 * - JSON-LD 資料放在 <script type="application/ld+json"> 中，不會被執行為 JavaScript
 * - 這是 Google、Schema.org 推薦的 SEO 標準做法
 */
const StructuredData: FC<StructuredDataProps> = ({ data }) => {
  // 驗證結構化資料格式
  const validation = validateStructuredData(data)
  if (!validation.isValid) {
    logger.warn('結構化資料格式不符合 Schema.org 規範', {
      module: 'StructuredData',
      action: 'validate',
      metadata: { errors: validation.errors },
    })
  }

  // 清理並序列化資料
  const sanitizedJson = sanitizeStructuredData(data, {
    enableLogging: true,
    moduleName: 'StructuredData',
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizedJson }} />
}

// 農場主要資訊的結構化資料
export const FarmStructuredData = () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '豪德農場',
    alternateName: ['Haude Farm', '豪德製茶所'],
    description:
      '座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動',
    url: 'https://haode-nextjs.vercel.app/',
    telephone: '+886-5-2561843',
    address: {
      '@type': 'PostalAddress',
      addressLocality: '梅山鄉',
      addressRegion: '嘉義縣',
      addressCountry: '台灣',
      postalCode: '603',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '23.5833',
      longitude: '120.5833',
    },
    openingHours: 'Mo-Su 08:00-17:00',
    priceRange: '$$',
    servesCuisine: '農產品',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: '農產品目錄',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: '紅肉李',
            description: '高山紅肉李，甜度極高',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: '高山茶',
            description: '海拔1000公尺以上高山茶葉',
          },
        },
      ],
    },
    areaServed: ['嘉義縣', '台南市', '高雄市', '台中市', '台北市', '新北市'],
    brand: {
      '@type': 'Brand',
      name: '豪德農場',
    },
    sameAs: [
      'https://www.facebook.com/groups/284358098576086/?locale=zh_TW',
      'https://www.instagram.com/haudefarm',
    ],
  }

  return <StructuredData data={data} />
}

// 產品結構化資料
export const ProductStructuredData = ({
  product,
}: {
  product: {
    name: string
    description: string
    category: string
    price: number
    inventory: number
    images?: string[]
  }
}) => {
  // 使用專門的產品資料清理函數
  const sanitizedProduct = {
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    inventory: product.inventory,
    images: product.images,
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: sanitizedProduct.name,
    description: sanitizedProduct.description,
    category: sanitizedProduct.category,
    brand: {
      '@type': 'Brand',
      name: '豪德農場',
    },
    offers: {
      '@type': 'Offer',
      price: sanitizedProduct.price,
      priceCurrency: 'TWD',
      availability:
        sanitizedProduct.inventory > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: '豪德農場',
      },
    },
    image: sanitizedProduct.images?.[0] || '/images/placeholder.jpg',
  }

  return <StructuredData data={data} />
}

// 文章結構化資料
export const ArticleStructuredData = ({
  article,
}: {
  article: {
    title: string
    summary: string
    imageUrl?: string
    publishedDate: string
    modifiedDate?: string
    author?: string
  }
}) => {
  // 使用專門的文章資料清理函數
  const sanitizedArticle = {
    title: article.title,
    summary: article.summary,
    imageUrl: article.imageUrl,
    publishedDate: article.publishedDate,
    modifiedDate: article.modifiedDate,
    author: article.author,
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: sanitizedArticle.title,
    description: sanitizedArticle.summary,
    image: sanitizedArticle.imageUrl,
    author: {
      '@type': 'Organization',
      name: '豪德農場',
    },
    publisher: {
      '@type': 'Organization',
      name: '豪德農場',
      logo: {
        '@type': 'ImageObject',
        url: 'https://haode-nextjs.vercel.app/logo.png',
      },
    },
    datePublished: sanitizedArticle.publishedDate,
    dateModified: sanitizedArticle.modifiedDate || sanitizedArticle.publishedDate,
  }

  return <StructuredData data={data} />
}

export default StructuredData
