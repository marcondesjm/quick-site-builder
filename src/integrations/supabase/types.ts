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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          property_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          property_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          property_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          media_type: string | null
          media_url: string | null
          property_id: string | null
          property_name: string
          protocol_number: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          property_id?: string | null
          property_name: string
          protocol_number?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          property_id?: string | null
          property_name?: string
          protocol_number?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_responses: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_enabled: boolean | null
          keywords: string[]
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          keywords: string[]
          response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          keywords?: string[]
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_icons: {
        Row: {
          created_at: string
          display_order: number | null
          icon_url: string
          id: string
          name: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon_url: string
          id?: string
          name: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon_url?: string
          id?: string
          name?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: string
          image_url: string | null
          is_online: boolean | null
          name: string
          updated_at: string
          user_id: string
          visitor_always_connected: boolean | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_online?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          visitor_always_connected?: boolean | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_online?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          visitor_always_connected?: boolean | null
        }
        Relationships: []
      }
      property_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          property_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          property_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          property_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      property_members: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          property_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          property_id: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          property_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          keys: Json
          p256dh: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          p256dh?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          p256dh?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vapid_keys: {
        Row: {
          created_at: string | null
          id: string
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          audio_message_url: string | null
          created_at: string
          ended_at: string | null
          id: string
          meet_link: string | null
          owner_id: string
          owner_joined: boolean | null
          owner_status_message: string | null
          owner_text_message: string | null
          property_id: string | null
          property_name: string
          protocol_number: string | null
          room_name: string
          status: string
          visitor_audio_url: string | null
          visitor_joined: boolean | null
          visitor_text_message: string | null
        }
        Insert: {
          audio_message_url?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          meet_link?: string | null
          owner_id: string
          owner_joined?: boolean | null
          owner_status_message?: string | null
          owner_text_message?: string | null
          property_id?: string | null
          property_name: string
          protocol_number?: string | null
          room_name: string
          status?: string
          visitor_audio_url?: string | null
          visitor_joined?: boolean | null
          visitor_text_message?: string | null
        }
        Update: {
          audio_message_url?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          meet_link?: string | null
          owner_id?: string
          owner_joined?: boolean | null
          owner_status_message?: string | null
          owner_text_message?: string | null
          property_id?: string | null
          property_name?: string
          protocol_number?: string | null
          room_name?: string
          status?: string
          visitor_audio_url?: string | null
          visitor_joined?: boolean | null
          visitor_text_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
