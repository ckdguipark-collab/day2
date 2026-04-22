export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      brick_master: {
        Row: {
          brick_code: string
          brick_name_k: string | null
          customer_code: string | null
          division: string | null
          employee_id: number | null
          hospital_name: string
          hospital_type: string | null
          manager_name: string | null
          team: string | null
        }
        Insert: {
          brick_code: string
          brick_name_k?: string | null
          customer_code?: string | null
          division?: string | null
          employee_id?: number | null
          hospital_name: string
          hospital_type?: string | null
          manager_name?: string | null
          team?: string | null
        }
        Update: {
          brick_code?: string
          brick_name_k?: string | null
          customer_code?: string | null
          division?: string | null
          employee_id?: number | null
          hospital_name?: string
          hospital_type?: string | null
          manager_name?: string | null
          team?: string | null
        }
        Relationships: []
      }
      monthly_ddd: {
        Row: {
          brick_code: string
          ddd_qty: number
          id: string
          ingredient_market: string
          manufacturer: string | null
          our_product: string | null
          pack: string | null
          product_brand: string
          product_type: string | null
          upload_id: string | null
          year_month: string
        }
        Insert: {
          brick_code: string
          ddd_qty: number
          id?: string
          ingredient_market: string
          manufacturer?: string | null
          our_product?: string | null
          pack?: string | null
          product_brand: string
          product_type?: string | null
          upload_id?: string | null
          year_month: string
        }
        Update: {
          brick_code?: string
          ddd_qty?: number
          id?: string
          ingredient_market?: string
          manufacturer?: string | null
          our_product?: string | null
          pack?: string | null
          product_brand?: string
          product_type?: string | null
          upload_id?: string | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_ddd_brick_code_fkey"
            columns: ["brick_code"]
            isOneToOne: false
            referencedRelation: "brick_master"
            referencedColumns: ["brick_code"]
          },
          {
            foreignKeyName: "monthly_ddd_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          error_message: string | null
          file_name: string
          id: string
          row_count: number | null
          status: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          error_message?: string | null
          file_name: string
          id?: string
          row_count?: number | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          error_message?: string | null
          file_name?: string
          id?: string
          row_count?: number | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_division_market_share: {
        Row: {
          division: string | null
          ingredient_market: string | null
          market_share_pct: number | null
          our_product: string | null
          product_brand: string | null
          product_type: string | null
          total_ddd: number | null
          year_month: string | null
        }
        Relationships: []
      }
      v_hospital_market_share: {
        Row: {
          brick_code: string | null
          division: string | null
          hospital_name: string | null
          ingredient_market: string | null
          market_share_pct: number | null
          our_product: string | null
          product_brand: string | null
          product_type: string | null
          total_ddd: number | null
          year_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_ddd_brick_code_fkey"
            columns: ["brick_code"]
            isOneToOne: false
            referencedRelation: "brick_master"
            referencedColumns: ["brick_code"]
          },
        ]
      }
    }
    Functions: {
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
