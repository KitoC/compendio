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
            foreignKeyName: "agent_functions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "user_agents_with_conversations";
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
            foreignKeyName: "ai_agent_workflows_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "user_agents_with_conversations";
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
          provider: string;
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
          provider?: string;
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
          provider?: string;
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
          client_state: string | null;
          config: Json | null;
          created_at: string | null;
          credential_id: string | null;
          deleted_at: string | null;
          id: string;
          name: string | null;
          service_type: string;
          status: string | null;
          subscription_expires_at: string | null;
          subscription_id: string | null;
          tenant_id: string;
          updated_at: string | null;
          webhook_change_type: string | null;
          webhook_resource: string | null;
          workflow_instance_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          client_state?: string | null;
          config?: Json | null;
          created_at?: string | null;
          credential_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string | null;
          service_type: string;
          status?: string | null;
          subscription_expires_at?: string | null;
          subscription_id?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          webhook_change_type?: string | null;
          webhook_resource?: string | null;
          workflow_instance_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          client_state?: string | null;
          config?: Json | null;
          created_at?: string | null;
          credential_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string | null;
          service_type?: string;
          status?: string | null;
          subscription_expires_at?: string | null;
          subscription_id?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          webhook_change_type?: string | null;
          webhook_resource?: string | null;
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
            foreignKeyName: "connected_services_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "user_agents_with_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "connected_services_credential_id_fkey";
            columns: ["credential_id"];
            isOneToOne: false;
            referencedRelation: "credentials";
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
      conversation_messages: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          id: string;
          message_id: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          message_id: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          message_id?: string;
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
            referencedRelation: "conversation_messages_view";
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
      conversation_participants: {
        Row: {
          agent_id: string | null;
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
          agent_id?: string | null;
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
          agent_id?: string | null;
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
            foreignKeyName: "conversation_participants_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "user_agents_with_conversations";
            referencedColumns: ["id"];
          },
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
      credentials: {
        Row: {
          access_token: string | null;
          associated_email: string | null;
          created_at: string;
          deleted_at: string | null;
          domain: string | null;
          encryption_key_id: string | null;
          expires_at: string | null;
          id: string;
          name: string | null;
          password: string | null;
          provider: string | null;
          refresh_failed: boolean | null;
          refresh_token: string | null;
          scopes: string[] | null;
          tenant_id: string;
          tid: string | null;
          type: string | null;
          updated_at: string | null;
          updated_by: string | null;
          user_id: string;
          username: string | null;
        };
        Insert: {
          access_token?: string | null;
          associated_email?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          encryption_key_id?: string | null;
          expires_at?: string | null;
          id?: string;
          name?: string | null;
          password?: string | null;
          provider?: string | null;
          refresh_failed?: boolean | null;
          refresh_token?: string | null;
          scopes?: string[] | null;
          tenant_id: string;
          tid?: string | null;
          type?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
          username?: string | null;
        };
        Update: {
          access_token?: string | null;
          associated_email?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          domain?: string | null;
          encryption_key_id?: string | null;
          expires_at?: string | null;
          id?: string;
          name?: string | null;
          password?: string | null;
          provider?: string | null;
          refresh_failed?: boolean | null;
          refresh_token?: string | null;
          scopes?: string[] | null;
          tenant_id?: string;
          tid?: string | null;
          type?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "credentials_encryption_key_id_fkey";
            columns: ["encryption_key_id"];
            isOneToOne: false;
            referencedRelation: "encryption_keys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credentials_tenant_id_fkey";
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
      data_fields: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          external_id: string | null;
          id: string;
          permissions: Json;
          schema: Json | null;
          schema_id: string | null;
          schema_name: string | null;
          source: string | null;
          table_id: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          external_id?: string | null;
          id?: string;
          permissions: Json;
          schema?: Json | null;
          schema_id?: string | null;
          schema_name?: string | null;
          source?: string | null;
          table_id?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          external_id?: string | null;
          id?: string;
          permissions?: Json;
          schema?: Json | null;
          schema_id?: string | null;
          schema_name?: string | null;
          source?: string | null;
          table_id?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_table_fields_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "data_tables";
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
      data_table_record_labels: {
        Row: {
          created_at: string | null;
          data_table_id: string;
          deleted_at: string | null;
          external_table_id: string;
          id: string;
          label: string;
          record_id: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          data_table_id: string;
          deleted_at?: string | null;
          external_table_id: string;
          id?: string;
          label: string;
          record_id: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          data_table_id?: string;
          deleted_at?: string | null;
          external_table_id?: string;
          id?: string;
          label?: string;
          record_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_table_record_labels_data_table_id_fkey";
            columns: ["data_table_id"];
            isOneToOne: false;
            referencedRelation: "data_tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_table_record_labels_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      data_tables: {
        Row: {
          config: Json | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          display_name: string | null;
          external_id: string | null;
          icon: string | null;
          id: string;
          name: string;
          permissions: Json;
          primary_field_id: string | null;
          schema_id: string | null;
          schema_name: string | null;
          source: string | null;
          tenant_id: string;
          updated_at: string | null;
          views: Json | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          external_id?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          permissions: Json;
          primary_field_id?: string | null;
          schema_id?: string | null;
          schema_name?: string | null;
          source?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          views?: Json | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          external_id?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          permissions?: Json;
          primary_field_id?: string | null;
          schema_id?: string | null;
          schema_name?: string | null;
          source?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          views?: Json | null;
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
      data_views: {
        Row: {
          config: Json | null;
          created_at: string | null;
          deleted_at: string | null;
          label: string | null;
          view_type: string | null;
          external_table_id: string | null;
          data_table_id: string | null;
          id: string;
          tenant_id: string;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          label?: string | null;
          view_type?: string | null;
          external_table_id?: string | null;
          data_table_id?: string | null;
          id?: string;
          tenant_id: string;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
          label?: string | null;
          view_type?: string | null;
          external_table_id?: string | null;
          data_table_id?: string | null;
          id?: string;
          tenant_id: string;
        };
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
      encryption_keys: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          tenant_id: string | null;
          version: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          version?: number | null;
        };
        Relationships: [];
      };
      function_queue: {
        Row: {
          action: string | null;
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          last_failed_at: string | null;
          payload_encrypted: string;
          priority: string | null;
          processing_started_at: string | null;
          retry_count: number | null;
          status: string | null;
        };
        Insert: {
          action?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          last_failed_at?: string | null;
          payload_encrypted: string;
          priority?: string | null;
          processing_started_at?: string | null;
          retry_count?: number | null;
          status?: string | null;
        };
        Update: {
          action?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          last_failed_at?: string | null;
          payload_encrypted?: string;
          priority?: string | null;
          processing_started_at?: string | null;
          retry_count?: number | null;
          status?: string | null;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          created_at: string;
          domain: string | null;
          id: number;
          memory: string | null;
          userId: string;
        };
        Insert: {
          created_at?: string;
          domain?: string | null;
          id?: number;
          memory?: string | null;
          userId?: string;
        };
        Update: {
          created_at?: string;
          domain?: string | null;
          id?: number;
          memory?: string | null;
          userId?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          connected_service_id: string | null;
          content: Json;
          created_at: string | null;
          deleted_at: string | null;
          encrypted_content: string | null;
          id: string;
          metadata: Json;
          reply_to: string | null;
          role: string;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          connected_service_id?: string | null;
          content: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          encrypted_content?: string | null;
          id?: string;
          metadata: Json;
          reply_to?: string | null;
          role: string;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          connected_service_id?: string | null;
          content?: Json;
          created_at?: string | null;
          deleted_at?: string | null;
          encrypted_content?: string | null;
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
          },
          {
            foreignKeyName: "messages_connected_service_id_fkey";
            columns: ["connected_service_id"];
            isOneToOne: false;
            referencedRelation: "connected_services";
            referencedColumns: ["id"];
          }
        ];
      };
      oauth_states: {
        Row: {
          agent_id: string | null;
          code_verifier: string | null;
          config: Json | null;
          created_at: string | null;
          deleted_at: string | null;
          expires_at: string | null;
          id: string;
          inserted_at: string | null;
          inserted_by: string | null;
          provider: string | null;
          redirect_uri: string | null;
          service_type: string | null;
          state: string | null;
          status: string | null;
          tenant_id: string | null;
          tid: string | null;
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
          expires_at?: string | null;
          id?: string;
          inserted_at?: string | null;
          inserted_by?: string | null;
          provider?: string | null;
          redirect_uri?: string | null;
          service_type?: string | null;
          state?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          tid?: string | null;
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
          expires_at?: string | null;
          id?: string;
          inserted_at?: string | null;
          inserted_by?: string | null;
          provider?: string | null;
          redirect_uri?: string | null;
          service_type?: string | null;
          state?: string | null;
          status?: string | null;
          tenant_id?: string | null;
          tid?: string | null;
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
          }
        ];
      };
      onboarding_sessions: {
        Row: {
          completed: boolean | null;
          created_at: string | null;
          current_step_id: string | null;
          deleted_at: string | null;
          id: string;
          metadata: Json | null;
          state: Json | null;
          tenant_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          current_step_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          metadata?: Json | null;
          state?: Json | null;
          tenant_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          current_step_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          metadata?: Json | null;
          state?: Json | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_onboarding_sessions_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
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
          display_name: string | null;
          id: string;
          is_onboarded: boolean | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          display_name?: string | null;
          id: string;
          is_onboarded?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          display_name?: string | null;
          id?: string;
          is_onboarded?: boolean | null;
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
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          status?: string;
          updated_at?: string | null;
          user_email?: string | null;
          user_id: string;
          workspace: string;
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
        Relationships: [];
      };
      tenant_users: {
        Row: {
          created_at: string | null;
          id: string;
          is_primary_tenant: boolean | null;
          tenant_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_primary_tenant?: boolean | null;
          tenant_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_primary_tenant?: boolean | null;
          tenant_id?: string;
          updated_at?: string | null;
          user_id?: string;
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
          base_id: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
          tag_id: string | null;
          tenant_owner_id: string;
          workspace: string | null;
          source: string;
        };
        Insert: {
          base_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          tag_id?: string | null;
          tenant_owner_id: string;
          workspace?: string | null;
          source: string;
        };
        Update: {
          base_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          tag_id?: string | null;
          tenant_owner_id?: string;
          workspace?: string | null;
          source?: string;
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
          tenant_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role_type?: Database["public"]["Enums"]["user_role_type"];
          tenant_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role_type?: Database["public"]["Enums"]["user_role_type"];
          tenant_id?: string | null;
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
          connected_service_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          encrypted_payload: string | null;
          error_message: string | null;
          headers: Json | null;
          id: string;
          received_at: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          connected_service_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          encrypted_payload?: string | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          received_at?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          connected_service_id?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          encrypted_payload?: string | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          received_at?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
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
            foreignKeyName: "webhook_events_connected_service_id_fkey";
            columns: ["connected_service_id"];
            isOneToOne: false;
            referencedRelation: "connected_services";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_actions: {
        Row: {
          action_type: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          position: string | null;
          tenant_id: string;
          updated_at: string | null;
          workflow_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          position?: string | null;
          tenant_id: string;
          updated_at?: string | null;
          workflow_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          position?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_actions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_actions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
      workflow_triggers: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          tenant_id: string;
          updated_at: string | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          tenant_id: string;
          updated_at?: string | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          tenant_id?: string;
          updated_at?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey";
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
          external_workflow_id: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          name: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          external_workflow_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          name: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          external_workflow_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
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
          avatar_url: string | null;
          content: Json | null;
          conversation_id: string | null;
          created_at: string | null;
          deleted_at: string | null;
          display_name: string | null;
          id: string | null;
          metadata: Json | null;
          reply_to: string | null;
          role: string | null;
          tenant_id: string | null;
          updated_at: string | null;
          user_id: string | null;
          username: string | null;
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
            foreignKeyName: "fk_messages_tenant";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      user_agents_with_conversations: {
        Row: {
          avatar_url: string | null;
          conversations: Json | null;
          created_at: string | null;
          deleted_at: string | null;
          domain: string | null;
          enabled: boolean | null;
          human_name: string | null;
          id: string | null;
          model: string | null;
          name: string | null;
          prompt: string | null;
          provider: string | null;
          responsibility: string | null;
          tenant_id: string | null;
          updated_at: string | null;
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
    };
    Functions: {
      add_default_columns: {
        Args: {
          table_name: string;
          add_tenant_id?: boolean;
          tenant_id?: string;
        };
        Returns: undefined;
      };
      apply_system_admin_rls_policy: {
        Args: { _table_name: string };
        Returns: undefined;
      };
      batch_decrypt_jsonb_fields: {
        Args: {
          _table_name: string;
          _id_column: string;
          _ids: string[];
          _encrypted_fields: string[];
          _encryption_key: string;
        };
        Returns: Json[];
      };
      binary_quantize: {
        Args: { "": string } | { "": unknown };
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
      cleanup_oauth_states: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_message_for_conversations: {
        Args: {
          conversation_ids: string[];
          message_data: Json;
          encryption_key?: string;
        };
        Returns: Json;
      };
      create_rls_policy: {
        Args: {
          target_table: unknown;
          policy_suffix?: string;
          with_user_check?: boolean;
          with_tenant_check?: boolean;
          apply_select?: boolean;
          apply_insert?: boolean;
          apply_update?: boolean;
          apply_delete?: boolean;
          override_roles?: string[];
          drop_existing?: boolean;
        };
        Returns: undefined;
      };
      create_tenant_request: {
        Args: { workspace_name: string; user_email: string };
        Returns: string;
      };
      decrypt_function_task: {
        Args: { _id: string; _encryption_key: string };
        Returns: Json;
      };
      decrypt_jsonb_payload: {
        Args: { _encrypted: string; _encryption_key: string };
        Returns: Json;
      };
      decrypt_message: {
        Args: { _message_id: string; _decryption_key: string };
        Returns: string;
      };
      decrypt_refresh_token: {
        Args: { _credential_id: string; _encryption_key: string };
        Returns: string;
      };
      delete_expired_oauth_states: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      encrypt_json_payload: {
        Args: { json_data: Json; key: string };
        Returns: string;
      };
      encrypt_jsonb_payload: {
        Args: { _payload: Json; _encryption_key: string };
        Returns: string;
      };
      enqueue_function_task: {
        Args: {
          _action: string;
          _payload: Json;
          _encryption_key: string;
          _priority?: string;
        };
        Returns: string;
      };
      get_conversation_messages: {
        Args:
          | {
              _conversation_id: string;
              _decryption_key?: string;
              _search?: string;
              _metadata_search?: string;
              _role?: string;
              _limit?: number;
              _offset?: number;
              _order?: string;
              _sort_direction?: string;
              _include_deleted?: boolean;
            }
          | {
              _conversation_id: string;
              _decryption_key?: string;
              _search?: string;
              _metadata_search?: string;
              _role?: string;
              _limit?: number;
              _offset?: number;
              _order?: string;
              _sort_direction?: string;
              _include_deleted?: boolean;
              _content_filter?: Json;
              _priority_sort_direction?: string;
            };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v2: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          _content_filter?: Json;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v3: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          _content_filter?: Json;
          _priority_sort_direction?: string;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v4: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          filter?: Json;
          _priority_sort_direction?: string;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v5: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          filter?: Json;
          _priority_sort_direction?: string;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v6: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          filter?: Json;
          _priority_sort_direction?: string;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_conversation_messages_v7: {
        Args: {
          _conversation_id: string;
          _decryption_key?: string;
          _search?: string;
          _metadata_search?: string;
          _role?: string;
          _limit?: number;
          _offset?: number;
          _order?: string;
          _sort_direction?: string;
          _include_deleted?: boolean;
          filter?: Json;
          _priority_sort_direction?: string;
        };
        Returns: Database["public"]["CompositeTypes"]["paginated_messages"];
      };
      get_field_types: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["field_type_enum"][];
      };
      get_message: {
        Args: { _message_id: string; _decryption_key?: string };
        Returns: {
          conversation_id: string;
          id: string;
          tenant_id: string;
          user_id: string;
          reply_to: string;
          content: Json;
          role: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string;
          display_name: string;
          username: string;
          avatar_url: string;
        }[];
      };
      get_message_by_id: {
        Args: { _message_id: string; _decryption_key?: string };
        Returns: Database["public"]["CompositeTypes"]["message_with_profile"][];
      };
      get_next_decrypted_function_tasks: {
        Args: {
          _batch_size: number;
          _encryption_key: string;
          _task_id?: string;
          _priority?: string;
        };
        Returns: Json;
      };
      get_table_schema: {
        Args: { t_name: string };
        Returns: {
          column_name: string;
          data_type: string;
          character_maximum_length: number;
          is_nullable: string;
          column_default: string;
        }[];
      };
      get_user_tenants: {
        Args: { user_id: string };
        Returns: {
          id: string;
          name: string;
          workspace: string;
          tenant_owner_id: string;
          is_primary_tenant: boolean;
        }[];
      };
      halfvec_avg: {
        Args: { "": number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { "": unknown[] };
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
      has_row_permission: {
        Args: { target_tenant_id: string; perms: Json; action: string };
        Returns: boolean;
      };
      hnsw_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      insert_and_trigger_function_task: {
        Args: {
          _action: string;
          _payload: Json;
          _encryption_key: string;
          _function_url: string;
          _service_role_key: string;
        };
        Returns: string;
      };
      insert_credential: {
        Args: {
          _encryption_key: string;
          _access_token: string;
          _refresh_token: string;
          _scopes: string[];
          _type: string;
          _user_id: string;
          _tenant_id: string;
          _expires_at: string;
          _provider: string;
          _encryption_key_id: string;
          _name?: string;
          _domain?: string;
          _password?: string;
          _username?: string;
          _tid?: string;
          _associated_email?: string;
        };
        Returns: string;
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
        Args: { _user_id: string };
        Returns: boolean;
      };
      is_system_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_tenant_owner: {
        Args: { _tenant_id: string };
        Returns: boolean;
      };
      is_tenant_user: {
        Args: { _tenant_id: string };
        Returns: boolean;
      };
      ivfflat_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { "": unknown } | { "": unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: unknown;
      };
      log_webhook_event: {
        Args: {
          _tenant_id: string;
          _payload: Json;
          _encryption_key: string;
          _headers?: Json;
          _connected_service_id?: string;
          _status?: string;
          _error_message?: string;
        };
        Returns: string;
      };
      make_column_unique_to_tenant: {
        Args: { table_name: string; col1: string; constraint_name?: string };
        Returns: undefined;
      };
      mark_function_task_failed: {
        Args: { _id: string; _error: string; _max_retries?: number };
        Returns: undefined;
      };
      mark_function_task_passed: {
        Args: { _id: string };
        Returns: undefined;
      };
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json };
        Returns: {
          id: number;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      set_current_setting: {
        Args: { name: string; value: string };
        Returns: string;
      };
      shared_message_columns: {
        Args: { _decryption_key: string };
        Returns: string;
      };
      sparsevec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      test_encryption_setting: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      update_credential: {
        Args:
          | {
              _credential_id: string;
              _access_token: string;
              _refresh_token: string;
              _expires_at: string;
              _scopes: string[];
              _encryption_key: string;
              _encryption_key_id: string;
            }
          | {
              _credential_id: string;
              _access_token: string;
              _refresh_token: string;
              _expires_at: string;
              _scopes: string[];
              _encryption_key: string;
              _encryption_key_id: string;
              _refresh_failed?: boolean;
            };
        Returns: string;
      };
      update_message: {
        Args: {
          _message_id: string;
          _content: Json;
          _role: string;
          _metadata: Json;
          _encryption_key?: string;
        };
        Returns: boolean;
      };
      update_webhook_event: {
        Args: {
          _id: string;
          _tenant_id: string;
          _status?: string;
          _error_message?: string;
          _processed?: boolean;
        };
        Returns: undefined;
      };
      user_has_custom_role: {
        Args: { _user_id: string; _tenant_id: string; _custom_role_id: string };
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
        Args: { "": number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { "": string } | { "": unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { "": string };
        Returns: number;
      };
      vector_out: {
        Args: { "": string };
        Returns: unknown;
      };
      vector_send: {
        Args: { "": string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { "": unknown[] };
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
      function_task_status: "pending" | "failed" | "finished";
      user_role_type:
        | "admin"
        | "member"
        | "guest"
        | "super-admin"
        | "tenant-owner"
        | "system-admin";
    };
    CompositeTypes: {
      message_with_profile: {
        id: string | null;
        conversation_id: string | null;
        connected_service_id: string | null;
        tenant_id: string | null;
        user_id: string | null;
        reply_to: string | null;
        content: Json | null;
        role: string | null;
        metadata: Json | null;
        created_at: string | null;
        updated_at: string | null;
        deleted_at: string | null;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
      };
      paginated_messages: {
        messages:
          | Database["public"]["CompositeTypes"]["message_with_profile"][]
          | null;
        total_count: number | null;
        has_more: boolean | null;
      };
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      field_type_enum: [
        "text",
        "integer",
        "boolean",
        "reference",
        "timestamp",
        "uuid",
        "number",
        "date",
        "select",
        "email",
        "url",
        "relation",
        "textarea",
      ],
      function_task_status: ["pending", "failed", "finished"],
      user_role_type: [
        "admin",
        "member",
        "guest",
        "super-admin",
        "tenant-owner",
        "system-admin",
      ],
    },
  },
} as const;
