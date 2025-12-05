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
      assets: {
        Row: {
          asset_type: string | null

          created_at: string | null
          distributed_at: string | null
          distributed_by: string | null
          distribution_location: Json | null
          file_url: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          asset_type?: string | null

          created_at?: string | null
          distributed_at?: string | null
          distributed_by?: string | null
          distribution_location?: Json | null
          file_url?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: string | null

          created_at?: string | null
          distributed_at?: string | null
          distributed_by?: string | null
          distribution_location?: Json | null
          file_url?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [

          {
            foreignKeyName: "assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }

      contacts: {
        Row: {
          contact_kind: string | null
          created_at: string | null
          email: string | null
          id: string
          location_id: string | null
          name: string
          phone: string | null
          role: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contact_kind?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          location_id?: string | null
          name: string
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contact_kind?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          interaction_type: string
          location_id: string | null
          notes: string | null
          outcome: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_type: string
          location_id?: string | null
          notes?: string | null
          outcome?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_type?: string
          location_id?: string | null
          notes?: string | null
          outcome?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          coordinates: Json | null
          created_at: string | null
          id: string
          name: string
          neighborhood: string | null
          slug: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          slug?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          coordinates?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          slug?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_links: {
        Row: {
          asset_id: string | null
          base_url: string

          created_at: string | null
          id: string
          qr_code_url: string | null
          scan_count: number | null
          tenant_id: string
          utm_params: Json | null
        }
        Insert: {
          asset_id?: string | null
          base_url: string

          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          scan_count?: number | null
          tenant_id: string
          utm_params?: Json | null
        }
        Update: {
          asset_id?: string | null
          base_url?: string

          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          scan_count?: number | null
          tenant_id?: string
          utm_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },

          {
            foreignKeyName: "qr_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          asset_id: string | null
          geo: Json | null
          id: string
          ip_address: unknown | null
          location_id: string | null
          qr_link_id: string
          referrer: string | null
          scanned_at: string | null
          session_id: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          asset_id?: string | null
          geo?: Json | null
          id?: string
          ip_address?: unknown | null
          location_id?: string | null
          qr_link_id: string
          referrer?: string | null
          scanned_at?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          asset_id?: string | null
          geo?: Json | null
          id?: string
          ip_address?: unknown | null
          location_id?: string | null
          qr_link_id?: string
          referrer?: string | null
          scanned_at?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_qr_link_id_fkey"
            columns: ["qr_link_id"]
            isOneToOne: false
            referencedRelation: "qr_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_verticals: {
        Row: {
          created_at: string | null
          id: string
          language_config: Json
          tenant_id: string
          updated_at: string | null
          vertical_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_config: Json
          tenant_id: string
          updated_at?: string | null
          vertical_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language_config?: Json
          tenant_id?: string
          updated_at?: string | null
          vertical_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_verticals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          branding: Json | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          vertical_key: string | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          vertical_key?: string | null
        }
        Update: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          vertical_key?: string | null
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
