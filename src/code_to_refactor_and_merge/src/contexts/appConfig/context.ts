import { createContext, useContext } from "react";
import makeApi from "../../lib/api";
import { AppConfig } from "../../lib/supabase";
import { Socket } from "socket.io-client";
import { User } from "../../services/supabase/customers";
import { AiAgentRecord } from "../../services/supabase/ai_agents";
export interface AppConfigContextType {
  env: {
    backendUrl: string;
    supabaseUrl: string;
    skybrookApiKey: string;
  };
  api: ReturnType<typeof makeApi>;
  chatWidgetConfig?: AppConfig["chatWidgetConfig"];
  tools?: object[];
  userId: string;
  domain: string;
  user?: User;
  socket: Socket;
  promptConfig: AppConfig["config"];
  aiAgent: AiAgentRecord | null;
}

export const AppConfigContext = createContext<AppConfigContextType | undefined>(
  undefined
);

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }

  return context;
};
