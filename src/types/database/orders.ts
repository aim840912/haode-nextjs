export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          estimated_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_bank_code: string | null
          payment_expire_date: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          payment_time: string | null
          payment_trade_no: string | null
          payment_va_account: string | null
          shipping_address: Json
          shipping_fee: number
          status: string
          subtotal: number
          tax: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_bank_code?: string | null
          payment_expire_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_time?: string | null
          payment_trade_no?: string | null
          payment_va_account?: string | null
          shipping_address: Json
          shipping_fee?: number
          status?: string
          subtotal?: number
          tax?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_bank_code?: string | null
          payment_expire_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_time?: string | null
          payment_trade_no?: string | null
          payment_va_account?: string | null
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          subtotal?: number
          tax?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_unit: string | null
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          unit_quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_unit?: string | null
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          unit_quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_unit?: string | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          unit_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_inventory_status'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products_with_images'
            referencedColumns: ['id']
          },
        ]
      }
      payment_logs: {
        Row: {
          id: string
          order_id: string | null
          trade_no: string | null
          merchant_order_no: string | null
          status: string
          message: string | null
          amount: number
          payment_type: string | null
          bank_code: string | null
          raw_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          trade_no?: string | null
          merchant_order_no?: string | null
          status: string
          message?: string | null
          amount: number
          payment_type?: string | null
          bank_code?: string | null
          raw_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          trade_no?: string | null
          merchant_order_no?: string | null
          status?: string
          message?: string | null
          amount?: number
          payment_type?: string | null
          bank_code?: string | null
          raw_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payment_logs_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      order_summary_view: {
        Row: {
          cancelled_orders: number | null
          delivered_orders: number | null
          pending_orders: number | null
          processing_orders: number | null
          total_amount: number | null
          total_orders: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      update_order_payment_status: {
        Args: {
          p_order_id: string
          p_status: string
          p_trade_no?: string
          p_payment_time?: string
          p_bank_code?: string
          p_va_account?: string
          p_expire_date?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
