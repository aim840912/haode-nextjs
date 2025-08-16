import { productService } from '@/services/productService'
import { mockProduct, mockProducts } from '../mocks/mockData'

// Mock the data file
jest.mock('@/data/products.json', () => [
  {
    id: '1',
    name: '頂級紅肉李',
    emoji: '🍑',
    description: '來自梅山的優質紅肉李，果肉飽滿、甜度極高',
    category: '紅肉李果園',
    price: 350,
    originalPrice: 400,
    images: ['/products/red_plum_2.jpg'],
    inventory: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
])

describe('ProductService', () => {
  describe('getProducts', () => {
    it('should return all products', async () => {
      const products = await productService.getProducts()
      
      expect(Array.isArray(products)).toBe(true)
      expect(products).toHaveLength(1)
      expect(products[0]).toMatchObject({
        id: '1',
        name: '頂級紅肉李',
        price: 350
      })
    })
  })

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const product = await productService.getProductById('1')
      
      expect(product).toMatchObject({
        id: '1',
        name: '頂級紅肉李',
        price: 350
      })
    })

    it('should return null for non-existent id', async () => {
      const product = await productService.getProductById('999')
      
      expect(product).toBeNull()
    })
  })

  describe('addProduct', () => {
    it('should add a new product', async () => {
      const newProduct = {
        name: '新產品',
        emoji: '🍊',
        description: '測試產品',
        category: '測試',
        price: 100,
        images: ['/test.jpg'],
        inventory: 10
      }

      const addedProduct = await productService.addProduct(newProduct)
      
      expect(addedProduct).toMatchObject(newProduct)
      expect(addedProduct.id).toBeDefined()
      expect(addedProduct.isActive).toBe(true)
      expect(addedProduct.createdAt).toBeDefined()
      expect(addedProduct.updatedAt).toBeDefined()
    })
  })

  describe('updateProduct', () => {
    it('should update existing product', async () => {
      const updates = {
        name: '更新的產品名稱',
        price: 500
      }

      const updatedProduct = await productService.updateProduct('1', updates)
      
      expect(updatedProduct).toMatchObject({
        id: '1',
        name: '更新的產品名稱',
        price: 500
      })
      expect(updatedProduct?.updatedAt).toBeDefined()
    })

    it('should return null for non-existent product', async () => {
      const updates = { name: '測試' }
      const result = await productService.updateProduct('999', updates)
      
      expect(result).toBeNull()
    })
  })

  describe('deleteProduct', () => {
    it('should mark product as inactive', async () => {
      const result = await productService.deleteProduct('1')
      
      expect(result).toBe(true)
    })

    it('should return false for non-existent product', async () => {
      const result = await productService.deleteProduct('999')
      
      expect(result).toBe(false)
    })
  })

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const results = await productService.searchProducts('紅肉李')
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toContain('紅肉李')
    })

    it('should search products by category', async () => {
      const results = await productService.searchProducts('紅肉李果園')
      
      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('紅肉李果園')
    })

    it('should return empty array for no matches', async () => {
      const results = await productService.searchProducts('不存在的產品')
      
      expect(results).toHaveLength(0)
    })
  })
})