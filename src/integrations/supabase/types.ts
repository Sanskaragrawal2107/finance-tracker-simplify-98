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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: string
          site_id: string | null
          status: string
          supervisor_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: string
          site_id?: string | null
          status: string
          supervisor_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          site_id?: string | null
          status?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      funds_received: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          method: string
          reference: string | null
          site_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          method: string
          reference?: string | null
          site_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          method?: string
          reference?: string | null
          site_id?: string | null
        }
        Relationships: [
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
          amount: number
          approver_type: string | null
          bank_details: Json | null
          bill_url: string | null
          created_at: string | null
          created_by: string | null
          date: string
          gross_amount: number | null
          gst_percentage: number | null
          id: string
          invoice_image_url: string | null
          invoice_number: string
          material: string | null
          net_amount: number
          party_id: string | null
          party_name: string | null
          payment_status: string
          quantity: number | null
          rate: number | null
          site_id: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          approver_type?: string | null
          bank_details?: Json | null
          bill_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          gross_amount?: number | null
          gst_percentage?: number | null
          id?: string
          invoice_image_url?: string | null
          invoice_number: string
          material?: string | null
          net_amount: number
          party_id?: string | null
          party_name?: string | null
          payment_status?: string
          quantity?: number | null
          rate?: number | null
          site_id?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          approver_type?: string | null
          bank_details?: Json | null
          bill_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          gross_amount?: number | null
          gst_percentage?: number | null
          id?: string
          invoice_image_url?: string | null
          invoice_number?: string
          material?: string | null
          net_amount?: number
          party_id?: string | null
          party_name?: string | null
          payment_status?: string
          quantity?: number | null
          rate?: number | null
          site_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          completion_date: string | null
          created_at: string | null
          funds: number | null
          id: string
          is_completed: boolean | null
          job_name: string
          name: string
          pos_no: string
          start_date: string
          supervisor_id: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          funds?: number | null
          id?: string
          is_completed?: boolean | null
          job_name: string
          name: string
          pos_no: string
          start_date: string
          supervisor_id?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          funds?: number | null
          id?: string
          is_completed?: boolean | null
          job_name?: string
          name?: string
          pos_no?: string
          start_date?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
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
