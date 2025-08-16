import React from 'react'
import { render, screen, fireEvent } from '../utils/test-utils'
import { ErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Components', () => {
  // Suppress console.error during tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders error UI when there is an error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('頁面載入發生錯誤')).toBeInTheDocument()
      expect(screen.getByText('很抱歉，頁面載入時發生了問題。請嘗試重新整理頁面，或稍後再試。')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '重新嘗試' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '返回首頁' })).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('calls onError callback when error occurs', () => {
      const mockOnError = jest.fn()
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('resets error state when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )
      
      // Error should be displayed
      expect(screen.getByText('頁面載入發生錯誤')).toBeInTheDocument()
      
      // Click retry button
      fireEvent.click(screen.getByRole('button', { name: '重新嘗試' }))
      
      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('ComponentErrorBoundary', () => {
    it('renders children when there is no error', () => {
      render(
        <ComponentErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ComponentErrorBoundary>
      )
      
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders component-level error UI when there is an error', () => {
      render(
        <ComponentErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ComponentErrorBoundary>
      )
      
      expect(screen.getByText('組件載入失敗')).toBeInTheDocument()
      expect(screen.getByText('此區塊暫時無法顯示，請重新整理頁面。')).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Component error</div>
      
      render(
        <ComponentErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ComponentErrorBoundary>
      )
      
      expect(screen.getByText('Component error')).toBeInTheDocument()
    })
  })
})