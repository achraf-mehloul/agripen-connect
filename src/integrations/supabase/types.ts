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
      activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          group_id: string | null
          id: string
          summary: string
          verb: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          group_id?: string | null
          id?: string
          summary: string
          verb: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          group_id?: string | null
          id?: string
          summary?: string
          verb?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
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
          created_by: string | null
          id: string
          pair_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          pair_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          pair_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          added_by: string
          body: string
          client_id: string
          created_at: string
          group_id: string | null
          id: string
          received_at: string
          sender_email: string
          sender_name: string
          subject: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          added_by: string
          body?: string
          client_id: string
          created_at?: string
          group_id?: string | null
          id?: string
          received_at?: string
          sender_email: string
          sender_name: string
          subject: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          added_by?: string
          body?: string
          client_id?: string
          created_at?: string
          group_id?: string | null
          id?: string
          received_at?: string
          sender_email?: string
          sender_name?: string
          subject?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_measurements: {
        Row: {
          created_at: string
          created_by: string | null
          experiment_id: string
          id: string
          measured_at: string
          metric: string
          note: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          experiment_id: string
          id?: string
          measured_at?: string
          metric: string
          note?: string | null
          unit?: string
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          experiment_id?: string
          id?: string
          measured_at?: string
          metric?: string
          note?: string | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "experiment_measurements_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          client_id: string
          code: string
          created_at: string
          description: string
          environment: string | null
          id: string
          metrics: string[]
          notes: string | null
          owner_id: string
          results: string | null
          sensors: string[]
          soil_type: string | null
          started_on: string | null
          status: Database["public"]["Enums"]["experiment_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          description?: string
          environment?: string | null
          id?: string
          metrics?: string[]
          notes?: string | null
          owner_id: string
          results?: string | null
          sensors?: string[]
          soil_type?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          description?: string
          environment?: string | null
          id?: string
          metrics?: string[]
          notes?: string | null
          owner_id?: string
          results?: string | null
          sensors?: string[]
          soil_type?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          folder_id: string | null
          group_id: string | null
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          mime_type: string
          name: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          folder_id?: string | null
          group_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          mime_type: string
          name: string
          size_bytes?: number
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          folder_id?: string | null
          group_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          mime_type?: string
          name?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          last_read_at?: string
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
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          icon: string
          id: string
          is_archived: boolean
          is_private: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          is_archived?: boolean
          is_private?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          is_archived?: boolean
          is_private?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          note: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_name: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          message_id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          message_id: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          message_id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          client_id: string
          conversation_id: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          group_id: string | null
          id: string
          reply_to_id: string | null
        }
        Insert: {
          author_id: string
          body?: string
          client_id: string
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          reply_to_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          client_id?: string
          conversation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          reply_to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_attachments: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_name: string
          id: string
          kind: Database["public"]["Enums"]["attachment_kind"]
          mime_type: string
          post_id: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          mime_type: string
          post_id: string
          size_bytes?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["attachment_kind"]
          mime_type?: string
          post_id?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          client_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          client_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          client_id: string
          created_at: string
          group_id: string | null
          id: string
          is_pinned: boolean
          kind: Database["public"]["Enums"]["post_kind"]
          link_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          client_id: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          client_id?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          is_disabled: boolean
          job_title: string
          last_name: string
          last_seen_at: string
          onboarded: boolean
          presence: Database["public"]["Enums"]["sync_presence"]
          specialization: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id: string
          is_disabled?: boolean
          job_title?: string
          last_name?: string
          last_seen_at?: string
          onboarded?: boolean
          presence?: Database["public"]["Enums"]["sync_presence"]
          specialization?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          is_disabled?: boolean
          job_title?: string
          last_name?: string
          last_seen_at?: string
          onboarded?: boolean
          presence?: Database["public"]["Enums"]["sync_presence"]
          specialization?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          added_by: string
          author: string | null
          client_id: string
          created_at: string
          description: string
          group_id: string | null
          id: string
          tags: string[]
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          added_by: string
          author?: string | null
          client_id: string
          created_at?: string
          description?: string
          group_id?: string | null
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          added_by?: string
          author?: string | null
          client_id?: string
          created_at?: string
          description?: string
          group_id?: string | null
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_group: { Args: { _group_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_group_member: { Args: { _group_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member"
      attachment_kind: "image" | "video" | "audio" | "document" | "other"
      experiment_status:
        | "planned"
        | "running"
        | "pass"
        | "fail"
        | "needs_review"
      post_kind:
        | "update"
        | "image"
        | "video"
        | "voice"
        | "file"
        | "link"
        | "email"
        | "experiment"
        | "announcement"
      sync_presence: "online" | "away" | "offline"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "member"],
      attachment_kind: ["image", "video", "audio", "document", "other"],
      experiment_status: ["planned", "running", "pass", "fail", "needs_review"],
      post_kind: [
        "update",
        "image",
        "video",
        "voice",
        "file",
        "link",
        "email",
        "experiment",
        "announcement",
      ],
      sync_presence: ["online", "away", "offline"],
    },
  },
} as const
