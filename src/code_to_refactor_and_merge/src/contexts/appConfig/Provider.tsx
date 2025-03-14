import { FC, ReactNode, useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { AppConfig } from "../../lib/supabase";

import { AppConfigContext, AppConfigContextType } from "./context";
import makeApi from "../../lib/api";
import supabaseManager from "../../lib/supabase";
import { makeConfigService } from "../../services/supabase/configs";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "../../styles/theme";
import { GlobalStyles } from "../../styles/GlobalStyles";
import customersService from "../../services/supabase/customers";
import aiAgentsService from "../../services/supabase/ai_agents";
interface AppConfigProviderProps {
  children: ReactNode;
  apiKey: string;
}

const defaultEnv = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || "backend-url",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "supabase-url",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "supabase-key",
  skybrookApiKey: import.meta.env.VITE_SKYBROOK_API_KEY || "api-key",
};

const defaultChatWidgetConfig = {
  logo: "https://www.byronandbeyondfencing.com.au/wp-content/uploads/2020/08/source-files-copy.png",
  theme: {
    colors: {
      primary: "rgba(99, 102, 241, 0.8)",
    },
  },
  previousConversations: {
    persistIfLessThan: "1 day",
  },
  chatUrl:
    "https://skybrook.app.n8n.cloud/webhook/538bb6f5-f3ff-40cf-a90d-b6d5ab3ac2d3/chat",
};

const defaultAppConfig: AppConfigContextType = {
  env: defaultEnv,
  api: makeApi({
    apiKey: defaultEnv.skybrookApiKey,
    backendUrl: defaultEnv.backendUrl,
  }),
  chatWidgetConfig: defaultChatWidgetConfig,
  tools: [],
  userId: "",
  domain: window.location.hostname,
  socket: io(`${defaultEnv.backendUrl}`),
  promptConfig: { tools: [] },
  aiAgent: null,
};

export const AppConfigProvider: FC<AppConfigProviderProps> = ({
  children,
  apiKey,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [appConfig, setAppConfig] =
    useState<AppConfigContextType>(defaultAppConfig);

  const loadAppConfig = useCallback(async () => {
    const env = {
      backendUrl: import.meta.env.VITE_BACKEND_URL || "backend-url",
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "supabase-url",
      skybrookApiKey:
        apiKey || import.meta.env.VITE_SKYBROOK_API_KEY || "api-key",
    };

    if (!env.skybrookApiKey) {
      console.error("No API key provided");

      return;
    }

    const api = makeApi({
      apiKey: env.skybrookApiKey,
      backendUrl: env.backendUrl,
    });

    const supabase = supabaseManager.getClient();

    supabaseManager.setApiKey(env.skybrookApiKey);

    const { data } = await supabase
      .from("tenant_domains")
      .select("tenant_id")
      .eq("name", window.location.origin)
      .maybeSingle();

    const tenantID = data?.tenant_id;

    supabaseManager.tenantId = tenantID;

    if (!tenantID) {
      console.error("No tenant ID found");

      return;
    }

    const configs = makeConfigService(supabase);
    const domain = window.location.origin;

    const chatWidgetConfig = await configs.get("chatWidgetConfig", tenantID);
    const tools = await configs.get("tools", tenantID);

    const fp = await FingerprintJS.load();

    const { visitorId } = await fp.get();
    const socket = io(`${env.backendUrl}`);
    const user = await customersService.getById(visitorId);
    const aiAgent = await aiAgentsService.getById("quote-agent");

    setAppConfig((config) => ({
      ...config,
      env,
      api,
      chatWidgetConfig:
        (chatWidgetConfig?.config as AppConfig["chatWidgetConfig"]) ||
        defaultChatWidgetConfig,
      tools: (tools?.config as object[]) || [],
      domain,
      userId: visitorId,
      socket,
      promptConfig: { tools: (tools?.config as object[]) || [] },
      user: user?.contact_details,
      aiAgent,
    }));

    setIsLoaded(true);
  }, [apiKey]);

  useEffect(() => {
    loadAppConfig();
  }, [loadAppConfig]);

  return (
    <AppConfigContext.Provider value={appConfig}>
      <ThemeProvider
        theme={{
          ...defaultTheme,
          chatWidgetTheme: appConfig?.chatWidgetConfig?.theme,
        }}
      >
        <GlobalStyles />
        <div className="skybrook-chat-widget dark p-0 h-screen w-screen  dark:bg-gray-800">
          {isLoaded ? children : null}
        </div>
      </ThemeProvider>
    </AppConfigContext.Provider>
  );
};
