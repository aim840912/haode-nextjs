// 修正的 Database 類型定義
// 基於 Supabase 標準格式

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
          features: Json
          specialties: Json
          coordinates: Json
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
          features?: Json
          specialties?: Json
          coordinates?: Json
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
    }
    Views: {
      [_ in never]: never
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