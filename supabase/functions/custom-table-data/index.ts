import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Supabase client is not typed
import { createClient } from "supabase-js";
import { Database } from "../shared/types.ts";
import Logger from "../shared/utils/logger.ts";
import { getEnvKey } from "../shared/utils/env.ts";

const logger = new Logger({ debug: getEnvKey("DEBUG") });

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Helper function to create a Supabase client
const createSupabaseClient = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  // Get Supabase URL and service role key from environment variables
  const supabaseUrl = getEnvKey("SUPABASE_URL");
  const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
};

// Validate the data against field definitions
async function validateData(
  supabase: ReturnType<typeof createSupabaseClient>,
  tableId: string,
  data: Record<string, unknown>
) {
  // Fetch table fields
  const { data: fields, error: fieldsError } = await supabase
    .from("custom_table_fields")
    .select("*")
    .eq("table_id", tableId)
    .is("deleted_at", null);

  if (fieldsError) {
    throw new Error(`Failed to fetch table fields: ${fieldsError.message}`);
  }

  const validationErrors: string[] = [];

  // Check required fields
  for (const field of fields) {
    const fieldName = field.name;

    // Check if required field is missing
    if (
      field.is_required &&
      (data[fieldName] === undefined || data[fieldName] === null)
    ) {
      validationErrors.push(`Field '${field.display_name}' is required`);
      continue;
    }

    // Skip validation for empty optional fields
    if (data[fieldName] === undefined || data[fieldName] === null) {
      continue;
    }

    // Type validation based on field_type
    switch (field.field_type) {
      case "integer":
        if (
          typeof data[fieldName] !== "number" ||
          !Number.isInteger(data[fieldName])
        ) {
          validationErrors.push(
            `Field '${field.display_name}' must be an integer`
          );
        }
        break;
      case "boolean":
        if (typeof data[fieldName] !== "boolean") {
          validationErrors.push(
            `Field '${field.display_name}' must be a boolean`
          );
        }
        break;
      case "timestamp":
        try {
          if (isNaN(Date.parse(String(data[fieldName])))) {
            validationErrors.push(
              `Field '${field.display_name}' must be a valid date/time`
            );
          }
        } catch (e) {
          validationErrors.push(
            `Field '${field.display_name}' must be a valid date/time`
          );
        }
        break;
      case "uuid":
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (
          typeof data[fieldName] !== "string" ||
          !uuidPattern.test(String(data[fieldName]))
        ) {
          validationErrors.push(
            `Field '${field.display_name}' must be a valid UUID`
          );
        }
        break;
      case "reference":
        // Reference validation could be added here if needed
        break;
    }

    // Check unique constraint
    if (field.is_unique) {
      const { data: existingData, error: uniqueError } = await supabase
        .from("custom_table_data")
        .select("id")
        .eq("table_id", tableId)
        .filter(`data->>${fieldName}`, "eq", String(data[fieldName]))
        .limit(1);

      if (uniqueError) {
        throw new Error(`Failed to check uniqueness: ${uniqueError.message}`);
      }

      if (existingData && existingData.length > 0) {
        validationErrors.push(`Field '${field.display_name}' must be unique`);
      }
    }
  }

  return validationErrors;
}

// Get table data with pagination, filtering, and searching
async function getTableData(
  supabase: ReturnType<typeof createSupabaseClient>,
  request: Request
) {
  try {
    const url = new URL(request.url);
    const tableId = url.searchParams.get("tableId");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const sortField = url.searchParams.get("sortField") || "created_at";
    const sortDirection = url.searchParams.get("sortDirection") || "desc";
    const searchTerm = url.searchParams.get("search") || "";

    // Get filters from query params - format is filter[fieldName]=value
    const filters: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("filter[") && key.endsWith("]")) {
        const fieldName = key.substring(7, key.length - 1);
        filters[fieldName] = value;
      }
    }

    if (!tableId) {
      return new Response(
        JSON.stringify({ error: "Missing tableId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let query = supabase
      .from("custom_table_data")
      .select("*", { count: "exact" })
      .eq("table_id", tableId)
      .is("deleted_at", null);

    // Apply search if provided
    if (searchTerm) {
      // This is a simplistic approach to searching JSON data
      // In a real application, you might want more sophisticated search
      query = query.or(`data.ilike.%${searchTerm}%`);
    }

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
      query = query.filter(`data->>${field}`, "eq", value);
    }

    // Apply sorting
    // For JSON data, we need to cast the field to the appropriate type for sorting
    if (sortField === "created_at" || sortField === "updated_at") {
      query = query.order(sortField, { ascending: sortDirection === "asc" });
    } else {
      // Sort by a field in the data JSON
      query = query.order(`data->>${sortField}`, {
        ascending: sortDirection === "asc",
      });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch table data: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        data,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
          totalItems: count || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching table data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Create a new table record
async function createTableRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  request: Request
) {
  try {
    const { tableId, data, tenantId } = await request.json();

    if (!tableId || !data || !tenantId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: tableId, data, or tenantId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate the data
    const validationErrors = await validateData(supabase, tableId, data);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get table name
    const { data: tableData, error: tableError } = await supabase
      .from("custom_table_definitions")
      .select("name")
      .eq("id", tableId)
      .single();

    if (tableError) {
      throw new Error(
        `Failed to fetch table definition: ${tableError.message}`
      );
    }

    // Insert the record
    const { data: newRecord, error: insertError } = await supabase
      .from("custom_table_data")
      .insert({
        table_id: tableId,
        data,
        tenant_id: tenantId,
        table_name: tableData.name,
        metadata: {
          // created_by: user.id,
          // created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create record: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ data: newRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating table record:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Update an existing table record
async function updateTableRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  request: Request
) {
  try {
    const { id, tableId, data } = await request.json();

    if (!id || !tableId || !data) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: id, tableId, or data",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if record exists
    const { data: existingRecord, error: recordError } = await supabase
      .from("custom_table_data")
      .select("id")
      .eq("id", id)
      .eq("table_id", tableId)
      .is("deleted_at", null)
      .single();

    if (recordError) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the data
    const validationErrors = await validateData(supabase, tableId, data);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logger.debug("Updating record", { id, tableId, data });
    // Update the record
    const { data: updatedRecord, error: updateError } = await supabase
      .from("custom_table_data")
      .update({
        data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update record: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ data: updatedRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating table record:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Delete (soft delete) a table record
async function deleteTableRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  request: Request
) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Soft delete the record
    const { error: deleteError } = await supabase
      .from("custom_table_data")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete record: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting table record:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Get a single table record by ID
async function getTableRecordById(
  supabase: ReturnType<typeof createSupabaseClient>,
  request: Request
) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("custom_table_data")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Record not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Failed to fetch record: ${error.message}`);
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching record:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(async (req: Request) => {
  logger.info("Custom Table Data API", req.method);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Route the request based on method and path
    if (req.method === "GET") {
      if (path === "get") {
        return await getTableData(supabase, req);
      } else if (path === "getById") {
        return await getTableRecordById(supabase, req);
      }
    } else if (req.method === "POST" && path === "create") {
      return await createTableRecord(supabase, req);
    } else if (req.method === "PUT" && path === "update") {
      return await updateTableRecord(supabase, req);
    } else if (req.method === "DELETE" && path === "delete") {
      return await deleteTableRecord(supabase, req);
    }

    // If no route matches
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
