import { CacheManager, withCache } from '@/lib/cache-server'

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([])
  }
}))

describe('CacheManager', () => {
  beforeEach(() => {
    // Clear memory cache before each test
    CacheManager['memoryCache'].clear()
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should return cached data from memory', async () => {
      const testData = { test: 'data' }
      await CacheManager.set('test-key', testData)
      
      const result = await CacheManager.get('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      const result = await CacheManager.get('non-existent')
      expect(result).toBeNull()
    })

    it('should return null for expired data', async () => {
      const testData = { test: 'data' }
      await CacheManager.set('test-key', testData, { ttl: 0 })
      
      // Wait a bit for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = await CacheManager.get('test-key')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should store data in memory cache', async () => {
      const testData = { test: 'data' }
      await CacheManager.set('test-key', testData)
      
      const cached = CacheManager['memoryCache'].get('test-key')
      expect(cached?.data).toEqual(testData)
      expect(cached?.expires).toBeGreaterThan(Date.now())
    })

    it('should respect custom TTL', async () => {
      const testData = { test: 'data' }
      const ttl = 1 // 1 second
      await CacheManager.set('test-key', testData, { ttl })
      
      const cached = CacheManager['memoryCache'].get('test-key')
      expect(cached?.expires).toBeLessThanOrEqual(Date.now() + (ttl * 1000) + 10)
    })
  })

  describe('delete', () => {
    it('should remove data from memory cache', async () => {
      const testData = { test: 'data' }
      await CacheManager.set('test-key', testData)
      
      expect(CacheManager['memoryCache'].has('test-key')).toBe(true)
      
      await CacheManager.delete('test-key')
      
      expect(CacheManager['memoryCache'].has('test-key')).toBe(false)
    })
  })

  describe('cleanExpired', () => {
    it('should remove expired entries', async () => {
      const testData = { test: 'data' }
      
      // Set with very short TTL
      await CacheManager.set('expired-key', testData, { ttl: 0 })
      await CacheManager.set('valid-key', testData, { ttl: 300 })
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      CacheManager.cleanExpired()
      
      expect(CacheManager['memoryCache'].has('expired-key')).toBe(false)
      expect(CacheManager['memoryCache'].has('valid-key')).toBe(true)
    })
  })
})

describe('withCache', () => {
  beforeEach(() => {
    CacheManager['memoryCache'].clear()
    jest.clearAllMocks()
  })

  it('should cache function results', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'test' })
    const cachedFetcher = withCache(mockFetcher, 'test-cache-key')
    
    // First call should invoke fetcher
    const result1 = await cachedFetcher()
    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(result1).toEqual({ data: 'test' })
    
    // Second call should use cache
    const result2 = await cachedFetcher()
    expect(mockFetcher).toHaveBeenCalledTimes(1) // Still only called once
    expect(result2).toEqual({ data: 'test' })
  })

  it('should invoke fetcher when cache is empty', async () => {
    const mockFetcher = jest.fn().mockResolvedValue({ data: 'fresh' })
    const cachedFetcher = withCache(mockFetcher, 'empty-cache-key')
    
    const result = await cachedFetcher()
    expect(mockFetcher).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: 'fresh' })
  })

  it('should re-fetch when cache expires', async () => {
    const mockFetcher = jest.fn()
      .mockResolvedValueOnce({ data: 'first' })
      .mockResolvedValueOnce({ data: 'second' })
    
    const cachedFetcher = withCache(mockFetcher, 'expire-test', { ttl: 0 })
    
    // First call
    const result1 = await cachedFetcher()
    expect(result1).toEqual({ data: 'first' })
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Second call should fetch fresh data
    const result2 = await cachedFetcher()
    expect(mockFetcher).toHaveBeenCalledTimes(2)
    expect(result2).toEqual({ data: 'second' })
  })
})