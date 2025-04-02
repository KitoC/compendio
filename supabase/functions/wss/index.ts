import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "locals/middleware/_getAuthenticatedContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { ChatSocketHandler } from "locals/handlers/wss/ChatSocketHandler";

const handler = async (req: Request) => {
  let context: AuthenticatedContext | null = null;
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("🟢 WebSocket connection opened");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "auth" && !context) {
        const authContext = await getAuthenticatedContext(
          `Bearer ${data.token}`,
          data.tenant_id,
          true
        );

        if (!authContext || !authContext.supabase) {
          socket.send(
            JSON.stringify({ type: "error", value: "Invalid token" })
          );
          socket.close();
          return;
        }

        context = { ...authContext, corsHeaders: {}, allowedOrigins: [] };
        socket.send(JSON.stringify({ type: "Authenticated", value: true }));
        return;
      }

      if (!context) {
        socket.send(JSON.stringify({ type: "error", value: "Unauthorized" }));
        return;
      }

      console.log("🔁 WebSocket message", data);

      const handler = new ChatSocketHandler(context, socket);

      if (data.type.startsWith("chat:")) {
        return handler.routeSocketMessage(data);
      }

      // Extend: Add more types here and route to other modules
    } catch (err) {
      console.error("❌ WebSocket error:", err);
      try {
        socket.send(
          JSON.stringify({ type: "error", value: (err as Error).message })
        );
      } catch (_) {
        console.error("❌ WebSocket FATAL error:", err);
      }
      socket.close();
    }
  };

  socket.onerror = (err) => {
    console.error("💥 WebSocket error:", err);
  };

  return response;
};

serve(handler);
