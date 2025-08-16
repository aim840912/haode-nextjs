import { render, screen } from '../utils/test-utils'
import CartIcon from '@/components/CartIcon'

// Mock the cart context
jest.mock('@/lib/cart-context', () => ({
  useCart: () => ({
    totalItems: 3
  })
}))

describe('CartIcon Component', () => {
  it('renders cart icon', () => {
    render(<CartIcon />)
    
    const cartIcon = screen.getByRole('link')
    expect(cartIcon).toHaveAttribute('href', '/cart')
  })

  it('displays total items count', () => {
    render(<CartIcon />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<CartIcon />)
    
    const cartIcon = screen.getByRole('link')
    expect(cartIcon).toHaveAttribute('aria-label', '購物車 (3 項商品)')
  })

  it('applies hover effects', () => {
    render(<CartIcon />)
    
    const cartIcon = screen.getByRole('link')
    expect(cartIcon).toHaveClass('hover:text-amber-600')
  })
})