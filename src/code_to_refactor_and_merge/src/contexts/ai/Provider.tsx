import { FC, ReactNode, useState } from "react";
import { AIContext, SendMessageFunc } from "./context";
import { useAppConfig } from "../appConfig/context";
import { ENDPOINTS } from "../../config/endpoints";
import { v4 as uuidv4 } from "uuid";
import { buildSystemPrompt } from "../../utils/buildSystemPrompt";

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: FC<AIProviderProps> = ({ children }) => {
  const appConfig = useAppConfig();
  const { api, promptConfig } = appConfig;

  const [sessionId, setSessionId] = useState<string>(uuidv4());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage: SendMessageFunc = async ({ messages = [], onUpdate }) => {
    setIsLoading(true);
    setError(null);

    const systemPrompt = buildSystemPrompt(appConfig);

    try {
      setIsStreaming(true);

      try {
        const response = await api.post(
          ENDPOINTS.CHAT,
          {
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            stream: true,
            functions: promptConfig.tools,
            function_call: "auto",
          },
          {
            responseType: "stream",
            onDownloadProgress: (progressEvent) => {
              const text = progressEvent.event.target.responseText;
              if (text) {
                onUpdate?.(text);
              }
            },
          }
        );

        return response.data;
      } finally {
        setIsStreaming(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to send message")
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        sendMessage,
        isLoading,
        error,
        sessionId,
        setSessionId,
        isStreaming,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};
