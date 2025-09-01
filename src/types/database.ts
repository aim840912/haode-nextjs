export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: any // JSONB type
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          address?: any
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: any
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
          user_role: string | null
          action: string
          resource_type: string
          resource_id: string | null
          resource_details: any
          previous_data: any
          new_data: any
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email: string
          user_name?: string | null
          user_role?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          resource_details?: any
          previous_data?: any
          new_data?: any
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string
          user_name?: string | null
          user_role?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          resource_details?: any
          previous_data?: any
          new_data?: any
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          metadata?: any
          created_at?: string
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
          features: any
          specialties: any
          coordinates: any
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
          features?: any
          specialties?: any
          coordinates?: any
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
          features?: any
          specialties?: any
          coordinates?: any
          image?: string | null
          is_main?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}