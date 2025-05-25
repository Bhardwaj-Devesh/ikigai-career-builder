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
      ikigai_analytics: {
        Row: {
          action_plan: Json | null
          career_recommendations: Json | null
          competitor_analysis: Json | null
          created_at: string
          id: string
          ikigai_response_id: string
          market_analysis: Json | null
          mission_score: number | null
          passion_score: number | null
          profession_score: number | null
          skill_analysis: Json | null
          vocation_score: number | null
        }
        Insert: {
          action_plan?: Json | null
          career_recommendations?: Json | null
          competitor_analysis?: Json | null
          created_at?: string
          id?: string
          ikigai_response_id: string
          market_analysis?: Json | null
          mission_score?: number | null
          passion_score?: number | null
          profession_score?: number | null
          skill_analysis?: Json | null
          vocation_score?: number | null
        }
        Update: {
          action_plan?: Json | null
          career_recommendations?: Json | null
          competitor_analysis?: Json | null
          created_at?: string
          id?: string
          ikigai_response_id?: string
          market_analysis?: Json | null
          mission_score?: number | null
          passion_score?: number | null
          profession_score?: number | null
          skill_analysis?: Json | null
          vocation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ikigai_analytics_ikigai_response_id_fkey"
            columns: ["ikigai_response_id"]
            isOneToOne: false
            referencedRelation: "ikigai_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      ikigai_reports: {
        Row: {
          generated_at: string
          id: string
          ikigai_response_id: string
          report_data: Json
          report_type: string
        }
        Insert: {
          generated_at?: string
          id?: string
          ikigai_response_id: string
          report_data: Json
          report_type?: string
        }
        Update: {
          generated_at?: string
          id?: string
          ikigai_response_id?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ikigai_reports_ikigai_response_id_fkey"
            columns: ["ikigai_response_id"]
            isOneToOne: false
            referencedRelation: "ikigai_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      ikigai_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          good_at: string | null
          id: string
          love: string | null
          paid_for: string | null
          updated_at: string
          user_id: string
          world_needs: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          good_at?: string | null
          id?: string
          love?: string | null
          paid_for?: string | null
          updated_at?: string
          user_id: string
          world_needs?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          good_at?: string | null
          id?: string
          love?: string | null
          paid_for?: string | null
          updated_at?: string
          user_id?: string
          world_needs?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
