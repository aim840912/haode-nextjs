import { render, screen } from '../utils/test-utils'
import { 
  LoadingSkeleton, 
  ProductCardSkeleton, 
  ReviewSkeleton,
  PageLoadingSkeleton 
} from '@/components/LoadingSkeleton'

describe('LoadingSkeleton Components', () => {
  describe('LoadingSkeleton', () => {
    it('renders with default props', () => {
      render(<LoadingSkeleton />)
      const skeleton = screen.getByRole('generic')
      expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded')
    })

    it('renders text variant with multiple lines', () => {
      render(<LoadingSkeleton variant="text" lines={3} />)
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('space-y-2')
      // Should have 3 child divs for lines
      expect(container.children).toHaveLength(3)
    })

    it('renders circle variant', () => {
      render(<LoadingSkeleton variant="circle" height="h-10" width="w-10" />)
      const skeleton = screen.getByRole('generic')
      expect(skeleton).toHaveClass('rounded-full', 'h-10', 'w-10')
    })

    it('renders card variant', () => {
      render(<LoadingSkeleton variant="card" />)
      const skeleton = screen.getByRole('generic')
      expect(skeleton).toHaveClass('p-6')
    })

    it('applies custom className', () => {
      render(<LoadingSkeleton className="custom-class" />)
      const skeleton = screen.getByRole('generic')
      expect(skeleton).toHaveClass('custom-class')
    })
  })

  describe('ProductCardSkeleton', () => {
    it('renders product card structure', () => {
      render(<ProductCardSkeleton />)
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'animate-pulse')
    })
  })

  describe('ReviewSkeleton', () => {
    it('renders review structure with avatar and content', () => {
      render(<ReviewSkeleton />)
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'animate-pulse')
    })
  })

  describe('PageLoadingSkeleton', () => {
    it('renders full page skeleton structure', () => {
      render(<PageLoadingSkeleton />)
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-6', 'py-8')
      
      // Should have title, content grid, and button areas
      expect(container.querySelector('.text-center')).toBeInTheDocument()
      expect(container.querySelector('.grid')).toBeInTheDocument()
    })

    it('renders 6 product card skeletons', () => {
      render(<PageLoadingSkeleton />)
      const gridContainer = screen.getByRole('generic').querySelector('.grid.md\\:grid-cols-3')
      expect(gridContainer?.children).toHaveLength(6)
    })
  })
})