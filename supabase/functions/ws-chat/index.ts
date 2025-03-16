
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("WebSocket function called");
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if it's a WebSocket connection request
  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log("Expected WebSocket connection, got:", upgradeHeader);
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    // Upgrade the connection to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Set up WebSocket event handlers
    socket.onopen = () => {
      console.log("WebSocket connection established");
      socket.send(JSON.stringify({ 
        type: "system", 
        message: "Connected to WebSocket server" 
      }));
    };
    
    socket.onmessage = (event) => {
      console.log("Received message:", event.data);
      try {
        const message = JSON.parse(event.data);
        
        // Echo back the message for now (you can implement actual logic here)
        socket.send(JSON.stringify({ 
          type: "echo", 
          message: message,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({ 
          type: "error", 
          message: "Failed to process message" 
        }));
      }
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return response;
  } catch (error) {
    console.error("Error upgrading to WebSocket:", error);
    return new Response(`Failed to upgrade connection: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
