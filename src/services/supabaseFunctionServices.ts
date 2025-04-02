import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";
import { dynamicHeaders } from "@/integrations/supabase/client";

const getFunctionUrl = (functionName: string, searchParams?: string) => {
  let functionUrl = `${getSupabaseFunctionsUrl()}/${functionName}`;

  if (searchParams) {
    functionUrl += `?${searchParams}`;
  }

  console.log("Calling AI chat function at:", functionUrl);

  return functionUrl;
};

const getHeaders = async () => {
  const session = await supabase.auth.getSession();

  const userToken = session?.data?.session?.access_token;

  const token = userToken || import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-tenant-id": dynamicHeaders["x-tenant-id"],
  };
};

export const callSupabaseFunction = async (
  functionName: string,
  body: object
) => {
  const headers = await getHeaders();
  const response = await fetch(getFunctionUrl(functionName), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return response;
};

export const SupabaseFunctionService = {
  async get(functionName: string, searchParams: Record<string, string>) {
    const query = new URLSearchParams(searchParams).toString();

    const headers = await getHeaders();

    const response = await fetch(getFunctionUrl(functionName, query), {
      method: "GET",
      headers,
    });

    return response;
  },

  async post(functionName: string, body: object) {
    const headers = await getHeaders();
    const response = await fetch(getFunctionUrl(functionName), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response;
  },

  async patch(functionName: string, body: object) {
    const headers = await getHeaders();
    const response = await fetch(getFunctionUrl(functionName), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    return response;
  },
};
