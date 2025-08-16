import { Product } from '@/types/product'
import { Review } from '@/types/review'

export const mockProduct: Product = {
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

export const mockProducts: Product[] = [
  mockProduct,
  {
    id: '2',
    name: '高山茶葉',
    emoji: '🍵',
    description: '梅山高山茶，香氣濃郁',
    category: '精品茶葉',
    price: 800,
    images: ['/products/tea_bag_1.jpg'],
    inventory: 50,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

export const mockReview: Review = {
  id: '1',
  customerName: '王小明',
  title: '非常好吃的紅肉李',
  content: '果肉飽滿，甜度很高，非常推薦！',
  rating: 5,
  category: 'product',
  productId: '1',
  approved: true,
  featured: true,
  adminReply: '感謝您的支持！',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

export const mockReviews: Review[] = [
  mockReview,
  {
    id: '2',
    customerName: '李小華',
    title: '農場體驗很棒',
    content: '導覽很詳細，學到很多農業知識',
    rating: 4,
    category: 'farm-tour',
    approved: true,
    featured: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: '測試用戶',
  isAdmin: false
}

export const mockCartItem = {
  product: mockProduct,
  quantity: 2
}

// Add a simple test to satisfy Jest
describe('mockData', () => {
  it('should have valid mock product', () => {
    expect(mockProduct.id).toBe('1')
    expect(mockProduct.name).toBe('頂級紅肉李')
    expect(typeof mockProduct.price).toBe('number')
  })

  it('should have valid mock review', () => {
    expect(mockReview.id).toBe('1')
    expect(mockReview.rating).toBeGreaterThanOrEqual(1)
    expect(mockReview.rating).toBeLessThanOrEqual(5)
  })
})