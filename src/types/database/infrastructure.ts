export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
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
    }
    Functions: {
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
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
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
      analyze_search_performance: {
        Args: { table_name?: string }
        Returns: {
          description: string
          metric_name: string
          metric_value: string
        }[]
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
      unaccent: { Args: { '': string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
