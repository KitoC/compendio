import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCors } from "@/middleware/withCors";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withRequestHandlers } from "@/middleware/withRequestHandlers";
import {
  AuthenticatedContext,
  withAuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { parse as parseCSV } from "https://deno.land/std@0.224.0/csv/mod.ts";
import { getEnvKey } from "@/utils/env";
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";
import Logger from "@/utils/Logger";

const OPENAI_API_KEY = getEnvKey("OPENAI_API_KEY");
const logger = new Logger({ name: "import-quote-items" });

interface ImportQuoteItemsContext {
  corsHeaders: Record<string, string>;
  // Add any other context properties/services needed
}

const handler = async (req: Request, context: AuthenticatedContext) => {
  const JSON_HEADERS = {
    ...context.corsHeaders,
    "Content-Type": "application/json",
  };

  try {
    const { supabase_AS_SUPER_ADMIN, supabase } = context;
    // Parse multipart form
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        headers: JSON_HEADERS,
        status: 400,
      });
    }
    const boundary = contentType.split("boundary=")[1];

    if (!boundary) {
      return new Response(JSON.stringify({ error: "Missing boundary" }), {
        headers: JSON_HEADERS,
        status: 400,
      });
    }

    const form = await multiParser(req);
    const table = form.fields["table"];
    const file = form.files?.["file"];

    if (!file || !table) {
      return new Response(
        JSON.stringify({ error: "Missing file or table param" }),
        {
          headers: {
            ...context.corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }

    // Fetch table schema
    const { data: columns, error: schemaError } =
      await supabase_AS_SUPER_ADMIN.rpc("get_table_schema", {
        t_name: table,
      });

    logger.info("Getting schema for table: ", table);

    if (schemaError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch table schema",
          details: schemaError.message,
        }),
        {
          headers: JSON_HEADERS,
          status: 500,
        }
      );
    }

    // Parse CSV headers and sample rows
    const csvText = new TextDecoder().decode(await file.content);

    logger.info("Parsing CSV");
    const rows: string[][] = [...parseCSV(csvText, { skipFirstRow: false })];

    logger.info("Rows found: ", rows.length);

    const headers: string[] = rows[0];
    const sampleRows: string[][] = rows.slice(1, 6);

    // Use OpenAI to determine mapping (via fetch, new responses API)
    const prompt = `
  Given the following Supabase table schema:
  ${JSON.stringify(columns, null, 2)}
  
  And the following CSV headers:
  ${JSON.stringify(headers)}
  
  And a sample row:
  ${JSON.stringify(sampleRows[0])}
  
  Map each CSV column to the most appropriate table column. Return a JSON object where keys are CSV headers and values are table column names. If no match, use null.
  If the table column is a an id, use the external_id column.
  `;

    logger.info("Sending to openai for mapping: ");
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or gpt-4-mini if available
          messages: [{ role: "user", content: prompt }],
          max_tokens: 512,
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        {
          headers: JSON_HEADERS,
          status: 500,
        }
      );
    }

    const openaiJson = await openaiResponse.json();

    logger.info("OpenAI response: ", openaiJson);

    let mapping: Record<string, string | null>;

    try {
      mapping = JSON.parse(openaiJson.choices[0].message.content);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI mapping",
          details: openaiJson.choices[0].message.content,
        }),
        {
          headers: JSON_HEADERS,
          status: 500,
        }
      );
    }

    logger.info("Mapping: ", mapping);

    // Map and filter CSV data
    const mappedRows = rows.slice(1).map((row: string[], index: number) => {
      const obj: Record<string, string | number> = {};

      headers.forEach((header: string, i: number) => {
        const tableCol = mapping[header];

        if (tableCol) {
          const { data_type } = columns.find(
            (col: { column_name: string; data_type: string }) =>
              col.column_name === tableCol
          );
          const value = row[i];

          if (["numeric", "integer"].includes(data_type)) {
            obj[tableCol] = value.includes(".")
              ? parseFloat(value || "0")
              : parseInt(value || "0");
          } else {
            obj[tableCol] = value;
          }
        }
      });

      return { ...obj, tenant_id: context.tenant_id };
    });

    // logger.info("Mapped rows: ", mappedRows);

    // Upsert to Supabase
    const { data: upserted, error: upsertError } = await supabase
      .from(table)
      .upsert(mappedRows, { onConflict: "external_id, tenant_id" });

    logger.info("Upserted rows: ", upserted);

    if (upsertError) {
      return new Response(
        JSON.stringify({
          error: "Upsert failed",
          details: upsertError.message,
        }),
        {
          headers: {
            ...context.corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Import complete",
        mapping,
        inserted: upserted?.length ?? 0,
      }),
      {
        headers: JSON_HEADERS,
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: JSON_HEADERS,
      status: 500,
    });
  }
};

serve(withCors()(withErrorBoundary(withAuthenticatedContext(handler))));
