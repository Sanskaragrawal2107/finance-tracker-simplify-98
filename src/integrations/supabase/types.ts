export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      advances: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          date: string
          id: string
          purpose: string
          recipient_id: string | null
          recipient_name: string
          recipient_type: string
          remarks: string | null
          site_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          purpose: string
          recipient_id?: string | null
          recipient_name: string
          recipient_type: string
          remarks?: string | null
          site_id?: string | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          purpose?: string
          recipient_id?: string | null
          recipient_name?: string
          recipient_type?: string
          remarks?: string | null
          site_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "advances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_financial_summaries"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "advances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          site_id: string | null
          status: string
          supervisor_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          id?: string
          site_id?: string | null
          status: string
          supervisor_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          site_id?: string | null
          status?: string
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_financial_summaries"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      funds_received: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          method: string | null
          reference: string | null
          site_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          method?: string | null
          reference?: string | null
          site_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          reference?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funds_received_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_financial_summaries"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "funds_received_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          approver_type: string | null
          bank_details: Json
          bill_url: string | null
          created_at: string
          created_by: string | null
          date: string
          gross_amount: number
          gst_percentage: number
          id: string
          invoice_image_url: string | null
          invoice_number: string | null
          material: string
          net_amount: number
          party_id: string
          party_name: string
          payment_status: string
          quantity: number
          rate: number
          site_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount?: number | null
          approver_type?: string | null
          bank_details: Json
          bill_url?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          gross_amount: number
          gst_percentage: number
          id?: string
          invoice_image_url?: string | null
          invoice_number?: string | null
          material: string
          net_amount: number
          party_id: string
          party_name: string
          payment_status: string
          quantity: number
          rate: number
          site_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number | null
          approver_type?: string | null
          bank_details?: Json
          bill_url?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          gross_amount?: number
          gst_percentage?: number
          id?: string
          invoice_image_url?: string | null
          invoice_number?: string | null
          material?: string
          net_amount?: number
          party_id?: string
          party_name?: string
          payment_status?: string
          quantity?: number
          rate?: number
          site_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_financial_summaries"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          completion_date: string | null
          created_at: string
          funds: number | null
          id: string
          is_completed: boolean
          job_name: string
          name: string
          pos_no: string
          start_date: string
          supervisor_id: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          funds?: number | null
          id?: string
          is_completed?: boolean
          job_name: string
          name: string
          pos_no: string
          start_date: string
          supervisor_id: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          funds?: number | null
          id?: string
          is_completed?: boolean
          job_name?: string
          name?: string
          pos_no?: string
          start_date?: string
          supervisor_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      site_financial_summaries: {
        Row: {
          invoices_paid: number | null
          pending_invoices: number | null
          site_id: string | null
          site_name: string | null
          supervisor_id: string | null
          total_advances: number | null
          total_debits_to_worker: number | null
          total_expenses: number | null
          total_funds_received: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_site_supervisor_id: {
        Args: {
          site_id: string
        }
        Returns: string
      }
      get_supervisor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "supervisor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
