import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { withCors } from "locals/middleware/withCors";

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

    for (const table of tables) {
      const { id: external_id, name, fields, primaryFieldId } = table;

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
      const fieldRecords = fields.map((field) => ({
        table_id: tableRecord.id,
        schema: field,
        tenant_id: authService.tenantId,
        external_id: field.id,
        source: "airtable",
        schema_id: airtableService.base_id,
        schema_name: schema.name,
        permissions: {},
      }));

      const { error: fieldError } = await supabase_AS_SUPER_ADMIN
        .from("data_fields")
        .upsert(fieldRecords, { onConflict: "external_id, schema_id, source" });

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
    return new Response("Internal Server Error", { status: 500 });
  }
};

serve(withCors()(withErrorBoundary(withAuthenticatedContext(handler))));
