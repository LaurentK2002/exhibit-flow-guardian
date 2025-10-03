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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      case_activities: {
        Row: {
          activity_type: string
          case_id: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          case_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          case_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          analyst_id: string | null
          assigned_to: string | null
          case_notes: string | null
          case_number: string
          closed_date: string | null
          created_at: string | null
          description: string | null
          exhibit_officer_id: string | null
          id: string
          incident_date: string | null
          lab_number: string | null
          location: string | null
          opened_date: string | null
          priority: Database["public"]["Enums"]["case_priority"] | null
          status: Database["public"]["Enums"]["case_status"] | null
          supervisor_id: string | null
          suspect_name: string | null
          title: string
          updated_at: string | null
          victim_name: string | null
        }
        Insert: {
          analyst_id?: string | null
          assigned_to?: string | null
          case_notes?: string | null
          case_number: string
          closed_date?: string | null
          created_at?: string | null
          description?: string | null
          exhibit_officer_id?: string | null
          id?: string
          incident_date?: string | null
          lab_number?: string | null
          location?: string | null
          opened_date?: string | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          status?: Database["public"]["Enums"]["case_status"] | null
          supervisor_id?: string | null
          suspect_name?: string | null
          title: string
          updated_at?: string | null
          victim_name?: string | null
        }
        Update: {
          analyst_id?: string | null
          assigned_to?: string | null
          case_notes?: string | null
          case_number?: string
          closed_date?: string | null
          created_at?: string | null
          description?: string | null
          exhibit_officer_id?: string | null
          id?: string
          incident_date?: string | null
          lab_number?: string | null
          location?: string | null
          opened_date?: string | null
          priority?: Database["public"]["Enums"]["case_priority"] | null
          status?: Database["public"]["Enums"]["case_status"] | null
          supervisor_id?: string | null
          suspect_name?: string | null
          title?: string
          updated_at?: string | null
          victim_name?: string | null
        }
        Relationships: []
      }
      exhibits: {
        Row: {
          analysis_notes: string | null
          assigned_analyst: string | null
          brand: string | null
          case_id: string | null
          chain_of_custody: Json | null
          created_at: string | null
          description: string | null
          device_name: string
          evidence_files: Json | null
          exhibit_number: string
          exhibit_type: Database["public"]["Enums"]["exhibit_type"]
          id: string
          imei: string | null
          mac_address: string | null
          model: string | null
          received_by: string | null
          received_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["exhibit_status"] | null
          storage_location: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_notes?: string | null
          assigned_analyst?: string | null
          brand?: string | null
          case_id?: string | null
          chain_of_custody?: Json | null
          created_at?: string | null
          description?: string | null
          device_name: string
          evidence_files?: Json | null
          exhibit_number: string
          exhibit_type: Database["public"]["Enums"]["exhibit_type"]
          id?: string
          imei?: string | null
          mac_address?: string | null
          model?: string | null
          received_by?: string | null
          received_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["exhibit_status"] | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_notes?: string | null
          assigned_analyst?: string | null
          brand?: string | null
          case_id?: string | null
          chain_of_custody?: Json | null
          created_at?: string | null
          description?: string | null
          device_name?: string
          evidence_files?: Json | null
          exhibit_number?: string
          exhibit_type?: Database["public"]["Enums"]["exhibit_type"]
          id?: string
          imei?: string | null
          mac_address?: string | null
          model?: string | null
          received_by?: string | null
          received_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["exhibit_status"] | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exhibits_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          badge_number: string | null
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          badge_number?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          badge_number?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_submissions: {
        Row: {
          analyst_id: string
          case_id: string | null
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          report_title: string
          review_comments: string | null
          review_date: string | null
          reviewed_by: string | null
          status: string
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          analyst_id: string
          case_id?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          report_title: string
          review_comments?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          analyst_id?: string
          case_id?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          report_title?: string
          review_comments?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_submissions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          case_id: string | null
          content: string | null
          created_at: string | null
          exhibit_id: string | null
          file_path: string | null
          generated_by: string | null
          id: string
          is_final: boolean | null
          report_type: string
          reviewed_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          content?: string | null
          created_at?: string | null
          exhibit_id?: string | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          is_final?: boolean | null
          report_type: string
          reviewed_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          content?: string | null
          created_at?: string | null
          exhibit_id?: string | null
          file_path?: string | null
          generated_by?: string | null
          id?: string
          is_final?: boolean | null
          report_type?: string
          reviewed_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_exhibit_id_fkey"
            columns: ["exhibit_id"]
            isOneToOne: false
            referencedRelation: "exhibits"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_case_lab_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_department: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_profile_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mask_sensitive_fields: {
        Args: {
          profile_data: Json
          profile_owner_id: string
          viewer_role: string
        }
        Returns: Json
      }
      user_has_permission: {
        Args: { permission_name: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      case_priority: "low" | "medium" | "high" | "critical"
      case_status:
        | "open"
        | "under_investigation"
        | "pending_review"
        | "closed"
        | "archived"
      exhibit_status:
        | "received"
        | "in_analysis"
        | "analysis_complete"
        | "released"
        | "destroyed"
        | "archived"
      exhibit_type:
        | "mobile_device"
        | "computer"
        | "storage_media"
        | "network_device"
        | "other"
      user_role:
        | "investigator"
        | "forensic_analyst"
        | "supervisor"
        | "administrator"
        | "case_officer"
        | "admin"
        | "exhibit_officer"
        | "commanding_officer"
        | "analyst"
        | "officer_commanding_unit"
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
    Enums: {
      case_priority: ["low", "medium", "high", "critical"],
      case_status: [
        "open",
        "under_investigation",
        "pending_review",
        "closed",
        "archived",
      ],
      exhibit_status: [
        "received",
        "in_analysis",
        "analysis_complete",
        "released",
        "destroyed",
        "archived",
      ],
      exhibit_type: [
        "mobile_device",
        "computer",
        "storage_media",
        "network_device",
        "other",
      ],
      user_role: [
        "investigator",
        "forensic_analyst",
        "supervisor",
        "administrator",
        "case_officer",
        "admin",
        "exhibit_officer",
        "commanding_officer",
        "analyst",
        "officer_commanding_unit",
      ],
    },
  },
} as const
