import { SupabaseFunctionService } from "@/services/supabaseFunctionServices";

export type GetRealtimeSessionOptions = {
  model: string;
};

export const getRealtimeSession = async (
  options: GetRealtimeSessionOptions
) => {
  const res = await SupabaseFunctionService.post("openai-token", options);

  if (!res.ok) throw new Error("Failed to get OpenAI token");

  return await res.json();
};
