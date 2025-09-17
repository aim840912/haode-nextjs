import { Product } from '@/types/product'
import { AdminFilterState } from '../../AdminProductFilter'

/**
 * 產品篩選和排序工具函數
 */
export class ProductFilters {
  /**
   * 根據篩選條件過濾和排序產品
   */
  static filterAndSortProducts(products: Product[], filters: AdminFilterState): Product[] {
    let filtered = [...products]

    // 搜尋篩選
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm) ||
          product.id.toLowerCase().includes(searchTerm)
      )
    }

    // 類別篩選
    if (filters.categories.length > 0) {
      filtered = filtered.filter(
        product => product.category && filters.categories.includes(product.category)
      )
    }

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      filtered = filtered.filter(product => product.inventory > 0)
    } else if (filters.availability === 'out_of_stock') {
      filtered = filtered.filter(product => product.inventory <= 0)
    }

    // 上架狀態篩選
    if (filters.status === 'active') {
      filtered = filtered.filter(product => product.isActive)
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(product => !product.isActive)
    }

    // 價格區間篩選
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
      filtered = filtered.filter(
        product =>
          product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
      )
    }

    // 排序
    return this.sortProducts(filtered, filters.sortBy)
  }

  /**
   * 根據排序條件排序產品
   */
  static sortProducts(products: Product[], sortBy: string): Product[] {
    return products.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'inventory':
          return b.inventory - a.inventory
        case 'created_desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'created_asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }

  /**
   * 獲取產品統計資訊
   */
  static getProductStats(products: Product[]) {
    return {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      inactive: products.filter(p => !p.isActive).length,
      inStock: products.filter(p => p.inventory > 0).length,
      outOfStock: products.filter(p => p.inventory <= 0).length,
      lowStock: products.filter(p => p.inventory > 0 && p.inventory <= 10).length,
      onSale: products.filter(p => p.isOnSale).length,
    }
  }

  /**
   * 獲取所有可用的產品類別
   */
  static getAvailableCategories(products: Product[]): string[] {
    const categories = products.map(p => p.category).filter(Boolean) as string[]

    return Array.from(new Set(categories)).sort()
  }
}
