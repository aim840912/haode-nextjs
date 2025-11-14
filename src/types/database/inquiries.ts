export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      inquiries: {
        Row: {
          activity_title: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          id: string
          inquiry_type: string | null
          is_read: boolean
          is_replied: boolean
          notes: string | null
          preferred_delivery_date: string | null
          read_at: string | null
          replied_at: string | null
          replied_by: string | null
          status: string | null
          total_estimated_amount: number | null
          updated_at: string | null
          user_id: string | null
          visit_date: string | null
          visitor_count: string | null
        }
        Insert: {
          activity_title?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          inquiry_type?: string | null
          is_read?: boolean
          is_replied?: boolean
          notes?: string | null
          preferred_delivery_date?: string | null
          read_at?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          total_estimated_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_date?: string | null
          visitor_count?: string | null
        }
        Update: {
          activity_title?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          inquiry_type?: string | null
          is_read?: boolean
          is_replied?: boolean
          notes?: string | null
          preferred_delivery_date?: string | null
          read_at?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          total_estimated_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          visit_date?: string | null
          visitor_count?: string | null
        }
        Relationships: []
      }
      inquiry_items: {
        Row: {
          created_at: string | null
          id: string
          inquiry_id: string | null
          notes: string | null
          product_category: string | null
          product_id: string
          product_name: string
          quantity: number
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          product_category?: string | null
          product_id: string
          product_name: string
          quantity: number
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          product_category?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'inquiry_items_inquiry_id_fkey'
            columns: ['inquiry_id']
            isOneToOne: false
            referencedRelation: 'inquiries'
            referencedColumns: ['id']
          },
        ]
      }
      inquiry_templates: {
        Row: {
          activity_title: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          description: string | null
          id: string
          inquiry_type: string
          is_active: boolean | null
          is_favorite: boolean | null
          items: Json | null
          last_used_at: string | null
          name: string
          notes: string | null
          preferred_delivery_date_pattern: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          visit_date_pattern: string | null
          visitor_count: string | null
        }
        Insert: {
          activity_title?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          description?: string | null
          id?: string
          inquiry_type?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          items?: Json | null
          last_used_at?: string | null
          name: string
          notes?: string | null
          preferred_delivery_date_pattern?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          visit_date_pattern?: string | null
          visitor_count?: string | null
        }
        Update: {
          activity_title?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          description?: string | null
          id?: string
          inquiry_type?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          items?: Json | null
          last_used_at?: string | null
          name?: string
          notes?: string | null
          preferred_delivery_date_pattern?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          visit_date_pattern?: string | null
          visitor_count?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      inquiry_stats: {
        Row: {
          average_amount: number | null
          avg_response_time_hours: number | null
          count: number | null
          status: string | null
          total_amount: number | null
          unread_count: number | null
          unreplied_count: number | null
        }
        Relationships: []
      }
      inquiry_templates_stats: {
        Row: {
          active_templates: number | null
          avg_usage_count: number | null
          favorite_templates: number | null
          last_template_used_at: string | null
          newest_template_created_at: string | null
          total_templates: number | null
          total_usage_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      daily_inquiry_stats: {
        Row: {
          avg_response_time_hours: number | null
          inquiry_date: string | null
          read_inquiries: number | null
          read_rate_percent: number | null
          replied_inquiries: number | null
          reply_rate_percent: number | null
          total_inquiries: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
