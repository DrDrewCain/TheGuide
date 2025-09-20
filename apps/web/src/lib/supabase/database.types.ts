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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      decision_options: {
        Row: {
          cons: string[] | null
          created_at: string | null
          decision_id: string
          description: string | null
          id: string
          parameters: Json | null
          pros: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cons?: string[] | null
          created_at?: string | null
          decision_id: string
          description?: string | null
          id?: string
          parameters?: Json | null
          pros?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cons?: string[] | null
          created_at?: string | null
          decision_id?: string
          description?: string | null
          id?: string
          parameters?: Json | null
          pros?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_options_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          constraints: Json | null
          created_at: string | null
          decision_deadline: string | null
          description: string | null
          id: string
          implemented_at: string | null
          ip_address: unknown | null
          parameters: Json | null
          search_vector: unknown | null
          status: Database["public"]["Enums"]["decision_status"] | null
          title: string
          type: Database["public"]["Enums"]["decision_type"]
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          constraints?: Json | null
          created_at?: string | null
          decision_deadline?: string | null
          description?: string | null
          id?: string
          implemented_at?: string | null
          ip_address?: unknown | null
          parameters?: Json | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["decision_status"] | null
          title: string
          type: Database["public"]["Enums"]["decision_type"]
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          constraints?: Json | null
          created_at?: string | null
          decision_deadline?: string | null
          description?: string | null
          id?: string
          implemented_at?: string | null
          ip_address?: unknown | null
          parameters?: Json | null
          search_vector?: unknown | null
          status?: Database["public"]["Enums"]["decision_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["decision_type"]
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          key: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
          key: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          key?: string
          type?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          aggregate_metrics: Json | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string | null
          decision_id: string
          error_message: string | null
          id: string
          iterations: number | null
          job_id: string | null
          metadata: Json | null
          option_id: string
          progress: number | null
          results: Json | null
          scenarios: Json | null
          sensitivity_analysis: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["simulation_status"] | null
          updated_at: string | null
        }
        Insert: {
          aggregate_metrics?: Json | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          decision_id: string
          error_message?: string | null
          id?: string
          iterations?: number | null
          job_id?: string | null
          metadata?: Json | null
          option_id: string
          progress?: number | null
          results?: Json | null
          scenarios?: Json | null
          sensitivity_analysis?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"] | null
          updated_at?: string | null
        }
        Update: {
          aggregate_metrics?: Json | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          decision_id?: string
          error_message?: string | null
          id?: string
          iterations?: number | null
          job_id?: string | null
          metadata?: Json | null
          option_id?: string
          progress?: number | null
          results?: Json | null
          scenarios?: Json | null
          sensitivity_analysis?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["simulation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "decision_options"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          current_job_role: string | null
          dependents: number | null
          financial_data: Json | null
          id: string
          industry: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          onboarding_version: number | null
          preferences: Json | null
          salary: number | null
          state: string | null
          updated_at: string | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          current_job_role?: string | null
          dependents?: number | null
          financial_data?: Json | null
          id: string
          industry?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_version?: number | null
          preferences?: Json | null
          salary?: number | null
          state?: string | null
          updated_at?: string | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          age?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          current_job_role?: string | null
          dependents?: number | null
          financial_data?: Json | null
          id?: string
          industry?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          onboarding_version?: number | null
          preferences?: Json | null
          salary?: number | null
          state?: string | null
          updated_at?: string | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      decision_analytics: {
        Row: {
          completion_rate: number | null
          decision_count: number | null
          month: string | null
          simulation_count: number | null
          type: Database["public"]["Enums"]["decision_type"] | null
          user_id: string | null
        }
        Relationships: []
      }
      user_decision_stats: {
        Row: {
          avg_simulation_time: number | null
          completed_decisions: number | null
          successful_simulations: number | null
          total_decisions: number | null
          total_simulations: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_recent_decisions: {
        Args: { limit_count?: number; user_uuid: string }
        Returns: {
          created_at: string
          id: string
          option_count: number
          simulation_count: number
          status: Database["public"]["Enums"]["decision_status"]
          title: string
          type: Database["public"]["Enums"]["decision_type"]
        }[]
      }
      refresh_decision_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      decision_status:
        | "draft"
        | "analyzing"
        | "simulated"
        | "decided"
        | "implemented"
        | "archived"
      decision_type:
        | "career_change"
        | "job_offer"
        | "relocation"
        | "education"
        | "home_purchase"
        | "investment"
        | "family_planning"
        | "retirement"
        | "business_startup"
      marital_status: "single" | "married" | "divorced" | "widowed"
      simulation_status: "pending" | "running" | "completed" | "failed"
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
      decision_status: [
        "draft",
        "analyzing",
        "simulated",
        "decided",
        "implemented",
        "archived",
      ],
      decision_type: [
        "career_change",
        "job_offer",
        "relocation",
        "education",
        "home_purchase",
        "investment",
        "family_planning",
        "retirement",
        "business_startup",
      ],
      marital_status: ["single", "married", "divorced", "widowed"],
      simulation_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const
