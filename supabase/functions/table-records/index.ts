// supabase/functions/airtable-records.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import { withCors } from "locals/middleware/withCors";
import type { Database } from "@/integrations/supabase/types";
import type { AirtableRecord, AirtableField } from "@/types/airtable";

type DataField = Database["public"]["Tables"]["data_fields"]["Row"];
type DataTableRecordLabel =
  Database["public"]["Tables"]["data_table_record_labels"]["Row"];

const handler = async (req: Request, context: AuthenticatedContext) => {
  const {
    airtableService,
    dataTablesService,
    corsHeaders,
    supabase_AS_SUPER_ADMIN,
  } = context;
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

          const recordFieldMap: Record<string, string> = {};
          const fieldRecordMap: Record<
            string,
            Record<string, string | string[]>
          > = {};

          data.forEach((record: AirtableRecord) => {
            fieldRecordMap[record.id] = {};

            Object.entries(record.fields).forEach(([key, field]) => {
              if (typeof field === "string" && field.startsWith("rec")) {
                recordFieldMap[field] = key;
                fieldRecordMap[record.id][key] = field;
              }

              if (Array.isArray(field)) {
                field.forEach((item) => {
                  if (typeof item === "string" && item.startsWith("rec")) {
                    recordFieldMap[item] = key;
                    fieldRecordMap[record.id][key] = fieldRecordMap[record.id][
                      key
                    ]
                      ? [...fieldRecordMap[record.id][key], item]
                      : [item];
                  }
                });
              }
            });
          });

          const { data: labels } = await supabase_AS_SUPER_ADMIN
            .from("data_table_record_labels")
            .select("*")
            .in("record_id", Object.keys(recordFieldMap));

          data.map((record: AirtableRecord) => {
            const fieldRecordMapping = fieldRecordMap[record.id];

            record.labels = {};

            Object.entries(fieldRecordMapping).forEach(([key, field]) => {
              if (!record.labels) {
                record.labels = {};
              }

              if (typeof field === "string") {
                record.labels[key] = labels.find(
                  (label: DataTableRecordLabel) => label.record_id === field
                );
              }

              if (Array.isArray(field)) {
                record.labels[key] = field.map((item: string) => {
                  const label = labels.find(
                    (label: DataTableRecordLabel) => label.record_id === item
                  );

                  return label;
                });
              }
            });

            return { ...record };
          });

          return Response.json({ data }, { headers: corsHeaders });
        }

      case "POST": {
        const body = await req.json();
        const data = await airtableService.createRecord(table, body.fields);

        await dataTablesService.upsertLabel({
          record: data,
          base_id: airtableService.base_id,
          table,
          tenant_id: context.authService.tenantId as string,
        });

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
          base_id: airtableService.base_id,
          table,
        });

        const data = await airtableService.updateRecord(
          table,
          recordId,
          cleanedBody
        );

        await dataTablesService.upsertLabel({
          record: data,
          base_id: airtableService.base_id,
          table,
          tenant_id: context.authService.tenantId as string,
        });

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
