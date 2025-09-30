import { MetadataRoute } from 'next'
import { adminProductService } from '@/services/core/product/productService'
import { logger } from '@/lib/logger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://haode-nextjs.vercel.app/'

  // 靜態頁面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/moments`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/farm-tour`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]

  // 動態產品頁面
  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await adminProductService.getProducts()
    productPages = products
      .filter(product => product.isActive)
      .map(product => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
  } catch (error) {
    logger.error('Error generating product sitemap', error as Error, {
      module: 'sitemap',
      action: 'generateProductSitemap',
    })
  }

  return [...staticPages, ...productPages]
}
