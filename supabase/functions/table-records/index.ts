// supabase/functions/airtable-records.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const {
    customTableService,
    dataTablesService,
    corsHeaders,
    tenantWorkspace,
  } = context;
  const { searchParams } = new URL(req.url);

  const method = req.method.toUpperCase();

  const tableId = searchParams.get("table");
  const recordId =
    (searchParams.get("recordId") || searchParams.get("id")) ?? undefined;

  searchParams.delete("table");
  searchParams.delete("recordId");

  const query = searchParams.toString();

  if (!tableId) {
    return new Response("Missing 'table' parameter", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const table = await dataTablesService.getTableSchema({
    external_id: tableId,
    source: tenantWorkspace.source,
  });

  try {
    switch (method) {
      case "GET":
        if (recordId) {
          const data = await customTableService.retrieveRecord(table, recordId);

          return Response.json({ data }, { headers: corsHeaders });
        } else {
          const response = await customTableService.listRecords(table, query);

          return Response.json(response, { headers: corsHeaders });
        }

      case "POST": {
        const body = await req.json();
        const data = await customTableService.createRecord(table, body);

        // await dataTablesService.upsertLabel({
        //   record: data,
        //   base_id: customTableService.base_id,
        //   table,
        //   tenant_id: context.authService.tenantId as string,
        // });

        return Response.json({ data }, { status: 201, headers: corsHeaders });
      }

      case "PATCH": {
        if (!recordId) {
          return new Response("Missing 'recordId' parameter for update", {
            status: 400,
            headers: corsHeaders,
          });
        }
        const body = await req.json();

        const cleanedBody = await dataTablesService.prepareRecordForUpsert({
          body,
          source: table.source,
          external_table_id: table.external_id,
        });

        const data = await customTableService.updateRecord(
          table,
          recordId,
          cleanedBody
        );

        // await dataTablesService.upsertLabel({
        //   record: data,
        //   base_id: customTableService.base_id,
        //   table,
        //   tenant_id: context.authService.tenantId as string,
        // });

        return Response.json({ data }, { headers: corsHeaders });
      }

      case "DELETE": {
        if (!recordId) {
          return new Response("Missing 'recordId' parameter for delete", {
            status: 400,
            headers: corsHeaders,
          });
        }
        const data = await customTableService.deleteRecord(table, recordId);

        await dataTablesService.deleteLabel({
          table,
          record_id: recordId,
        });

        return Response.json({ data }, { headers: corsHeaders });
      }

      default:
        return new Response("Method not allowed", {
          status: 405,
          headers: corsHeaders,
        });
    }
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify(err), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(withCors()(withErrorBoundary(withAuthenticatedContext(handler))));
