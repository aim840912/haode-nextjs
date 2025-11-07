/**
 * Service Layer Data Transfer Object (DTO) Type Definitions
 *
 * 定義所有服務層的 Create 和 Update DTO 類型
 * 用於替代服務中的 any 類型，提升類型安全性
 */

import type { OrderStatus, ShippingAddress } from './order'
import type { InquiryStatus, InquiryType } from './inquiry'
import type { ProductImage } from './product'

// ============================================
// Order DTOs
// ============================================

export interface CreateOrderItemDTO {
  productId: string
  quantity: number
  unitPrice?: number
  priceUnit?: string
  unitQuantity?: number
}

export interface CreateOrderDTO {
  userId: string
  items: CreateOrderItemDTO[]
  shippingAddress: ShippingAddress
  paymentMethod?: string
  notes?: string
  shippingFee?: number
  tax?: number
}

export interface UpdateOrderDTO {
  status?: OrderStatus
  shippingAddress?: Partial<ShippingAddress>
  paymentMethod?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId?: string
  notes?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  trackingNumber?: string
  shippingFee?: number
  tax?: number
}

// ============================================
// Inquiry DTOs
// ============================================

export interface CreateInquiryItemDTO {
  product_id: string
  product_name: string
  quantity: number
  unit?: string
  estimated_price?: number
  notes?: string
}

export interface CreateInquiryDTO {
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  inquiry_type: InquiryType
  notes?: string
  delivery_address?: string
  preferred_delivery_date?: string
  // 農場參觀相關
  activity_title?: string
  visit_date?: string
  visitor_count?: string
  // 詢問項目
  items?: CreateInquiryItemDTO[]
}

export interface UpdateInquiryDTO {
  status?: InquiryStatus
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  notes?: string
  total_estimated_amount?: number
  delivery_address?: string
  preferred_delivery_date?: string
  activity_title?: string
  visit_date?: string
  visitor_count?: string
  is_read?: boolean
  read_at?: string
  is_replied?: boolean
  replied_at?: string
  replied_by?: string
}

// ============================================
// Product DTOs
// ============================================

export interface CreateProductDTO {
  name: string
  description: string
  category: string
  price: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory: number
  isActive: boolean
}

export interface UpdateProductDTO {
  name?: string
  description?: string
  category?: string
  price?: number
  priceUnit?: string
  unitQuantity?: number
  originalPrice?: number
  isOnSale?: boolean
  saleEndDate?: string
  inventory?: number
  isActive?: boolean
  reservedStock?: number
}

// ============================================
// Product Image DTOs
// ============================================

export interface CreateProductImageDTO {
  entity_id: string // 產品 ID
  storage_url: string
  file_path: string
  alt_text?: string
  display_position: number
  size: 'thumbnail' | 'medium' | 'large'
  width?: number
  height?: number
  file_size?: number
  module: 'products'
}

export interface UpdateProductImageDTO {
  alt_text?: string
  display_position?: number
  storage_url?: string
  file_path?: string
}

// ============================================
// Site Settings DTOs
// ============================================

export interface UpdateSiteSettingsDTO {
  key: string
  value: string | number | boolean | object
  description?: string
}

export interface CreateSiteSettingsDTO {
  key: string
  value: string | number | boolean | object
  category?: string
  description?: string
  is_public?: boolean
}

// ============================================
// Location DTOs
// ============================================

export interface CreateLocationDTO {
  name: string
  address: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  description?: string
  latitude?: number
  longitude?: number
  isActive: boolean
}

export interface UpdateLocationDTO {
  name?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  description?: string
  latitude?: number
  longitude?: number
  isActive?: boolean
}

// ============================================
// Farm Tour DTOs
// ============================================

export interface CreateFarmTourDTO {
  title: string
  description: string
  date: string
  duration: number // 分鐘
  maxParticipants: number
  price: number
  location_id?: string
  isActive: boolean
  images?: string[]
}

export interface UpdateFarmTourDTO {
  title?: string
  description?: string
  date?: string
  duration?: number
  maxParticipants?: number
  price?: number
  location_id?: string
  isActive?: boolean
  images?: string[]
  currentParticipants?: number
}

// ============================================
// Schedule DTOs
// ============================================

export interface CreateScheduleDTO {
  title: string
  description?: string
  start_date: string
  end_date: string
  location_id?: string
  max_participants?: number
  current_participants?: number
  status: 'draft' | 'published' | 'cancelled'
  is_active: boolean
}

export interface UpdateScheduleDTO {
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  location_id?: string
  max_participants?: number
  current_participants?: number
  status?: 'draft' | 'published' | 'cancelled'
  is_active?: boolean
}

// ============================================
// User Interests DTOs
// ============================================

export interface UpdateUserInterestsDTO {
  user_id: string
  interested_products?: string[] // 產品 IDs
  interested_farm_tours?: string[] // 農場參觀 IDs
  interested_categories?: string[] // 產品分類
  preferences?: Record<string, unknown>
}

// ============================================
// Audit Log DTOs (optional, for completeness)
// ============================================

export interface CreateAuditLogDTO {
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}
