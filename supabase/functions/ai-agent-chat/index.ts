
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Handle CDN file serving
    if (url.pathname === '/cdn-lib') {
      // In a production environment, you would read this from a file
      // This is a simplified example that serves a minimal library
      const libraryCode = `
        (function(global, factory) {
          typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
          typeof define === 'function' && define.amd ? define(factory) :
          (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ConvoSyncEdge = factory());
        })(this, (function () {
          'use strict';
          
          return {
            version: '1.0.0',
            getChatResponse: async function(message) {
              // This would interact with your actual AI system
              return {
                text: "This is a response from the edge function: " + message,
                timestamp: new Date().toISOString()
              };
            }
          };
        }));
      `;
      
      return new Response(libraryCode, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600' 
        }
      });
    }

    // Your custom code for other endpoints
    const data = { message: "This is the AI agent chat endpoint" };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-agent-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
