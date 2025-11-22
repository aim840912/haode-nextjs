'use client'

/**
 * 購物車 Context
 *
 * 提供全域購物車狀態管理，支援：
 * - 新增、移除、更新商品數量
 * - localStorage 持久化
 * - 計算小計、運費、總金額
 */

import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react'
import type { Product } from '@/types/product'
import { useAuth } from './AuthContext'

// ==========================================
// 類型定義
// ==========================================

export interface CartItem {
  id: string // product id
  name: string
  price: number
  quantity: number
  image?: string // 商品圖片 URL
  maxQuantity: number // 最大可購買數量（庫存）
}

interface CartState {
  items: CartItem[]
  isLoaded: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType {
  items: CartItem[]
  isLoaded: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  itemCount: number
  subtotal: number
  shippingFee: number
  total: number
}

// ==========================================
// 常數
// ==========================================

const FREE_SHIPPING_THRESHOLD = 1000 // 滿千免運
const SHIPPING_FEE = 100 // 運費

// 根據用戶 ID 生成購物車儲存 key
const getCartStorageKey = (userId: string | null): string | null => {
  return userId ? `haude_cart_${userId}` : null
}

// ==========================================
// Reducer
// ==========================================

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id)

      if (existingIndex >= 0) {
        // 更新現有項目數量
        const updatedItems = [...state.items]
        const newQuantity = Math.min(
          updatedItems[existingIndex].quantity + action.payload.quantity,
          action.payload.maxQuantity
        )
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: newQuantity,
        }
        return { ...state, items: updatedItems }
      } else {
        // 新增項目
        return { ...state, items: [...state.items, action.payload] }
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id),
        }
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity: Math.min(quantity, item.maxQuantity) } : item
        ),
      }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    case 'LOAD_CART':
      return { ...state, items: action.payload, isLoaded: true }

    default:
      return state
  }
}

// ==========================================
// Context
// ==========================================

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isLoaded: false,
  })

  // 追蹤前一個用戶 ID，用於偵測用戶變化
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // 監聽用戶變化，載入對應購物車
  useEffect(() => {
    const userId = user?.id ?? null
    const storageKey = getCartStorageKey(userId)

    // 跳過初始渲染（prevUserIdRef 為 undefined）
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId
    }

    // 用戶變化時載入對應購物車
    if (prevUserIdRef.current !== userId || !state.isLoaded) {
      prevUserIdRef.current = userId

      if (storageKey) {
        // 已登入：載入用戶專屬購物車
        try {
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            const items = JSON.parse(saved) as CartItem[]
            dispatch({ type: 'LOAD_CART', payload: items })
          } else {
            dispatch({ type: 'LOAD_CART', payload: [] })
          }
        } catch {
          dispatch({ type: 'LOAD_CART', payload: [] })
        }
      } else {
        // 未登入：顯示空購物車
        dispatch({ type: 'LOAD_CART', payload: [] })
      }
    }
  }, [user?.id, state.isLoaded])

  // 儲存到 localStorage（僅登入用戶）
  useEffect(() => {
    const userId = user?.id ?? null
    const storageKey = getCartStorageKey(userId)

    if (state.isLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(state.items))
    }
  }, [state.items, state.isLoaded, user?.id])

  // 新增商品
  const addItem = (product: Product, quantity = 1) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.productImages?.[0]?.storage_url,
      maxQuantity: product.availableStock ?? product.inventory,
    }
    dispatch({ type: 'ADD_ITEM', payload: cartItem })
  }

  // 移除商品
  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  // 更新數量
  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } })
  }

  // 清空購物車
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  // 取得商品數量
  const getItemQuantity = (productId: string) => {
    const item = state.items.find(i => i.id === productId)
    return item?.quantity ?? 0
  }

  // 計算項目總數
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

  // 計算小計
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 計算運費
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE

  // 計算總金額
  const total = subtotal + shippingFee

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isLoaded: state.isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        itemCount,
        subtotal,
        shippingFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
