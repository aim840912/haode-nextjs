import { z } from 'zod'

// Mock environment variables for testing
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NODE_ENV: 'test'
}

// Mock process.env
const originalEnv = process.env

describe('Environment Validation', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, ...mockEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should validate correct environment variables', () => {
    // Re-import the module to use the mocked env
    const { env } = require('@/lib/env-validation')
    
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    expect(env.NODE_ENV).toBe('test')
  })

  it('should throw error for missing required variables', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    
    expect(() => {
      jest.resetModules()
      require('@/lib/env-validation')
    }).toThrow(/Missing or invalid environment variables/)
  })

  it('should throw error for invalid URL format', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url'
    
    expect(() => {
      jest.resetModules()
      require('@/lib/env-validation')
    }).toThrow()
  })

  it('should accept valid optional variables', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.KV_REST_API_URL = 'https://kv.upstash.io'
    
    const { env } = require('@/lib/env-validation')
    
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_123')
    expect(env.KV_REST_API_URL).toBe('https://kv.upstash.io')
  })

  it('should reject invalid Stripe key format', () => {
    process.env.STRIPE_SECRET_KEY = 'invalid-key'
    
    expect(() => {
      jest.resetModules()
      require('@/lib/env-validation')
    }).toThrow()
  })

  it('should accept valid NODE_ENV values', () => {
    const validEnvs = ['development', 'production', 'test']
    
    validEnvs.forEach(env => {
      process.env.NODE_ENV = env
      jest.resetModules()
      
      expect(() => {
        require('@/lib/env-validation')
      }).not.toThrow()
    })
  })

  it('should reject invalid NODE_ENV values', () => {
    process.env.NODE_ENV = 'invalid'
    
    expect(() => {
      jest.resetModules()
      require('@/lib/env-validation')
    }).toThrow()
  })
})