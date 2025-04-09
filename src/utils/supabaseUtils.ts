// Define window.__ENV__ type
interface WindowWithEnv extends Window {
  __ENV__?: {
    VITE_SUPABASE_URL?: string;
  };
  supabase?: {
    supabaseUrl?: string;
  };
}

export const getSupabaseKey = () => {
  if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  }

  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHVrdnRiZnVjcnZkcGljdnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMDQ3NzQsImV4cCI6MjA1MzY4MDc3NH0.3xvkpYoRUFhdVYa2GylvfmxGp-XYrpsdfausI4JqiQk";
};

/**
 * Gets the Supabase URL from environment variables or fallback
 */
export const getSupabaseUrl = () => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }

  // Safely access window.__ENV__ with type casting
  const windowWithEnv = window as WindowWithEnv;
  if (
    typeof window !== "undefined" &&
    windowWithEnv.__ENV__ &&
    windowWithEnv.__ENV__.VITE_SUPABASE_URL
  ) {
    return windowWithEnv.__ENV__.VITE_SUPABASE_URL;
  }

  // As a last resort, try to extract it from the Supabase client instance
  if (windowWithEnv.supabase && windowWithEnv.supabase.supabaseUrl) {
    return windowWithEnv.supabase.supabaseUrl;
  }

  console.error(
    "Could not find Supabase URL in environment variables or window.__ENV__"
  );
  return "https://zgtukvtbfucrvdpicvxx.supabase.co"; // Fallback to hardcoded URL as last resort
};

export const getWebsocketUrl = () => {
  let baseUrl = "ws://localhost:54321";

  if (import.meta.env.VITE_SUPABASE_URL) {
    baseUrl = `${import.meta.env.VITE_SUPABASE_URL}`;
  }

  if (import.meta.env.VITE_WEBSOCKET_URL) {
    baseUrl = `${import.meta.env.VITE_WEBSOCKET_URL}`;
  }

  if (baseUrl.startsWith("http:")) {
    baseUrl = baseUrl.replace("http:", "ws:");
  }

  if (baseUrl.startsWith("https:")) {
    baseUrl = baseUrl.replace("https:", "wss:");
  }

  return `${baseUrl}/functions/v1/wss`;
};

/**
 * Gets the Supabase URL from environment variables or fallback
 */
export const getSupabaseFunctionsUrl = (version: string = "v1") => {
  let baseUrl = getSupabaseUrl();

  if (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL) {
    baseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  }

  return `${baseUrl}/functions/${version}`;
};

/**
 * Properly cleans up localStorage items related to Supabase auth
 * to ensure a complete signout
 */
export const cleanupSupabaseAuth = () => {
  // Clear Supabase-related localStorage items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      keysToRemove.push(key);
    }
  }

  // Remove the collected keys
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const getRedirectUri = () => {
  return `${window.location.origin}/auth/callback`;
};
