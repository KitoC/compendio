
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getEnvKey } from "../shared/utils/env.ts";
import OpenAIService from "../shared/services/OpenAIService.ts";
import AgentController from "../controllers/AgentController.ts";
import ConversationsController from "../controllers/ConversationsController.ts";
import SupabaseService from "../shared/services/SupabaseService.ts";
import FunctionController from "../controllers/FunctionController.ts";
// Environment variables
const supabaseUrl = getEnvKey("SUPABASE_URL");
const supabaseAnonKey = getEnvKey("SUPABASE_ANON_KEY");

const openAiService = new OpenAIService(getEnvKey("OPENAI_API_KEY"));
const agentController = new AgentController();
const conversationsController = new ConversationsController();
const supabaseService = new SupabaseService();
const functionController = new FunctionController();

// WebSocket connections store
const connections = new Map();

/**
 * Broadcast a message to all connected WebSocket clients
 */
const broadcastMessage = (message: any) => {
  console.log(`Broadcasting message to ${connections.size} clients:`, message);
  
  for (const [id, socket] of connections.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${id}:`, error);
      }
    }
  }
};

/**
 * Send a notification to all connected clients
 */
const sendNotification = (title: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  broadcastMessage({
    type: 'notification',
    title,
    message,
    level,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Main handler for the AI chat edge function
 */
serve(async (req: Request) => {
  const upgradeHeader = req.headers.get("upgrade") || "";
  
  // Handle WebSocket connection
  if (upgradeHeader.toLowerCase() === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Generate a unique connection ID
    const connectionId = crypto.randomUUID();
    
    console.log(`WebSocket connection established: ${connectionId}`);
    
    // Save the connection
    connections.set(connectionId, socket);
    
    // Handle incoming messages
    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`Received message from client ${connectionId}:`, data);
        
        // Echo back the message for testing
        socket.send(JSON.stringify({
          type: "echo",
          data: data,
          timestamp: new Date().toISOString(),
        }));
        
        // Handle different message types
        switch (data.type) {
          case "chat.message":
            // Send typing indicator
            socket.send(JSON.stringify({
              type: "agent.typing",
              agentId: data.agentId || "default",
              status: true,
            }));
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Send response
            socket.send(JSON.stringify({
              type: "agent.response",
              agentId: data.agentId || "default",
              message: `Response to your message: "${data.message}"`,
              timestamp: new Date().toISOString(),
            }));
            
            // Turn off typing indicator
            socket.send(JSON.stringify({
              type: "agent.typing",
              agentId: data.agentId || "default",
              status: false,
            }));
            
            // Broadcast notification of new message to all clients
            broadcastMessage({
              type: "conversation.update",
              conversation_id: data.conversationId,
              agent_id: data.agentId || "default",
              timestamp: new Date().toISOString(),
            });
            break;
            
          case "send.notification":
            // Handle notification requests
            if (data.title && data.message) {
              sendNotification(data.title, data.message, data.level || 'info');
            }
            break;
            
          default:
            console.log(`Unhandled message type: ${data.type}`);
        }
      } catch (error) {
        console.error(`Error processing WebSocket message: ${error}`);
        socket.send(JSON.stringify({
          type: "error",
          message: error.message,
        }));
      }
    };
    
    // Handle disconnection
    socket.onclose = () => {
      console.log(`WebSocket connection closed: ${connectionId}`);
      connections.delete(connectionId);
    };
    
    // Handle errors
    socket.onerror = (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
    };
    
    // Immediately send a welcome message
    setTimeout(() => {
      socket.send(JSON.stringify({
        type: "notification",
        title: "Welcome",
        message: "You are now connected to the chat server!",
        level: "success",
        timestamp: new Date().toISOString()
      }));
    }, 1000);
    
    return response;
  }
  
  // Handle regular HTTP requests
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return supabaseService.sendPreflightResponse();
    }

    const { conversation_id, agent_id, messages } = await req.json();

    supabaseService.checkAuthHeaderPresent(req);

    supabaseService.initializeSupabase({
      url: supabaseUrl,
      key: supabaseAnonKey,
    });

    await conversationsController.setDependencies({
      supabase: supabaseService.supabase,
    });

    await functionController.setDependencies({
      supabaseService,
    });
    await agentController.setDependenciesAndGetAgents({
      supabaseService,
      openAiService,
      functionController,
    });

    // Validate conversation exists or create it
    await conversationsController.validateOrCreateConversation(conversation_id);

    // Broadcast to all connected clients that a new message was received
    broadcastMessage({
      type: "conversation.update",
      conversation_id,
      agent_id,
      timestamp: new Date().toISOString(),
    });

    // Call OpenAI API
    return agentController.talkToAgent(messages, agent_id);
  } catch (error) {
    console.error("Error in AI chat function:", error);

    return supabaseService.sendJsonResponse(
      { error: error.message || "An unknown error occurred" },
      error.status
    );
  }
});
