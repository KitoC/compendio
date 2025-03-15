
// Define window.__ENV__ type
interface WindowWithEnv extends Window {
  __ENV__?: {
    VITE_SUPABASE_URL?: string;
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
  if (typeof window !== 'undefined' && windowWithEnv.__ENV__ && windowWithEnv.__ENV__.VITE_SUPABASE_URL) {
    return windowWithEnv.__ENV__.VITE_SUPABASE_URL;
  }
  
  // As a last resort, try to extract it from the Supabase client instance
  if (windowWithEnv.supabase && windowWithEnv.supabase.supabaseUrl) {
    return windowWithEnv.supabase.supabaseUrl;
  }
  
  console.error("Could not find Supabase URL in environment variables or window.__ENV__");
  return "https://zgtukvtbfucrvdpicvxx.supabase.co"; // Fallback to hardcoded URL as last resort
};
