import { AuditAction, ResourceType, UserRole } from './audit'
import { InquiryStatus, InquiryType } from './inquiry'

// Supabase 標準 JSON 類型
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: Json
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          address?: Json
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: Json
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          title: string
          address: string
          landmark: string | null
          phone: string | null
          line_id: string | null
          hours: string | null
          closed_days: string | null
          parking: string | null
          public_transport: string | null
          features: Json
          specialties: Json
          coordinates: Json
          image: string | null
          is_main: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          title: string
          address: string
          landmark?: string | null
          phone?: string | null
          line_id?: string | null
          hours?: string | null
          closed_days?: string | null
          parking?: string | null
          public_transport?: string | null
          features?: Json
          specialties?: Json
          coordinates?: Json
          image?: string | null
          is_main?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string
          address?: string
          landmark?: string | null
          phone?: string | null
          line_id?: string | null
          hours?: string | null
          closed_days?: string | null
          parking?: string | null
          public_transport?: string | null
          features?: Json
          specialties?: Json
          coordinates?: Json
          image?: string | null
          is_main?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          price_unit: string | null
          unit_quantity: number | null
          category: string
          image_url: string | null
          stock: number | null
          reserved_stock: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          price_unit?: string | null
          unit_quantity?: number | null
          category: string
          image_url?: string | null
          stock?: number | null
          reserved_stock?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          price_unit?: string | null
          unit_quantity?: number | null
          category?: string
          image_url?: string | null
          stock?: number | null
          reserved_stock?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          path: string
          alt: string | null
          position: number
          size: 'thumbnail' | 'medium' | 'large'
          width: number | null
          height: number | null
          file_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          path: string
          alt?: string | null
          position?: number
          size?: 'thumbnail' | 'medium' | 'large'
          width?: number | null
          height?: number | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          path?: string
          alt?: string | null
          position?: number
          size?: 'thumbnail' | 'medium' | 'large'
          width?: number | null
          height?: number | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_product_images_product_id'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      schedule: {
        Row: {
          id: string
          title: string
          location: string
          date: string
          time: string
          status: 'upcoming' | 'ongoing' | 'completed'
          products: string[]
          description: string
          contact: string
          special_offer: string | null
          weather_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          location: string
          date: string
          time: string
          status?: 'upcoming' | 'ongoing' | 'completed'
          products?: string[]
          description: string
          contact: string
          special_offer?: string | null
          weather_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          location?: string
          date?: string
          time?: string
          status?: 'upcoming' | 'ongoing' | 'completed'
          products?: string[]
          description?: string
          contact?: string
          special_offer?: string | null
          weather_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      moments: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category: string
          year: number
          is_featured: boolean | null
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          category: string
          year: number
          is_featured?: boolean | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          category?: string
          year?: number
          is_featured?: boolean | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          id: string
          user_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          status: InquiryStatus
          inquiry_type: InquiryType
          notes: string | null
          total_estimated_amount: number | null
          delivery_address: string | null
          preferred_delivery_date: string | null
          activity_title: string | null
          visit_date: string | null
          visitor_count: string | null
          is_read: boolean
          read_at: string | null
          is_replied: boolean
          replied_at: string | null
          replied_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          status?: InquiryStatus
          inquiry_type: InquiryType
          notes?: string | null
          total_estimated_amount?: number | null
          delivery_address?: string | null
          preferred_delivery_date?: string | null
          activity_title?: string | null
          visit_date?: string | null
          visitor_count?: string | null
          is_read?: boolean
          read_at?: string | null
          is_replied?: boolean
          replied_at?: string | null
          replied_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          status?: InquiryStatus
          inquiry_type?: InquiryType
          notes?: string | null
          total_estimated_amount?: number | null
          delivery_address?: string | null
          preferred_delivery_date?: string | null
          activity_title?: string | null
          visit_date?: string | null
          visitor_count?: string | null
          is_read?: boolean
          read_at?: string | null
          is_replied?: boolean
          replied_at?: string | null
          replied_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_items: {
        Row: {
          id: string
          inquiry_id: string
          product_id: string
          product_name: string
          product_category: string | null
          quantity: number
          unit_price: number | null
          total_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inquiry_id: string
          product_id: string
          product_name: string
          product_category?: string | null
          quantity: number
          unit_price?: number | null
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inquiry_id?: string
          product_id?: string
          product_name?: string
          product_category?: string | null
          quantity?: number
          unit_price?: number | null
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_email: string
          user_name: string | null
          user_role: UserRole | null
          action: AuditAction
          resource_type: ResourceType
          resource_id: string
          resource_details: Json
          previous_data: Json
          new_data: Json
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email: string
          user_name?: string | null
          user_role?: UserRole | null
          action: AuditAction
          resource_type: ResourceType
          resource_id: string
          resource_details?: Json
          previous_data?: Json
          new_data?: Json
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string
          user_name?: string | null
          user_role?: UserRole | null
          action?: AuditAction
          resource_type?: ResourceType
          resource_id?: string | null
          resource_details?: Json
          previous_data?: Json
          new_data?: Json
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      farm_tour: {
        Row: {
          id: string
          title: string
          start_month: number
          end_month: number
          price: number | null
          activities: string[]
          note: string
          image: string
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          start_month: number
          end_month: number
          price?: number | null
          activities?: string[]
          note?: string
          image: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_month?: number
          end_month?: number
          price?: number | null
          activities?: string[]
          note?: string
          image?: string
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          id: string
          module: string
          entity_id: string
          file_path: string
          storage_url: string
          size: string
          display_position: number
          alt_text: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module: string
          entity_id: string
          file_path: string
          storage_url: string
          size?: string
          display_position?: number
          alt_text?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module?: string
          entity_id?: string
          file_path?: string
          storage_url?: string
          size?: string
          display_position?: number
          alt_text?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_product_inventory: {
        Args: {
          p_product_id: string
          p_quantity_change: number
        }
        Returns: void
      }
      reserve_product_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          success: boolean
          error?: string
          product_id?: string
          available_stock?: number
          requested?: number
          shortfall?: number
          reserved_quantity?: number
          previous_reserved?: number
          new_reserved_stock?: number
          new_available_stock?: number
        }
      }
      release_reserved_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          success: boolean
          error?: string
          product_id?: string
          released_quantity?: number
          previous_reserved?: number
          new_reserved_stock?: number
        }
      }
      finalize_reserved_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: {
          success: boolean
          error?: string
          product_id?: string
          finalized_quantity?: number
          previous_stock?: number
          new_stock?: number
          previous_reserved?: number
          new_reserved_stock?: number
        }
      }
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
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
