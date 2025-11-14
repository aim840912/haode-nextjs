export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          address: Json | null
          created_at: string
          id: string
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_user_interests_product'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_inventory_status'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_user_interests_product'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_user_interests_product'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products_with_images'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      user_activity_stats: {
        Row: {
          delete_count: number | null
          first_activity: string | null
          last_activity: string | null
          total_actions: number | null
          update_count: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
          view_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_email_by_phone: {
        Args: { phone_number: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      is_valid_taiwan_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
