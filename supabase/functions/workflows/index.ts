import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  withAuthenticatedContext,
  type AuthenticatedContext,
} from "@/middleware/withAuthenticatedContext";
import { withErrorBoundary } from "@/middleware/withErrorBoundary";
import { withCors } from "@/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { workflowsService, corsHeaders, authService } = context;
  const { searchParams } = new URL(req.url);
  const method = req.method.toUpperCase();

  if (!authService.tenant) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  const id = searchParams.get("id") ?? undefined;
  const tag_id = authService.tenant?.tag_id;
  const workspaceTag = await workflowsService.getWorkspaceTag(tag_id as string);

  if (!workspaceTag) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    switch (method) {
      case "GET":
        if (id) {
          const data = await workflowsService.getWorkflow(id);

          return Response.json({ data }, { headers: corsHeaders });
        } else {
          const data = await workflowsService.getWorkflows(workspaceTag.name);

          return Response.json({ data }, { headers: corsHeaders });
        }

      case "POST": {
        const body = await req.json();

        const data = await workflowsService.createWorkflow(workspaceTag, {
          ...body,
          tenant_id: authService.tenant?.id,
          user_id: authService.user?.id,
        });

        return Response.json({ data }, { status: 201, headers: corsHeaders });
      }

      case "PATCH": {
        if (!id) {
          return new Response("Missing 'id' parameter for update", {
            status: 400,
            headers: corsHeaders,
          });
        }
        const body = await req.json();

        const data = await workflowsService.updateWorkflow(workspaceTag, {
          ...body,
          id,
        });

        return Response.json({ data }, { headers: corsHeaders });
      }

      case "DELETE": {
        if (!id) {
          return new Response("Missing 'id' parameter for delete", {
            status: 400,
            headers: corsHeaders,
          });
        }

        await workflowsService.deleteWorkflow(workspaceTag, id);

        return Response.json({ success: true }, { headers: corsHeaders });
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
