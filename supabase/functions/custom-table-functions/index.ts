
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

      // Wait a moment for triggers to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force creation of the physical table
      const rpcResult = await supabaseAdmin.rpc("create_custom_table", {
        table_name: data.name
      }).single();

      return new Response(
        JSON.stringify({
          success: true,
          data: data,
          rpc: rpcResult
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
