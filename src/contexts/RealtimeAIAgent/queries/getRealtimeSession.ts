import { SupabaseFunctionService } from "@/services/supabaseFunctionServices";

export type GetRealtimeSessionOptions = {
  model: string;
  turn_detection?: {
    type?: "server_vad" | "semantic_vad";
    eagerness?: "low" | "auto" | "high";
    interrupt_response?: "conversation" | "auto";
    silence_duration_ms?: number;
    threshold?: number;
  };
};

export const getRealtimeSession = async (
  options: GetRealtimeSessionOptions
) => {
  const res = await SupabaseFunctionService.post("openai-token", options);

  if (!res.ok) throw new Error("Failed to get OpenAI token");

  return await res.json();
};
