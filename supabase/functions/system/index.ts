import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import {
  withAuthenticatedContext,
  AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withCors } from "locals/middleware/withCors";
import { READONLY_FIELDS_AIRTABLE } from "locals/consts";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { corsHeaders } = context;

  const method = req.method.toUpperCase();

  switch (method) {
    case "GET":
      return new Response(
        JSON.stringify({
          configs: {},
          consts: { READONLY_FIELDS_AIRTABLE },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

    default:
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
  }
};

const corsConfig = {
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id",
  },
};

serve(
  withCors(corsConfig)(withErrorBoundary(withAuthenticatedContext(handler)))
);
