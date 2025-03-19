
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      custom_table_data: {
        Row: {
          id: string
          table_id: string
          data: Json
          tenant_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          table_name: string
          metadata: Json
        }
        Insert: {
          id?: string
          table_id: string
          data: Json
          tenant_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          table_name: string
          metadata?: Json
        }
        Update: {
          id?: string
          table_id?: string
          data?: Json
          tenant_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          table_name?: string
          metadata?: Json
        }
      }
      custom_table_definitions: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          icon: string | null
          tenant_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          permissions: Json
        }
      }
      custom_table_fields: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          field_type: string | null
          is_required: boolean
          is_unique: boolean
          default_value: Json | null
          options: Json | null
          table_id: string
          tenant_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          permissions: Json
        }
      }
    }
  }
}
