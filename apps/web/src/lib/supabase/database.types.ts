export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          age: number | null
          city: string | null
          state: string | null
          country: string | null
          zip_code: string | null
          marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
          dependents: number
          current_job_role: string | null
          industry: string | null
          company: string | null
          years_experience: number | null
          salary: number | null
          financial_data: Json
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          age?: number | null
          city?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null
          dependents?: number
          current_job_role?: string | null
          industry?: string | null
          company?: string | null
          years_experience?: number | null
          salary?: number | null
          financial_data?: Json
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          age?: number | null
          city?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null
          dependents?: number
          current_job_role?: string | null
          industry?: string | null
          company?: string | null
          years_experience?: number | null
          salary?: number | null
          financial_data?: Json
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      decisions: {
        Row: {
          id: string
          user_id: string
          type:
            | 'career_change'
            | 'job_offer'
            | 'relocation'
            | 'education'
            | 'home_purchase'
            | 'investment'
            | 'family_planning'
            | 'retirement'
            | 'business_startup'
          title: string
          description: string | null
          status: 'draft' | 'analyzing' | 'simulated' | 'decided' | 'implemented' | 'archived'
          parameters: Json
          constraints: Json
          decision_deadline: string | null
          implemented_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type:
            | 'career_change'
            | 'job_offer'
            | 'relocation'
            | 'education'
            | 'home_purchase'
            | 'investment'
            | 'family_planning'
            | 'retirement'
            | 'business_startup'
          title: string
          description?: string | null
          status?: 'draft' | 'analyzing' | 'simulated' | 'decided' | 'implemented' | 'archived'
          parameters?: Json
          constraints?: Json
          decision_deadline?: string | null
          implemented_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?:
            | 'career_change'
            | 'job_offer'
            | 'relocation'
            | 'education'
            | 'home_purchase'
            | 'investment'
            | 'family_planning'
            | 'retirement'
            | 'business_startup'
          title?: string
          description?: string | null
          status?: 'draft' | 'analyzing' | 'simulated' | 'decided' | 'implemented' | 'archived'
          parameters?: Json
          constraints?: Json
          decision_deadline?: string | null
          implemented_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      decision_options: {
        Row: {
          id: string
          decision_id: string
          title: string
          description: string | null
          parameters: Json
          pros: string[]
          cons: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          title: string
          description?: string | null
          parameters?: Json
          pros?: string[]
          cons?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          title?: string
          description?: string | null
          parameters?: Json
          pros?: string[]
          cons?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      simulations: {
        Row: {
          id: string
          decision_id: string
          option_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          job_id: string | null
          iterations: number
          results: Json | null
          aggregate_metrics: Json | null
          progress: number | null
          current_iteration: number | null
          sensitivity_analysis: Json | null
          error_message: string | null
          cost_estimate: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          decision_id: string
          option_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          job_id?: string | null
          iterations?: number
          results?: Json | null
          aggregate_metrics?: Json | null
          progress?: number | null
          current_iteration?: number | null
          sensitivity_analysis?: Json | null
          error_message?: string | null
          cost_estimate?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          decision_id?: string
          option_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          job_id?: string | null
          iterations?: number
          results?: Json | null
          aggregate_metrics?: Json | null
          progress?: number | null
          current_iteration?: number | null
          sensitivity_analysis?: Json | null
          error_message?: string | null
          cost_estimate?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      market_data_cache: {
        Row: {
          id: string
          symbol: string
          data_type: string
          data: Json
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          data_type: string
          data: Json
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          data_type?: string
          data?: Json
          expires_at?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      user_decision_stats: {
        Row: {
          user_id: string | null
          total_decisions: number | null
          completed_decisions: number | null
          total_simulations: number | null
          successful_simulations: number | null
          avg_simulation_time: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      decision_type:
        | 'career_change'
        | 'job_offer'
        | 'relocation'
        | 'education'
        | 'home_purchase'
        | 'investment'
        | 'family_planning'
        | 'retirement'
        | 'business_startup'
      decision_status: 'draft' | 'analyzing' | 'simulated' | 'decided' | 'implemented' | 'archived'
      simulation_status: 'pending' | 'running' | 'completed' | 'failed'
      marital_status: 'single' | 'married' | 'divorced' | 'widowed'
    }
  }
}
