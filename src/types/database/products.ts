export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          name: string
          price: number
          price_unit: string | null
          reserved_stock: number
          show_in_catalog: boolean
          stock: number | null
          unit_quantity: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          name: string
          price: number
          price_unit?: string | null
          reserved_stock?: number
          show_in_catalog?: boolean
          stock?: number | null
          unit_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          name?: string
          price?: number
          price_unit?: string | null
          reserved_stock?: number
          show_in_catalog?: boolean
          stock?: number | null
          unit_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_position: number | null
          entity_id: string
          file_path: string
          id: string
          metadata: Json | null
          module: string
          size: string
          storage_url: string
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_position?: number | null
          entity_id: string
          file_path: string
          id?: string
          metadata?: Json | null
          module: string
          size?: string
          storage_url: string
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_position?: number | null
          entity_id?: string
          file_path?: string
          id?: string
          metadata?: Json | null
          module?: string
          size?: string
          storage_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      products_with_images: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          images_data: Json | null
          is_active: boolean | null
          name: string | null
          price: number | null
          show_in_catalog: boolean | null
          stock: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      product_inventory_status: {
        Row: {
          available_stock: number | null
          can_purchase: boolean | null
          id: string | null
          name: string | null
          reserved_percentage: number | null
          reserved_stock: number | null
          total_stock: number | null
        }
        Insert: {
          available_stock?: never
          can_purchase?: never
          id?: string | null
          name?: string | null
          reserved_percentage?: never
          reserved_stock?: number | null
          total_stock?: number | null
        }
        Update: {
          available_stock?: never
          can_purchase?: never
          id?: string | null
          name?: string | null
          reserved_percentage?: never
          reserved_stock?: number | null
          total_stock?: number | null
        }
        Relationships: []
      }
      images_stats: {
        Row: {
          avg_file_size: number | null
          first_upload: string | null
          large_count: number | null
          last_upload: string | null
          medium_count: number | null
          module: string | null
          thumbnail_count: number | null
          total_entities: number | null
          total_images: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_product_with_images: {
        Args: { images_data?: Json; product_data: Json }
        Returns: Json
      }
      reserve_product_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      release_reserved_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      finalize_reserved_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      update_product_inventory: {
        Args: { p_product_id: string; p_quantity_change: number }
        Returns: undefined
      }
      update_image_positions: {
        Args: { image_positions: Json }
        Returns: undefined
      }
      cleanup_orphan_images: {
        Args: { target_module: string }
        Returns: {
          deleted_count: number
        }[]
      }
      get_entity_images: {
        Args: { p_entity_id: string; p_module: string }
        Returns: {
          alt_text: string
          created_at: string
          display_position: number
          file_path: string
          id: string
          metadata: Json
          size: string
          storage_url: string
        }[]
      }
      test_create_product_with_images: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
