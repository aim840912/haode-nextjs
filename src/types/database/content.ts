export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          type?: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      farm_tour: {
        Row: {
          activities: Json | null
          available: boolean | null
          created_at: string
          end_month: number | null
          id: string
          image: string | null
          note: string | null
          price: number | null
          start_month: number | null
          title: string
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          available?: boolean | null
          created_at?: string
          end_month?: number | null
          id?: string
          image?: string | null
          note?: string | null
          price?: number | null
          start_month?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          available?: boolean | null
          created_at?: string
          end_month?: number | null
          id?: string
          image?: string | null
          note?: string | null
          price?: number | null
          start_month?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dev_notes: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          contact: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          location: string
          products: Json | null
          special_offer: string | null
          status: string | null
          time: string | null
          title: string
          updated_at: string
          weather_note: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location: string
          products?: Json | null
          special_offer?: string | null
          status?: string | null
          time?: string | null
          title: string
          updated_at?: string
          weather_note?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string
          products?: Json | null
          special_offer?: string | null
          status?: string | null
          time?: string | null
          title?: string
          updated_at?: string
          weather_note?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          closed_days: string | null
          coordinates: Json | null
          created_at: string
          features: Json | null
          hours: string | null
          id: string
          image: string | null
          is_main: boolean | null
          landmark: string | null
          line_id: string | null
          name: string
          parking: string | null
          phone: string | null
          public_transport: string | null
          specialties: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          closed_days?: string | null
          coordinates?: Json | null
          created_at?: string
          features?: Json | null
          hours?: string | null
          id?: string
          image?: string | null
          is_main?: boolean | null
          landmark?: string | null
          line_id?: string | null
          name: string
          parking?: string | null
          phone?: string | null
          public_transport?: string | null
          specialties?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          closed_days?: string | null
          coordinates?: Json | null
          created_at?: string
          features?: Json | null
          hours?: string | null
          id?: string
          image?: string | null
          is_main?: boolean | null
          landmark?: string | null
          line_id?: string | null
          name?: string
          parking?: string | null
          phone?: string | null
          public_transport?: string | null
          specialties?: Json | null
          title?: string
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
