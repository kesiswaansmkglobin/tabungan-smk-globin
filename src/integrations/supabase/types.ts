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
      classes: {
        Row: {
          created_at: string
          id: string
          nama_kelas: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kelas: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_kelas?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          email_visible: boolean | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      school_data: {
        Row: {
          alamat_sekolah: string
          created_at: string
          id: string
          jabatan_pengelola: string
          kontak_pengelola: string
          logo_sekolah: string | null
          nama_pengelola: string
          nama_sekolah: string
          tahun_ajaran: string
          updated_at: string
        }
        Insert: {
          alamat_sekolah: string
          created_at?: string
          id?: string
          jabatan_pengelola: string
          kontak_pengelola: string
          logo_sekolah?: string | null
          nama_pengelola: string
          nama_sekolah: string
          tahun_ajaran: string
          updated_at?: string
        }
        Update: {
          alamat_sekolah?: string
          created_at?: string
          id?: string
          jabatan_pengelola?: string
          kontak_pengelola?: string
          logo_sekolah?: string | null
          nama_pengelola?: string
          nama_sekolah?: string
          tahun_ajaran?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_accessed: string
          session_token: string
          student_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_accessed?: string
          session_token: string
          student_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string
          session_token?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          id: string
          kelas_id: string
          nama: string
          nis: string
          password: string
          saldo: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelas_id: string
          nama: string
          nis: string
          password: string
          saldo?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kelas_id?: string
          nama?: string
          nis?: string
          password?: string
          saldo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin: string
          created_at: string
          id: string
          jenis: string
          jumlah: number
          keterangan: string | null
          saldo_setelah: number
          student_id: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          admin?: string
          created_at?: string
          id?: string
          jenis: string
          jumlah: number
          keterangan?: string | null
          saldo_setelah: number
          student_id: string
          tanggal?: string
          updated_at?: string
        }
        Update: {
          admin?: string
          created_at?: string
          id?: string
          jenis?: string
          jumlah?: number
          keterangan?: string | null
          saldo_setelah?: number
          student_id?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      wali_kelas: {
        Row: {
          created_at: string
          id: string
          kelas_id: string
          nama: string
          nip: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelas_id: string
          nama: string
          nip?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kelas_id?: string
          nama?: string
          nip?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wali_kelas_class"
            columns: ["kelas_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wali_kelas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      armor: {
        Args: { "": string }
        Returns: string
      }
      authenticate_student: {
        Args: { student_nis: string; student_password: string }
        Returns: Json
      }
      cleanup_expired_student_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_confirmed_user: {
        Args: { user_email: string; user_name: string; user_password: string }
        Returns: string
      }
      create_student_session: {
        Args: { student_nis: string; student_password: string }
        Returns: Json
      }
      dearmor: {
        Args: { "": string }
        Returns: string
      }
      gen_random_bytes: {
        Args: { "": number }
        Returns: string
      }
      gen_random_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_salt: {
        Args: { "": string }
        Returns: string
      }
      get_authenticated_student_id: {
        Args: { student_nis: string; student_password: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_student_info_secure: {
        Args: { token: string }
        Returns: Json
      }
      get_student_transactions: {
        Args: { student_nis: string }
        Returns: {
          admin: string
          created_at: string
          id: string
          jenis: string
          jumlah: number
          keterangan: string
          saldo_setelah: number
          tanggal: string
        }[]
      }
      get_student_transactions_secure: {
        Args: { token: string }
        Returns: {
          admin: string
          created_at: string
          id: string
          jenis: string
          jumlah: number
          keterangan: string
          saldo_setelah: number
          tanggal: string
        }[]
      }
      get_wali_kelas_class_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_wali_kelas_students: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          kelas_id: string
          nama: string
          nis: string
          saldo: number
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_wali_kelas: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      logout_student_session: {
        Args: { token: string }
        Returns: boolean
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      pgp_key_id: {
        Args: { "": string }
        Returns: string
      }
      verify_student_session: {
        Args: { token: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "wali_kelas"
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
      app_role: ["admin", "teacher", "student", "wali_kelas"],
    },
  },
} as const
