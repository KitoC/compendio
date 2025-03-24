import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";

export const callSupabaseFunction = async (
  functionName: string,
  body: object
) => {
  const functionUrl = getSupabaseFunctionsUrl();

  console.log("Calling AI chat function at:", functionUrl);

  const token =
    (await supabase.auth.getSession()).data.session?.access_token ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${functionUrl}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return response;
};
