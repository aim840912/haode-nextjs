import { Product } from './product'

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
  addedAt: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  updatedAt: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CartService {
  getCart(userId: string): Promise<Cart>
  addItem(userId: string, item: AddToCartRequest): Promise<Cart>
  updateItem(userId: string, itemId: string, updates: UpdateCartItemRequest): Promise<Cart>
  removeItem(userId: string, itemId: string): Promise<Cart>
  clearCart(userId: string): Promise<void>
}