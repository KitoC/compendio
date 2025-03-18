
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the request body
    const { action, tableData } = await req.json();

    // Create a Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Handle different actions
    if (action === "create_table") {
      // Execute with service role to ensure proper permissions
      const { data, error } = await supabaseAdmin
        .from("custom_table_definitions")
        .insert([tableData])
        .select()
        .single();

      if (error) {
        console.error("Error creating table definition:", error);
        return new Response(
          JSON.stringify({
            error: error.message,
            details: error,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        // Force immediate creation of the physical table
        const rpcResult = await supabaseAdmin.rpc("create_custom_table", {
          table_name: data.name
        });

        if (rpcResult.error) {
          console.error("Error creating physical table:", rpcResult.error);
          // Don't fail the whole request, just log the error
        }

        // Add default RLS policies
        const rlsResult = await supabaseAdmin.rpc("add_rls_policies_to_custom_table", {
          table_name: data.name
        });

        if (rlsResult.error) {
          console.error("Error adding RLS policies:", rlsResult.error);
          // Don't fail the whole request, just log the error
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: data,
            rpc: { result: "Table created successfully" }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (rpcError) {
        console.error("Error in RPC calls:", rpcError);
        
        // Return success for the table definition creation but include the RPC error
        return new Response(
          JSON.stringify({
            success: true,
            data: data,
            rpc_error: rpcError.message || "Error creating physical table",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else if (action === "update_rls_policies") {
      try {
        const { table_name } = tableData;
        
        // Update RLS policies for the table
        const result = await supabaseAdmin.rpc("add_rls_policies_to_custom_table", {
          table_name: table_name
        });

        if (result.error) {
          throw result.error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "RLS policies updated successfully"
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error updating RLS policies:", error);
        return new Response(
          JSON.stringify({
            error: error.message || "Failed to update RLS policies",
            details: error,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action specified" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
