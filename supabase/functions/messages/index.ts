import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRequestHandlers } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import {
  withAuthenticatedContext,
  AuthenticatedContext,
} from "locals/middleware/withAuthenticatedContext";
import { withCors } from "locals/middleware/withCors";

const handler = async (req: Request, context: AuthenticatedContext) => {
  const { messagesService } = context;
  const { searchParams } = new URL(req.url);
  const method = req.method.toUpperCase();

  switch (method) {
    case "GET": {
      const conversation_id = searchParams.get("conversation_id")!;
      const search = searchParams.get("search") || undefined;
      const metadata_search = searchParams.get("metadata_search") || undefined;
      const role = searchParams.get("role") || undefined;
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const order = searchParams.get("order") || "created_at";
      const sort_direction =
        (searchParams.get("sort_direction") as "asc" | "desc") || "asc";
      const include_deleted = searchParams.get("include_deleted") === "true";

      const result = await messagesService.getConversationMessages({
        conversation_id,
        search,
        metadata_search,
        role,
        limit,
        offset,
        order,
        sort_direction,
        include_deleted,
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    case "POST": {
      const body = await req.json();

      const { conversation_ids, ...message_data } = body;
      const result = await messagesService.createMessageForConversations(
        conversation_ids,
        message_data
      );

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      });
    }

    case "PATCH": {
      const body = await req.json();
      const { message_id, content, role, metadata } = body;

      await messagesService.updateMessage({
        message_id,
        content,
        role,
        metadata,
      });

      return new Response(JSON.stringify({ message: "Message updated" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    case "DELETE": {
      const message_id = searchParams.get("message_id");

      if (!message_id) {
        return new Response(JSON.stringify({ error: "Missing message_id" }), {
          status: 400,
        });
      }

      // Soft delete = set deleted_at
      await context.supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", message_id);

      return new Response(
        JSON.stringify({ message: "Message deleted (soft)" }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
};

const corsConfig = {
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  },
};

serve(
  withCors(corsConfig)(
    withErrorBoundary(withAuthenticatedContext(withRequestHandlers(handler)))
  )
);
