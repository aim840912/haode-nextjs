export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4'
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          previous_data: Json | null
          resource_details: Json | null
          resource_id: string
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_email: string
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          previous_data?: Json | null
          resource_details?: Json | null
          resource_id: string
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_email: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          previous_data?: Json | null
          resource_details?: Json | null
          resource_id?: string
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      culture: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_featured: boolean | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          title?: string
          updated_at?: string
          year?: number | null
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
      location_id_mapping: {
        Row: {
          migrated_at: string | null
          new_uuid: string | null
          old_id: number | null
        }
        Insert: {
          migrated_at?: string | null
          new_uuid?: string | null
          old_id?: number | null
        }
        Update: {
          migrated_at?: string | null
          new_uuid?: string | null
          old_id?: number | null
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
      orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          estimated_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
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
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
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
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
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
      product_images: {
        Row: {
          alt: string | null
          created_at: string | null
          file_size: number | null
          height: number | null
          id: string
          path: string
          position: number
          product_id: string
          size: string
          updated_at: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          path: string
          position?: number
          product_id: string
          size?: string
          updated_at?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          path?: string
          position?: number
          product_id?: string
          size?: string
          updated_at?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_product_images_product_id'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_inventory_status'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_product_images_product_id'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_product_images_product_id'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products_with_images'
            referencedColumns: ['id']
          },
        ]
      }
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
      search_logs: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          ip_address: unknown
          result_count: number | null
          search_query: string
          search_table: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          result_count?: number | null
          search_query: string
          search_table: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          result_count?: number | null
          search_query?: string
          search_table?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      audit_stats: {
        Row: {
          action: string | null
          count: number | null
          date: string | null
          resource_type: string | null
          unique_users: number | null
          user_role: string | null
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
      resource_access_stats: {
        Row: {
          access_count: number | null
          actions_performed: string[] | null
          first_accessed: string | null
          last_accessed: string | null
          resource_id: string | null
          resource_type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
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
      analyze_search_performance: {
        Args: { table_name?: string }
        Returns: {
          description: string
          metric_name: string
          metric_value: string
        }[]
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_orphan_images: {
        Args: { target_module: string }
        Returns: {
          deleted_count: number
        }[]
      }
      create_product_with_images: {
        Args: { images_data?: Json; product_data: Json }
        Returns: Json
      }
      finalize_reserved_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      full_text_search_news: {
        Args: {
          lang_config?: string
          search_limit?: number
          search_offset?: number
          search_query: string
        }
        Returns: {
          author: string
          content: string
          created_at: string
          highlight: string
          id: string
          image_url: string
          matched_fields: string[]
          published_at: string
          rank: number
          tags: string[]
          title: string
          updated_at: string
        }[]
      }
      full_text_search_products: {
        Args: {
          lang_config?: string
          search_limit?: number
          search_offset?: number
          search_query: string
        }
        Returns: {
          category: string
          created_at: string
          description: string
          highlight: string
          id: string
          images: string[]
          is_on_sale: boolean
          matched_fields: string[]
          name: string
          original_price: number
          price: number
          primary_image_url: string
          rank: number
          thumbnail_url: string
          updated_at: string
        }[]
      }
      generate_order_number: { Args: never; Returns: string }
      get_email_by_phone: {
        Args: { phone_number: string }
        Returns: {
          email: string
          user_id: string
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
      get_popular_searches: {
        Args: { days_back?: number; result_limit?: number }
        Returns: {
          avg_execution_time: number
          avg_result_count: number
          last_searched: string
          search_count: number
          search_query: string
        }[]
      }
      get_resource_audit_history: {
        Args: {
          limit_count?: number
          target_resource_id: string
          target_resource_type: string
        }
        Returns: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          user_email: string
          user_name: string
          user_role: string
        }[]
      }
      get_search_suggestions: {
        Args: {
          partial_query: string
          suggestion_limit?: number
          target_table?: string
        }
        Returns: {
          suggestion: string
        }[]
      }
      get_user_audit_history: {
        Args: {
          limit_count?: number
          offset_count?: number
          target_user_id: string
        }
        Returns: {
          action: string
          created_at: string
          id: string
          resource_details: Json
          resource_id: string
          resource_type: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_valid_taiwan_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
      log_search_activity: {
        Args: {
          execution_time_ms?: number
          ip_address?: unknown
          result_count?: number
          search_query: string
          search_table: string
          user_agent?: string
          user_id?: string
        }
        Returns: string
      }
      release_reserved_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      reserve_product_inventory: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
      test_create_product_with_images: { Args: never; Returns: string }
      unaccent: { Args: { '': string }; Returns: string }
      update_image_positions: {
        Args: { image_positions: Json }
        Returns: undefined
      }
      update_product_inventory: {
        Args: { p_product_id: string; p_quantity_change: number }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
