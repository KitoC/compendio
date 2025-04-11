import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { withCors } from "locals/middleware/withCors";
import { ExternalServiceAiError } from "locals/error-types";
import type { Database } from "@/integrations/supabase/types";

type DataTable = Database["public"]["Tables"]["data_tables"]["Row"];
type DataField = Database["public"]["Tables"]["data_fields"]["Row"];

const handler = async (req: Request, context: AuthenticatedContext) => {
  const method = req.method.toUpperCase();
  const { airtableService, supabase_AS_SUPER_ADMIN, authService } = context;

  if (method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  try {
    const schema = await airtableService.getBase();
    const { tables } = schema;

    const { data: existingTables } = await supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .select("*, data_fields(*)")
      .eq("schema_id", airtableService.base_id)
      .eq("source", "airtable");

    const tablesToDelete = existingTables.filter(
      (table: DataTable) => !tables.some((t) => t.id === table.external_id)
    );

    await supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .delete()
      .in(
        "id",
        tablesToDelete.map((t: DataTable) => t.id)
      );

    for (const table of tables) {
      const { id: external_id, name, fields, primaryFieldId, views } = table;

      const existingTable = existingTables.find(
        (t: DataTable) => t.external_id === external_id
      );

      const { data: tableRecord, error: tableError } =
        await supabase_AS_SUPER_ADMIN
          .from("data_tables")
          .upsert(
            [
              {
                name,
                display_name: name,
                external_id,
                source: "airtable",
                schema_id: airtableService.base_id,
                tenant_id: authService.tenantId,
                permissions: {},
                schema_name: schema.name,
                primary_field_id: primaryFieldId,
                views,
              },
            ],
            { onConflict: "external_id, schema_id, source" }
          )
          .select()
          .single();

      if (tableError || !tableRecord) {
        console.error("Error upserting table:", tableError);
        continue;
      }

      // TODO: type
      const externalFieldsToSync = fields.map((field) => ({
        table_id: tableRecord.id,
        schema: field,
        tenant_id: authService.tenantId,
        external_id: field.id,
        source: "airtable",
        schema_id: airtableService.base_id,
        schema_name: schema.name,
        permissions: {},
      }));

      const fieldsToDelete = existingTable.data_fields.filter(
        (field: DataField) =>
          !externalFieldsToSync.some((f) => f.external_id === field.external_id)
      );

      await supabase_AS_SUPER_ADMIN
        .from("data_fields")
        .delete()
        .in(
          "id",
          fieldsToDelete.map((f: DataField) => f.id)
        );

      const { error: fieldError } = await supabase_AS_SUPER_ADMIN
        .from("data_fields")
        .upsert(externalFieldsToSync, {
          onConflict: "external_id, schema_id, source",
        });

      if (fieldError) {
        console.error("Error upserting fields:", fieldError);
      }
    }

    return new Response(
      JSON.stringify({ message: "Schema synced successfully" }),
      {
        headers: { ...context.corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("Unexpected error while syncing schema:", err);

    const error = (err as Error).message
      ? (err as ExternalServiceAiError)
      : { message: "An unknown error occurred", status: 500 };

    return new Response(JSON.stringify(error), {
      headers: { ...context.corsHeaders, "Content-Type": "application/json" },
      status: error?.status as number,
    });
  }
};

serve(withCors()(withErrorBoundary(withAuthenticatedContext(handler))));
