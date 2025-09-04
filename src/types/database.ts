import { InquiryStatus, InquiryType } from './inquiry'
import { AuditAction, ResourceType, UserRole } from './audit'

// 定義 JSONB 類型
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: JsonValue // JSONB type
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          address?: JsonValue
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: JsonValue
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          stock: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          stock?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          stock?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
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
          resource_details: JsonValue
          previous_data: JsonValue
          new_data: JsonValue
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          metadata: JsonValue
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
          resource_details?: JsonValue
          previous_data?: JsonValue
          new_data?: JsonValue
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: JsonValue
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
          resource_details?: JsonValue
          previous_data?: JsonValue
          new_data?: JsonValue
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: JsonValue
          created_at?: string
        }
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
      }
      // 其他表的類型定義...
      locations: {
        Row: {
          id: number
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
          features: JsonValue
          specialties: JsonValue
          coordinates: JsonValue
          image: string | null
          is_main: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
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
          features?: JsonValue
          specialties?: JsonValue
          coordinates?: JsonValue
          image?: string | null
          is_main?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
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
          features?: JsonValue
          specialties?: JsonValue
          coordinates?: JsonValue
          image?: string | null
          is_main?: boolean | null
          created_at?: string
          updated_at?: string
        }
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
      }
    }
    Views: {
      audit_stats: {
        Row: {
          action: AuditAction
          resource_type: ResourceType
          user_role: UserRole | null
          count: number
          unique_users: number
          date: string
        }
      }
      user_activity_stats: {
        Row: {
          user_id: string | null
          user_email: string
          user_name: string | null
          user_role: UserRole | null
          total_actions: number
          view_count: number
          update_count: number
          delete_count: number
          last_activity: string
          first_activity: string
        }
      }
      resource_access_stats: {
        Row: {
          resource_type: ResourceType
          resource_id: string
          access_count: number
          unique_users: number
          actions_performed: AuditAction[]
          last_accessed: string
          first_accessed: string
        }
      }
    }
    Functions: {
      get_user_audit_history: {
        Args: {
          target_user_id: string
          limit_count?: number
          offset_count?: number
        }
        Returns: Array<{
          id: string
          action: AuditAction
          resource_type: ResourceType
          resource_id: string
          resource_details: JsonValue
          created_at: string
        }>
      }
      get_resource_audit_history: {
        Args: {
          target_resource_type: ResourceType
          target_resource_id: string
          limit_count?: number
        }
        Returns: Array<{
          id: string
          user_email: string
          user_name: string | null
          user_role: UserRole | null
          action: AuditAction
          created_at: string
          ip_address: string | null
          metadata: JsonValue
        }>
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
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
