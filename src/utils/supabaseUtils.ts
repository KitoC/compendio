
// Define window.__ENV__ type
interface WindowWithEnv extends Window {
  __ENV__?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_FUNCTIONS_URL?: string;
  };
  supabase?: {
    supabaseUrl?: string;
  };
}

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

  // If we're in development mode (localhost), use a default local URL
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:54321';
  }

  // For lovableproject.com dev environments
  if (window.location.hostname.includes('lovableproject.com')) {
    return 'https://zgtukvtbfucrvdpicvxx.supabase.co';
  }

  console.error(
    "Could not find Supabase URL in environment variables or window.__ENV__"
  );
  return "https://zgtukvtbfucrvdpicvxx.supabase.co"; // Fallback to hardcoded URL as last resort
};

/**
 * Gets the Supabase functions URL from environment variables or fallback
 */
export const getSupabaseFunctionsUrl = (version: string = "v1") => {
  // First try to get the Functions URL directly
  if (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL) {
    const baseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
    return `${baseUrl}/functions/${version}`;
  }

  // Safely access window.__ENV__ with type casting
  const windowWithEnv = window as WindowWithEnv;
  if (
    typeof window !== "undefined" &&
    windowWithEnv.__ENV__ &&
    windowWithEnv.__ENV__.VITE_SUPABASE_FUNCTIONS_URL
  ) {
    const baseUrl = windowWithEnv.__ENV__.VITE_SUPABASE_FUNCTIONS_URL;
    return `${baseUrl}/functions/${version}`;
  }

  // If we're in development mode (localhost), use a default local URL
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://127.0.0.1:54321/functions/${version}`;
  }

  // Fallback to using the Supabase URL if we couldn't find a specific Functions URL
  let baseUrl = getSupabaseUrl();
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

  console.log("Cleaned up Supabase auth data from localStorage");
};
