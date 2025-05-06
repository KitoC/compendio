import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withCors } from "@/middleware/withCors";
import { ExternalServiceAiError } from "@/error-types";
import type { Database, Json } from "@/integrations/supabase/types";

type DataTable = Database["public"]["Tables"]["data_tables"]["Row"];
type DataField = Database["public"]["Tables"]["data_fields"]["Row"];
type DataFieldInsert = Database["public"]["Tables"]["data_fields"]["Insert"];

const handler = async (req: Request, context: AuthenticatedContext) => {
  const method = req.method.toUpperCase();
  const {
    supabase_AS_SUPER_ADMIN,
    authService,
    tenantWorkspace,
    customTableService,
  } = context;

  if (method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  if (!authService.tenantId) {
    return new Response("Tenant ID is required", {
      status: 400,
    });
  }

  try {
    const schema = await customTableService.getBase(authService.tenantId);
    const { tables } = schema;

    const { data: existingTables } = await supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .select("*, data_fields(*)")
      .eq("schema_id", customTableService.base_id)
      .eq("source", tenantWorkspace.source);

    const tablesToDelete = existingTables.filter(
      (table: DataTable) =>
        !tables.some((t) => t.external_id === table.external_id)
    );

    await supabase_AS_SUPER_ADMIN
      .from("data_tables")
      .delete()
      .in(
        "id",
        tablesToDelete.map((t: DataTable) => t.id)
      );

    const upsertFields = async (externalFieldsToSync: DataFieldInsert[]) => {
      const { error: fieldError } = await supabase_AS_SUPER_ADMIN
        .from("data_fields")
        .upsert(externalFieldsToSync, {
          onConflict: "external_id, schema_id, source",
        });

      if (fieldError) {
        console.error("Error upserting fields:", fieldError);
      }
    };

    for (const table of tables) {
      const { id: external_id, fields } = table;

      const existingTable = existingTables.find(
        (t: DataTable) => t.external_id === external_id
      );

      const { fields: fieldsOmitted, ...tableWithoutFields } = table;
      const { data: tableRecord, error: tableError } =
        await supabase_AS_SUPER_ADMIN
          .from("data_tables")
          .upsert([tableWithoutFields], {
            onConflict: "external_id, schema_id, source",
          })
          .select()
          .single();

      if (tableError || !tableRecord) {
        console.error("Error upserting table:", tableError);
        continue;
      }

      // TODO: type
      const externalFieldsToSync: DataFieldInsert[] = fields.map((field) => ({
        table_id: tableRecord.id,
        schema: field as unknown as Json,
        tenant_id: authService.tenantId as string,
        external_id: field.id as string,
        source: "airtable",
        schema_id: customTableService.base_id,
        schema_name: schema.name,
        permissions: {},
      }));

      if (existingTable) {
        const fieldsToDelete = existingTable?.data_fields.filter(
          (field: DataField) =>
            !externalFieldsToSync.some(
              (f) => f.external_id === field.external_id
            )
        );

        await supabase_AS_SUPER_ADMIN
          .from("data_fields")
          .delete()
          .in(
            "id",
            fieldsToDelete.map((f: DataField) => f.id)
          );

        await upsertFields(externalFieldsToSync);
      } else {
        await upsertFields(externalFieldsToSync);
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
