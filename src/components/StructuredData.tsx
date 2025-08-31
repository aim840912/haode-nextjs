import { FC } from 'react'

interface StructuredDataProps {
  data: Record<string, any>
}

const StructuredData: FC<StructuredDataProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// 農場主要資訊的結構化資料
export const FarmStructuredData = () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "豪德農場",
    "alternateName": ["Haude Farm", "豪德製茶所"],
    "description": "座落梅山群峰之間的豪德農場，以自然農法栽培紅肉李、高山茶葉、季節水果等優質農產品，提供農場導覽與四季體驗活動",
    "url": "https://haode-nextjs.vercel.app/",
    "telephone": "+886-5-2561843",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "梅山鄉",
      "addressRegion": "嘉義縣",
      "addressCountry": "台灣",
      "postalCode": "603"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "23.5833",
      "longitude": "120.5833"
    },
    "openingHours": "Mo-Su 08:00-17:00",
    "priceRange": "$$",
    "servesCuisine": "農產品",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "農產品目錄",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "紅肉李",
            "description": "高山紅肉李，甜度極高"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "高山茶",
            "description": "海拔1000公尺以上高山茶葉"
          }
        }
      ]
    },
    "areaServed": [
      "嘉義縣",
      "台南市",
      "高雄市",
      "台中市",
      "台北市",
      "新北市"
    ],
    "brand": {
      "@type": "Brand",
      "name": "豪德農場"
    },
    "sameAs": [
      "https://www.facebook.com/groups/284358098576086/?locale=zh_TW",
      "https://www.instagram.com/haudefarm"
    ]
  }

  return <StructuredData data={data} />
}

// 產品結構化資料
export const ProductStructuredData = ({ product }: { product: any }) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "category": product.category,
    "brand": {
      "@type": "Brand",
      "name": "豪德農場"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "TWD",
      "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "豪德農場"
      }
    },
    "image": product.images?.[0] || "/images/placeholder.jpg"
  }

  return <StructuredData data={data} />
}

// 文章結構化資料
export const ArticleStructuredData = ({ article }: { article: any }) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.summary,
    "image": article.imageUrl,
    "author": {
      "@type": "Organization",
      "name": "豪德農場"
    },
    "publisher": {
      "@type": "Organization",
      "name": "豪德農場",
      "logo": {
        "@type": "ImageObject",
        "url": "https://haode-nextjs.vercel.app/logo.png"
      }
    },
    "datePublished": article.publishDate,
    "dateModified": article.updatedAt || article.publishDate
  }

  return <StructuredData data={data} />
}

export default StructuredData