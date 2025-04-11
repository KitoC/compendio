// supabase/functions/airtable-records.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { withCors } from "locals/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { airtableService, corsHeaders } = context;
  const { searchParams } = new URL(req.url);
  const method = req.method.toUpperCase();

  const table = searchParams.get("table");
  const recordId = searchParams.get("recordId") ?? undefined;
  const query = req.url.includes("?")
    ? req.url.slice(req.url.indexOf("?"))
    : "";

  if (!table) {
    return new Response("Missing 'table' parameter", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    switch (method) {
      case "GET":
        if (recordId) {
          const data = await airtableService.retrieveRecord(table, recordId);

          return Response.json({ data }, { headers: corsHeaders });
        } else {
          const { records: data } = await airtableService.listRecords(
            table,
            query
          );

          return Response.json({ data }, { headers: corsHeaders });
        }

      case "POST": {
        const body = await req.json();
        const data = await airtableService.createRecord(table, body.fields);
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
        const data = await airtableService.updateRecord(
          table,
          recordId,
          body.fields
        );
        return Response.json({ data }, { headers: corsHeaders });
      }

      case "DELETE": {
        if (!recordId) {
          return new Response("Missing 'recordId' parameter for delete", {
            status: 400,
            headers: corsHeaders,
          });
        }
        const data = await airtableService.deleteRecord(table, recordId);
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
