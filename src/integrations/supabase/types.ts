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
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          accepted_at: string | null
          created_at: string
          followed_id: string
          follower_id: string
          status: Database["public"]["Enums"]["follow_status"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          followed_id: string
          follower_id: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          followed_id?: string
          follower_id?: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          image_url: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_image: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      narrativas: {
        Row: {
          autor_id: string
          bloques: Json
          created_at: string
          fecha_publicacion: string
          id: string
          titulo: string
          updated_at: string
          year_section: string
        }
        Insert: {
          autor_id: string
          bloques: Json
          created_at?: string
          fecha_publicacion?: string
          id?: string
          titulo: string
          updated_at?: string
          year_section: string
        }
        Update: {
          autor_id?: string
          bloques?: Json
          created_at?: string
          fecha_publicacion?: string
          id?: string
          titulo?: string
          updated_at?: string
          year_section?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          data: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          type?: string
        }
        Relationships: []
      }
      novedades: {
        Row: {
          activa: boolean | null
          creada_por: string | null
          created_at: string | null
          descripcion: string
          etiqueta: string
          href: string
          id: string
          referencia_id: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          creada_por?: string | null
          created_at?: string | null
          descripcion: string
          etiqueta: string
          href: string
          id?: string
          referencia_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          creada_por?: string | null
          created_at?: string | null
          descripcion?: string
          etiqueta?: string
          href?: string
          id?: string
          referencia_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          comunidad_rovers: string | null
          created_at: string
          edad: number | null
          email: string | null
          email_verified: boolean | null
          equipo_pioneros: string | null
          fecha_nacimiento: string | null
          id: string
          is_public: boolean | null
          nombre_completo: string
          patrulla: string | null
          rama_que_educa: string | null
          rol_adulto: string | null
          role: string | null
          seisena: string | null
          telefono: string
          updated_at: string
          user_id: string
          username: string | null
          username_updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          comunidad_rovers?: string | null
          created_at?: string
          edad?: number | null
          email?: string | null
          email_verified?: boolean | null
          equipo_pioneros?: string | null
          fecha_nacimiento?: string | null
          id?: string
          is_public?: boolean | null
          nombre_completo: string
          patrulla?: string | null
          rama_que_educa?: string | null
          rol_adulto?: string | null
          role?: string | null
          seisena?: string | null
          telefono: string
          updated_at?: string
          user_id: string
          username?: string | null
          username_updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          comunidad_rovers?: string | null
          created_at?: string
          edad?: number | null
          email?: string | null
          email_verified?: boolean | null
          equipo_pioneros?: string | null
          fecha_nacimiento?: string | null
          id?: string
          is_public?: boolean | null
          nombre_completo?: string
          patrulla?: string | null
          rama_que_educa?: string | null
          rol_adulto?: string | null
          role?: string | null
          seisena?: string | null
          telefono?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          username_updated_at?: string | null
        }
        Relationships: []
      }
      rama_documentos: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          nombre: string
          original_filename: string | null
          rama: string
          storage_path: string | null
          subido_por: string
          tamaño: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          nombre: string
          original_filename?: string | null
          rama: string
          storage_path?: string | null
          subido_por: string
          tamaño?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          nombre?: string
          original_filename?: string | null
          rama?: string
          storage_path?: string | null
          subido_por?: string
          tamaño?: number | null
        }
        Relationships: []
      }
      thread_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tokens: { Args: never; Returns: number }
      create_notification: {
        Args: {
          p_actor: string
          p_data: Json
          p_entity_id: string
          p_entity_type: string
          p_recipient: string
          p_type: string
        }
        Returns: undefined
      }
      create_or_get_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      generate_verification_token: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_email_registered: { Args: { p_email: string }; Returns: boolean }
      is_email_verified: { Args: { p_user_id: string }; Returns: boolean }
      list_profiles_directory: {
        Args: never
        Returns: {
          avatar_url: string
          edad: number
          is_public: boolean
          nombre_completo: string
          user_id: string
          username: string
        }[]
      }
      resend_verification_email: {
        Args: never
        Returns: {
          expires_at: string
          token: string
          user_email: string
        }[]
      }
      verify_email_token: {
        Args: { p_token: string }
        Returns: {
          message: string
          success: boolean
          verified_user_id: string
        }[]
      }
    }
    Enums: {
      follow_status: "pending" | "accepted" | "blocked"
      group_role: "owner" | "admin" | "member"
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
      follow_status: ["pending", "accepted", "blocked"],
      group_role: ["owner", "admin", "member"],
    },
  },
} as const
