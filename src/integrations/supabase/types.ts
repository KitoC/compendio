export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agent_functions: {
        Row: {
          agent_id: string;
          created_at: string | null;
          deleted_at: string | null;
          function_id: string;
          id: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          function_id: string;
          id?: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          function_id?: string;
          id?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_functions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_functions_function_id_fkey";
            columns: ["function_id"];
            isOneToOne: false;
            referencedRelation: "ai_functions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_functions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_agent_workflows: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          tenant_id: string;
          updated_at: string | null;
          workflow_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tenant_id: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_workflows_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_workflows_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_ai_agent_workflows_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_agents: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          domain: string | null;
          enabled: boolean;
          human_name: string | null;
          id: string;
          model: string;
          name: string;
          prompt: string;
          responsibility: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          domain?: string | null;
          enabled: boolean;
          human_name?: string | null;
          id?: string;
          model: string;
          name: string;
          prompt: string;
          responsibility: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          domain?: string | null;
          enabled?: boolean;
          human_name?: string | null;
          id?: string;
          model?: string;
          name?: string;
          prompt?: string;
          responsibility?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ai_agents_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_functions: {
        Row: {
          config: Json;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          enabled_for: Json;
          id: string;
          markup: Json | null;
          name: string;
          parameters: Json;
          schema: Json;
          tenant_id: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          config: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          enabled_for: Json;
          id?: string;
          markup?: Json | null;
          name: string;
          parameters: Json;
          schema: Json;
          tenant_id: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          enabled_for?: Json;
          id?: string;
          markup?: Json | null;
          name?: string;
          parameters?: Json;
          schema?: Json;
          tenant_id?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_ai_functions_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      configs: {
        Row: {
          config: Json | null;
          created_at: string;
          deleted_at: string | null;
          domain: string | null;
          id: string;
          name: string | null;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          id?: string;
          name?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          id?: string;
          name?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_configs_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      connected_services: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          service_type: string;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          workflow_instance_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          service_type: string;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          workflow_instance_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          service_type?: string;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_instance_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "connected_services_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connected_services_workflow_instance_id_fkey";
            columns: ["workflow_instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_connected_services_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          joined_at: string | null;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          joined_at?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          joined_at?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_conversation_participants_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      conversations: {
        Row: {
          alias: string | null;
          created_at: string;
          deleted_at: string | null;
          domain: string;
          icon: string | null;
          id: string;
          session_id: string | null;
          tenant_id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          alias?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain: string;
          icon?: string | null;
          id?: string;
          session_id?: string | null;
          tenant_id: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          alias?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string;
          icon?: string | null;
          id?: string;
          session_id?: string | null;
          tenant_id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_conversations_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      conversation_messages: {
        Row: {
          id: string;
          conversation_id: string;
          message_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          message_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          message_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_messages_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          }
        ];
      };

      credentials: {
        Row: {
          access_token: string | null;
          connected_service_id: string | null;
          created_at: string;
          deleted_at: string | null;
          domain: string;
          expires_at: string | null;
          id: string;
          password: string;
          refresh_token: string | null;
          scopes: string[] | null;
          tenant_id: string;
          type: string | null;
          updated_at: string | null;
          user_id: string;
          username: string;
          name: string;
          provider: string | null;
          refresh_failed: boolean | null;
        };
        Insert: {
          access_token?: string | null;
          connected_service_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string;
          expires_at?: string | null;
          id?: string;
          password?: string;
          refresh_token?: string | null;
          scopes?: string[] | null;
          tenant_id: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string;
          username?: string;
          name?: string;
          provider?: string | null;
          refresh_failed?: boolean | null;
        };
        Update: {
          access_token?: string | null;
          connected_service_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string;
          expires_at?: string | null;
          id?: string;
          password?: string;
          refresh_token?: string | null;
          scopes?: string[] | null;
          tenant_id?: string;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string;
          username?: string;
          name?: string;
          provider?: string | null;
          refresh_failed?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "credentials_connected_service_id_fkey";
            columns: ["connected_service_id"];
            isOneToOne: false;
            referencedRelation: "connected_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_credentials_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_migrations: {
        Row: {
          applied_at: string | null;
          created_at: string | null;
          deleted_at: string | null;
          error: string | null;
          id: string;
          migration: Json;
          name: string;
          rollback: Json | null;
          success: boolean | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          error?: string | null;
          id?: string;
          migration: Json;
          name: string;
          rollback?: Json | null;
          success?: boolean | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          applied_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          error?: string | null;
          id?: string;
          migration?: Json;
          name?: string;
          rollback?: Json | null;
          success?: boolean | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_custom_migrations_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_roles: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_custom_roles_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_table_data: {
        Row: {
          created_at: string | null;
          data: Json;
          deleted_at: string | null;
          id: string;
          metadata: Json;
          table_id: string;
          table_name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          data: Json;
          deleted_at?: string | null;
          id?: string;
          metadata: Json;
          table_id: string;
          table_name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          data?: Json;
          deleted_at?: string | null;
          id?: string;
          metadata?: Json;
          table_id?: string;
          table_name?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_custom_table_data_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_table_data_progress: {
        Row: {
          current_step: number | null;
          last_table: string | null;
          last_table_id: string | null;
          status: string | null;
          tenant_id: string;
          total_steps: number | null;
          updated_at: string | null;
        };
        Insert: {
          current_step?: number | null;
          last_table?: string | null;
          last_table_id?: string | null;
          status?: string | null;
          tenant_id: string;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Update: {
          current_step?: number | null;
          last_table?: string | null;
          last_table_id?: string | null;
          status?: string | null;
          tenant_id?: string;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      custom_table_definitions: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          display_name: string | null;
          icon: string | null;
          id: string;
          name: string;
          permissions: Json;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          permissions: Json;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          permissions?: Json;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_custom_table_definitions_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_table_fields: {
        Row: {
          created_at: string | null;
          default_value: string | null;
          deleted_at: string | null;
          description: string | null;
          display_name: string | null;
          field_type: Database["public"]["Enums"]["field_type_enum"];
          id: string;
          is_required: boolean | null;
          is_unique: boolean | null;
          name: string;
          options: Json | null;
          permissions: Json;
          relation: Json | null;
          table_id: string | null;
          tenant_id: string;
          updated_at: string | null;
          validation: Json | null;
        };
        Insert: {
          created_at?: string | null;
          default_value?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          field_type: Database["public"]["Enums"]["field_type_enum"];
          id?: string;
          is_required?: boolean | null;
          is_unique?: boolean | null;
          name: string;
          options?: Json | null;
          permissions: Json;
          relation?: Json | null;
          table_id?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          validation?: Json | null;
        };
        Update: {
          created_at?: string | null;
          default_value?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          field_type?: Database["public"]["Enums"]["field_type_enum"];
          id?: string;
          is_required?: boolean | null;
          is_unique?: boolean | null;
          name?: string;
          options?: Json | null;
          permissions?: Json;
          relation?: Json | null;
          table_id?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          validation?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_table_fields_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "custom_table_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_custom_table_fields_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      custom_table_progress: {
        Row: {
          current_step: number | null;
          last_table: string | null;
          last_table_id: string | null;
          status: string | null;
          tenant_id: string;
          total_steps: number | null;
          updated_at: string | null;
        };
        Insert: {
          current_step?: number | null;
          last_table?: string | null;
          last_table_id?: string | null;
          status?: string | null;
          tenant_id: string;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Update: {
          current_step?: number | null;
          last_table?: string | null;
          last_table_id?: string | null;
          status?: string | null;
          tenant_id?: string;
          total_steps?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      custom_table_relationships: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          from_field: string;
          from_table: string;
          id: string;
          relationship_type: string;
          table_id: string | null;
          tenant_id: string;
          to_field: string;
          to_table: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          from_field: string;
          from_table: string;
          id?: string;
          relationship_type: string;
          table_id?: string | null;
          tenant_id: string;
          to_field: string;
          to_table: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          from_field?: string;
          from_table?: string;
          id?: string;
          relationship_type?: string;
          table_id?: string | null;
          tenant_id?: string;
          to_field?: string;
          to_table?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_table_relationships_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "custom_table_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_custom_table_relationships_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          contact_details: Json;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          contact_details: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tenant_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          contact_details?: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_customers_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          content: string | null;
          embedding: string | null;
          id: number;
          metadata: Json | null;
        };
        Insert: {
          content?: string | null;
          embedding?: string | null;
          id?: number;
          metadata?: Json | null;
        };
        Update: {
          content?: string | null;
          embedding?: string | null;
          id?: number;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          created_at: string;
          domain: string | null;
          id: number;
          memory: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          domain?: string | null;
          id?: number;
          memory?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          domain?: string | null;
          id?: number;
          memory?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: Json;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          metadata: Json;
          reply_to: string | null;
          role: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          metadata: Json;
          reply_to?: string | null;
          role: string;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          metadata?: Json;
          reply_to?: string | null;
          role?: string;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_messages_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      n8n_chat_histories: {
        Row: {
          id: number;
          message: Json;
          session_id: string;
        };
        Insert: {
          id?: number;
          message: Json;
          session_id: string;
        };
        Update: {
          id?: number;
          message?: Json;
          session_id?: string;
        };
        Relationships: [];
      };
      oauth_states: {
        Row: {
          agent_id: string | null;
          code_verifier: string | null;
          config: Json | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          provider: string | null;
          redirect_uri: string | null;
          service_type: string | null;
          state: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
          workflow_instance_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          code_verifier?: string | null;
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          provider?: string | null;
          redirect_uri?: string | null;
          service_type?: string | null;
          state?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
          workflow_instance_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          code_verifier?: string | null;
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          provider?: string | null;
          redirect_uri?: string | null;
          service_type?: string | null;
          state?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
          workflow_instance_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_oauth_states_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oauth_states_workflow_instance_id_fkey";
            columns: ["workflow_instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          }
        ];
      };
      price_items: {
        Row: {
          cost_price: number | null;
          created_at: string | null;
          deleted_at: string | null;
          discount: number | null;
          editable_quantity: boolean | null;
          id: string;
          item_code: string | null;
          item_id: string;
          item_title: string;
          item_total: number | null;
          last_changed: string | null;
          long_description: string | null;
          optional: boolean | null;
          quantity: number | null;
          sales_category: string;
          subscription: string | null;
          tax_rate: string | null;
          tenant_id: string;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          cost_price?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          discount?: number | null;
          editable_quantity?: boolean | null;
          id?: string;
          item_code?: string | null;
          item_id: string;
          item_title: string;
          item_total?: number | null;
          last_changed?: string | null;
          long_description?: string | null;
          optional?: boolean | null;
          quantity?: number | null;
          sales_category: string;
          subscription?: string | null;
          tax_rate?: string | null;
          tenant_id: string;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          cost_price?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          discount?: number | null;
          editable_quantity?: boolean | null;
          id?: string;
          item_code?: string | null;
          item_id?: string;
          item_title?: string;
          item_total?: number | null;
          last_changed?: string | null;
          long_description?: string | null;
          optional?: boolean | null;
          quantity?: number | null;
          sales_category?: string;
          subscription?: string | null;
          tax_rate?: string | null;
          tenant_id?: string;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_price_items_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      tempEmails: {
        Row: {
          body: string | null;
          created_at: string;
          id: number;
          recipient: string | null;
          ref: string;
          subject: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: number;
          recipient?: string | null;
          ref?: string;
          subject?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: number;
          recipient?: string | null;
          ref?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      tenant_domains: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_tenant_domains_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      tenant_requests: {
        Row: {
          created_at: string | null;
          id: string;
          status: string;
          updated_at: string | null;
          user_email: string | null;
          user_id: string;
          workspace: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          status?: string;
          updated_at?: string | null;
          user_email?: string | null;
          user_id: string;
          workspace: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          status?: string;
          updated_at?: string | null;
          user_email?: string | null;
          user_id?: string;
          workspace?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_tenant_requests_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      tenant_users: {
        Row: {
          created_at: string | null;
          id: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string;
          is_primary: boolean;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          tenant_id: string;
          updated_at?: string | null;
          user_id: string;
          is_primary: boolean;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      tenants: {
        Row: {
          id: string;
          name: string | null;
          tenant_owner_id: string;
          workspace: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          tenant_owner_id: string;
          workspace: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          tenant_owner_id?: string;
          workspace?: string;
        };
        Relationships: [];
      };
      user_custom_roles: {
        Row: {
          created_at: string | null;
          custom_role_id: string;
          deleted_at: string | null;
          id: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          custom_role_id: string;
          deleted_at?: string | null;
          id?: string;
          tenant_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          custom_role_id?: string;
          deleted_at?: string | null;
          id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_user_custom_roles_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey";
            columns: ["custom_role_id"];
            isOneToOne: false;
            referencedRelation: "custom_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_custom_roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          id: string;
          role_type: Database["public"]["Enums"]["user_role_type"];
          tenant_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role_type?: Database["public"]["Enums"]["user_role_type"];
          tenant_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role_type?: Database["public"]["Enums"]["user_role_type"];
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      webhook_events: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          error_message: string | null;
          headers: Json | null;
          id: string;
          payload: Json | null;
          received_at: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          webhook_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          payload?: Json | null;
          received_at?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          webhook_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          payload?: Json | null;
          received_at?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          webhook_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_webhook_events_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_events_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "webhook_subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };
      webhook_subscriptions: {
        Row: {
          agent_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          endpoint_url: string | null;
          id: string;
          secret: string | null;
          service_type: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          endpoint_url?: string | null;
          id?: string;
          secret?: string | null;
          service_type?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          endpoint_url?: string | null;
          id?: string;
          secret?: string | null;
          service_type?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_webhook_subscriptions_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_subscriptions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_instances: {
        Row: {
          agent_id: string | null;
          completed_at: string | null;
          created_at: string | null;
          current_step: number | null;
          deleted_at: string | null;
          id: string;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
          workflow_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          deleted_at?: string | null;
          id?: string;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          deleted_at?: string | null;
          id?: string;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_workflow_instances_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_instances_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_responses: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          error_message: string | null;
          id: string;
          response: Json | null;
          status: string | null;
          step_index: number | null;
          tenant_id: string;
          updated_at: string | null;
          workflow_instance_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          error_message?: string | null;
          id?: string;
          response?: Json | null;
          status?: string | null;
          step_index?: number | null;
          tenant_id: string;
          updated_at?: string | null;
          workflow_instance_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          error_message?: string | null;
          id?: string;
          response?: Json | null;
          status?: string | null;
          step_index?: number | null;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_instance_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_workflow_responses_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_responses_workflow_instance_id_fkey";
            columns: ["workflow_instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_steps: {
        Row: {
          config: Json | null;
          connected_service_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          step_index: number;
          tenant_id: string;
          type: string;
          updated_at: string | null;
          workflow_id: string | null;
        };
        Insert: {
          config?: Json | null;
          connected_service_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          step_index: number;
          tenant_id: string;
          type: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Update: {
          config?: Json | null;
          connected_service_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          step_index?: number;
          tenant_id?: string;
          type?: string;
          updated_at?: string | null;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_workflow_steps_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_connected_service_id_fkey";
            columns: ["connected_service_id"];
            isOneToOne: false;
            referencedRelation: "connected_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      workflows: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_workflows_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      conversation_messages_view: {
        Row: {
          conversation_id: string;
          id: string;
          content: Json;
          created_at: string | null;
          deleted_at: string | null;
          metadata: Json;
          reply_to: string | null;
          role: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
          username: string | null;
          avatar_url: string | null;
          display_name: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: never;
      };
    };
    Functions: {
      get_user_tenants: {
        Args: {
          user_id: string;
        };
        Returns: (Database["public"]["Tables"]["tenants"]["Row"] & {
          is_primary_tenant: boolean;
        })[];
      };
      add_default_columns: {
        Args: {
          table_name: string;
          add_tenant_id?: boolean;
          tenant_id?: string;
        };
        Returns: undefined;
      };
      apply_custom_migration: {
        Args: {
          migration_name: string;
        };
        Returns: undefined;
      };
      binary_quantize:
        | {
            Args: {
              "": string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              "": unknown;
            };
            Returns: unknown;
          };
      build_default_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      can_access_tenant_data: {
        Args: {
          target_tenant_id: string;
          allowed_roles: Database["public"]["Enums"]["user_role_type"][];
        };
        Returns: boolean;
      };
      create_tenant_request: {
        Args: {
          workspace_name: string;
          user_email: string;
        };
        Returns: string;
      };
      delete_custom_table_record: {
        Args: {
          p_table_name: string;
          p_record_id: string;
          p_tenant_id: string;
        };
        Returns: undefined;
      };
      get_custom_table_data: {
        Args: {
          p_table_name: string;
          p_tenant_id: string;
        };
        Returns: Json;
      };
      get_field_types: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["field_type_enum"][];
      };
      get_table_schema: {
        Args: {
          t_name: string;
        };
        Returns: {
          column_name: string;
          data_type: string;
          character_maximum_length: number;
          is_nullable: string;
          column_default: string;
        }[];
      };
      halfvec_avg: {
        Args: {
          "": number[];
        };
        Returns: unknown;
      };
      halfvec_out: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      halfvec_send: {
        Args: {
          "": unknown;
        };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: {
          "": unknown[];
        };
        Returns: number;
      };
      has_role: {
        Args: {
          _user_id: string;
          _tenant_id: string;
          _role: Database["public"]["Enums"]["user_role_type"];
        };
        Returns: boolean;
      };
      has_row_permission:
        | {
            Args: {
              perms: Json;
              action: string;
            };
            Returns: boolean;
          }
        | {
            Args: {
              target_tenant_id: string;
              perms: Json;
              action: string;
            };
            Returns: boolean;
          };
      hnsw_bit_support: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      hnswhandler: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      import_custom_table_data: {
        Args: {
          import_data: Json;
          input_tenant_id: string;
        };
        Returns: undefined;
      };
      insert_custom_table_record: {
        Args: {
          p_table_name: string;
          p_tenant_id: string;
          p_data: Json;
        };
        Returns: Json;
      };
      insert_custom_tables: {
        Args: {
          schema_data: Json;
          input_tenant_id: string;
        };
        Returns: Json;
      };
      insert_user_role: {
        Args: {
          p_email: string;
          p_tenant_workspace: string;
          p_role: Database["public"]["Enums"]["user_role_type"];
        };
        Returns: undefined;
      };
      is_super_admin: {
        Args: {
          _user_id: string;
        };
        Returns: boolean;
      };
      ivfflat_bit_support: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      l2_norm:
        | {
            Args: {
              "": unknown;
            };
            Returns: number;
          }
        | {
            Args: {
              "": unknown;
            };
            Returns: number;
          };
      l2_normalize:
        | {
            Args: {
              "": string;
            };
            Returns: string;
          }
        | {
            Args: {
              "": unknown;
            };
            Returns: unknown;
          }
        | {
            Args: {
              "": unknown;
            };
            Returns: unknown;
          };
      make_column_unique_to_tenant: {
        Args: {
          table_name: string;
          col1: string;
          constraint_name?: string;
        };
        Returns: undefined;
      };
      match_documents: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter?: Json;
        };
        Returns: {
          id: number;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      sparsevec_out: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: {
          "": unknown;
        };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: {
          "": unknown[];
        };
        Returns: number;
      };
      update_custom_table_record: {
        Args: {
          p_table_name: string;
          p_record_id: string;
          p_tenant_id: string;
          p_data: Json;
        };
        Returns: undefined;
      };
      user_has_custom_role: {
        Args: {
          _user_id: string;
          _tenant_id: string;
          _custom_role_id: string;
        };
        Returns: boolean;
      };
      user_has_field_permission: {
        Args: {
          _user_id: string;
          _tenant_id: string;
          _field_id: string;
          _permission: string;
        };
        Returns: boolean;
      };
      user_has_table_permission: {
        Args: {
          _user_id: string;
          _tenant_id: string;
          _table_id: string;
          _permission: string;
        };
        Returns: boolean;
      };
      vector_avg: {
        Args: {
          "": number[];
        };
        Returns: string;
      };
      vector_dims:
        | {
            Args: {
              "": string;
            };
            Returns: number;
          }
        | {
            Args: {
              "": unknown;
            };
            Returns: number;
          };
      vector_norm: {
        Args: {
          "": string;
        };
        Returns: number;
      };
      vector_out: {
        Args: {
          "": string;
        };
        Returns: unknown;
      };
      vector_send: {
        Args: {
          "": string;
        };
        Returns: string;
      };
      vector_typmod_in: {
        Args: {
          "": unknown[];
        };
        Returns: number;
      };
    };
    Enums: {
      field_type_enum:
        | "text"
        | "integer"
        | "boolean"
        | "reference"
        | "timestamp"
        | "uuid"
        | "number"
        | "date"
        | "select"
        | "email"
        | "url"
        | "relation"
        | "textarea";
      user_role_type:
        | "admin"
        | "member"
        | "guest"
        | "super-admin"
        | "tenant-owner";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
