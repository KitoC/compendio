import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { workflowsService, corsHeaders } = context;
  const { searchParams } = new URL(req.url);
  const method = req.method.toUpperCase();

  const id = searchParams.get("id") ?? undefined;

  try {
    switch (method) {
      case "GET":
        if (id) {
          return Response.json({ data: null }, { headers: corsHeaders });
        } else {
          return Response.json({ data: [] }, { headers: corsHeaders });
        }

      case "POST": {
        return Response.json(
          { data: null },
          { status: 201, headers: corsHeaders }
        );
      }

      case "PATCH": {
        if (!id) {
          return new Response("Missing 'id' parameter for update", {
            status: 400,
            headers: corsHeaders,
          });
        }

        return Response.json({ data: null }, { headers: corsHeaders });
      }

      case "DELETE": {
        if (!id) {
          return new Response("Missing 'id' parameter for delete", {
            status: 400,
            headers: corsHeaders,
          });
        }

        return Response.json({ data: null }, { headers: corsHeaders });
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
