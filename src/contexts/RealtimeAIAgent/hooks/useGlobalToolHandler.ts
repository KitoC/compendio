import { useState, useCallback, useEffect } from "react";
import { ToolsAndHandlers } from "../types";
import { EVENTS } from "../consts";
export type ItemContent = { type: "text"; text: string };

export type ConversationItem = {
  type: "message" | "function_call" | "function_call_output";
  role: "user" | "assistant" | "system";
  arguments?: string;
  output?: string;
  call_id?: string;
  content: ItemContent[];
};

export type Input = {
  arguments?: string;
  call_id?: string;
  content?: ItemContent[];
  name?: string;
  output?: string;
  role?: string;
  status?: string;
  type?: string;
};

export type CreateResponseArgs = {
  input?: Input[];
  conversation?: string;
  instructions?: string;
  max_response_output_tokens?: number;
  metadata?: Record<string, string>;
  modalities?: string[];
  output_audio_format?: string;
};

export const useGlobalToolHandler = ({
  dc,
  isListening,
  globalTools,
}: {
  dc: RTCDataChannel;
  isListening: boolean;
  globalTools: ToolsAndHandlers;
}) => {
  const [toolsAndHandlers, setToolsAndHandlers] =
    useState<ToolsAndHandlers>(globalTools);

  const { tools, handlers } = toolsAndHandlers;

  const createConversationItem = useCallback(
    (item: ConversationItem) => {
      dc.send(
        JSON.stringify({
          type: "conversation.item.create",
          item,
        })
      );
    },
    [dc]
  );

  const createResponse = useCallback(
    (response: CreateResponseArgs) => {
      dc.send(JSON.stringify({ type: "response.create", response }));
    },
    [dc]
  );

  const setTools = useCallback(() => {
    if (isListening) {
      dc?.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            tools: [...Object.values(tools)],
          },
        })
      );
    }
  }, [isListening, dc, tools]);

  useEffect(() => {
    setTools();
  }, [setTools]);

  const addToolCallHandlers = useCallback(() => {
    if (dc) {
      const handleToolCall = (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        if (data.type === EVENTS.FUNCTION_CALL_ARGUMENTS_DONE) {
          if (handlers[data.name]) {
            handlers[data.name](JSON.parse(data.arguments), {
              toolCall: data,
              dc,
              createConversationItem,
              createResponse,
            });
          }
        }
      };

      dc.addEventListener("message", handleToolCall);

      return () => dc.removeEventListener("message", handleToolCall);
    }
  }, [dc, handlers, createConversationItem, createResponse]);

  useEffect(() => {
    const cleanup = addToolCallHandlers();

    return cleanup;
  }, [dc, globalTools.handlers, addToolCallHandlers]);

  return {
    setToolsAndHandlers,
    addToolCallHandlers,
    createConversationItem,
    createResponse,
  };
};
