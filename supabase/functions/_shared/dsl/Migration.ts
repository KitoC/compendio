import {
  SupabaseClient,
  // @ts-expect-error - Supabase client is not typed
} from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { BaseDSLLayer } from "locals/dsl/_BaseDSLLayer";

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "email"
  | "url"
  | "relation"
  | "textarea"
  | "date";

export interface FieldRelation {
  table: string;
  field: string;
  type?: "one-to-many" | "many-to-one" | "one-to-one" | "many-to-many";
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  regex?: string;
  min?: number;
  max?: number;
}

export interface FieldDefinition {
  name: string;
  display_name: string;
  description?: string;
  field_type: FieldType;
  required?: boolean;
  unique?: boolean;
  default_value?: unknown;
  options?: unknown[];
  relation?: FieldRelation;
  validation?: FieldValidation;
}

export interface TableDefinition {
  name: string;
  display_name: string;
  description?: string;
  fields: FieldDefinition[];
}

export type RelationshipType =
  | "one-to-many"
  | "many-to-one"
  | "one-to-one"
  | "many-to-many";

export interface TableRelationship {
  from_table: string;
  from_field: string;
  to_table: string;
  to_field: string;
  relationship_type: RelationshipType;
}

export interface JsonSchemaPayload {
  schema: {
    tables: TableDefinition[];
    relationships: TableRelationship[];
  };
}

export interface MigrationAction {
  type:
    | "create_table"
    | "rename_table"
    | "delete_table"
    | "rename_field"
    | "change_field_type"
    | "relationship";
  name?: string;
  old_name?: string;
  new_name?: string;
  table?: string;
  field?: string;
  new_type?: string;
  display_name?: string;
  description?: string;
  fields?: FieldDefinition[];
  from_table?: string;
  from_field?: string;
  to_table?: string;
  to_field?: string;
  relationship_type?: RelationshipType;
}
export class Migration extends BaseDSLLayer {
  name: string;
  actions: MigrationAction[];
  rollbackActions: MigrationAction[];

  constructor(name: string) {
    super();
    this.name = name;
    this.actions = [];
    this.rollbackActions = [];
  }

  static async fromSchemaJson(
    json: JsonSchemaPayload,
    supabase: SupabaseClient
  ): Promise<Migration> {
    const m = new Migration("generated-from-schema");

    for (const table of json.schema.tables) {
      m.actions.push({
        type: "create_table",
        name: table.name,
        display_name: table.display_name,
        description: table.description,
        fields: table.fields.map((f: FieldDefinition) => ({
          name: f.name,
          display_name: f.display_name,
          field_type: f.field_type,
          required: f.required,
          unique: f.unique,
          default_value: f.default_value,
          options: f.options,
          description: f.description,
          relation: f.field_type === "relation" ? f.relation : undefined,
        })),
      });
      m.rollbackActions.push({ type: "delete_table", name: table.name });
    }

    if (json.schema.relationships) {
      for (const rel of json.schema.relationships) {
        if (rel.relationship_type === "many-to-many") {
          const joinTable = `${rel.from_table}_${rel.to_table}`.toLowerCase();
          m.actions.push({
            type: "create_table",
            name: joinTable,
            display_name: joinTable
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            description: `Join table for many-to-many between ${rel.from_table} and ${rel.to_table}`,
            fields: [
              {
                name: `${rel.from_table.slice(0, -1)}_id`,
                display_name: `${rel.from_table.slice(0, -1)} ID`,
                field_type: "relation",
                required: true,
                relation: { table: rel.from_table, field: rel.from_field },
              },
              {
                name: `${rel.to_table.slice(0, -1)}_id`,
                display_name: `${rel.to_table.slice(0, -1)} ID`,
                field_type: "relation",
                required: true,
                relation: { table: rel.to_table, field: rel.to_field },
              },
            ],
          });
          m.rollbackActions.push({ type: "delete_table", name: joinTable });
        } else {
          m.actions.push({
            type: "relationship",
            from_table: rel.from_table,
            from_field: rel.from_field,
            to_table: rel.to_table,
            to_field: rel.to_field,
            relationship_type: rel.relationship_type,
          });
        }
      }
    }

    await supabase.from("custom_migrations").insert({
      name: m.name,
      migration: m.actions,
      rollback: m.rollbackActions,
      success: false,
      applied_at: null,
    });

    return m;
  }

  toSchemaJson(): {
    schema: { tables: TableDefinition[]; relationships: TableRelationship[] };
  } {
    const tables: TableDefinition[] = this.actions
      .filter((a) => a.type === "create_table")
      .map((a) => ({
        name: a.name,
        display_name: a.display_name,
        description: a.description,
        fields: (a.fields || []).map((f: FieldDefinition) => ({
          name: f.name,
          display_name: f.display_name,
          description: f.description,
          field_type: f.field_type,
          required: f.required ?? false,
          unique: f.unique ?? false,
          default_value: f.default_value ?? null,
          options: f.options ?? null,
          relation: f.relation ?? null,
        })),
      }));

    const relationships: TableRelationship[] = this.actions
      .filter((a) => a.type === "relationship")
      .map((r) => ({
        from_table: r.from_table,
        from_field: r.from_field,
        to_table: r.to_table,
        to_field: r.to_field,
        relationship_type: r.relationship_type,
      }));

    return { schema: { tables, relationships } };
  }

  async apply(
    supabase: SupabaseClient,
    tenantId: string
  ): Promise<{
    insert_custom_tables_response: any;
    migrations_response: any;
    insertion_data: any;
  }> {
    if (!this.actions.length) throw new Error("No actions to apply");

    const tables = this.actions
      .filter((a) => a.type === "create_table")
      .map((a) => ({
        name: a.name,
        display_name: a.display_name,
        description: a.description,
        fields: (a.fields || []).map((f: FieldDefinition) => ({
          name: f.name,
          display_name: f.display_name,
          description: f.description,
          field_type: f.field_type,
          required: f.required ?? false,
          unique: f.unique ?? false,
          default_value: f.default_value ?? null,
          options: f.options ?? null,
          relation: f.relation ?? null,
          validation: f.validation ?? null,
        })),
      }));

    const relationships = this.actions
      .filter((a) => a.type === "relationship")
      .map((r) => ({
        from_table: r.from_table,
        from_field: r.from_field,
        to_table: r.to_table,
        to_field: r.to_field,
        relationship_type: r.relationship_type,
      }));

    const insertion_data = {
      schema_data: { tables, relationships },
      input_tenant_id: tenantId,
    };

    const insert_custom_tables_response = await supabase.rpc(
      "insert_custom_tables",
      insertion_data
    );

    if (insert_custom_tables_response.error) {
      this.throwError(
        "Failed to create tables",
        insert_custom_tables_response.error,
        500
      );
    }

    const migrations_response = await supabase
      .from("custom_migrations")
      .update({ success: true, applied_at: new Date() })
      .eq("name", this.name);

    if (migrations_response.error) {
      this.throwError(
        "Failed to apply migrations",
        migrations_response.error,
        500
      );
    }

    return {
      insert_custom_tables_response,
      migrations_response,
      insertion_data,
    };
  }

  async rollback(supabase: SupabaseClient, tenantId: string): Promise<void> {
    for (const action of this.rollbackActions) {
      if (action.type === "delete_table") {
        await supabase
          .from("custom_table_definitions")
          .delete()
          .eq("name", action.name)
          .eq("tenant_id", tenantId);
      }
    }
    await supabase
      .from("custom_migrations")
      .update({ success: false, applied_at: null })
      .eq("name", this.name);
  }

  validate(): string[] {
    const errors: string[] = [];

    for (const action of this.actions) {
      if (action.type === "create_table") {
        if (!action.name) errors.push("Table name missing");
        if (!Array.isArray(action.fields) || !action.fields.length) {
          errors.push(`Table ${action.name} has no fields`);
        }

        for (const f of action.fields || []) {
          if (!f.name || !f.field_type) {
            errors.push(`Invalid field in table ${action.name}: ${f.name}`);
          }
        }
      }
    }

    return errors;
  }
}
