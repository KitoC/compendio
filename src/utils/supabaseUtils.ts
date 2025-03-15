
/**
 * Gets the Supabase URL from environment variables or fallback
 */
export const getSupabaseUrl = () => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_URL) {
    return window.__ENV__.VITE_SUPABASE_URL;
  }
  
  // As a last resort, try to extract it from the Supabase client instance
  const supabaseInstance = (window as any).supabase;
  if (supabaseInstance && supabaseInstance.supabaseUrl) {
    return supabaseInstance.supabaseUrl;
  }
  
  console.error("Could not find Supabase URL in environment variables or window.__ENV__");
  return "https://zgtukvtbfucrvdpicvxx.supabase.co"; // Fallback to hardcoded URL as last resort
};
