import { useRealtimeAiAgent } from "../RealtimAiAgentContext";
import { ToolsAndHandlers } from "../types";
import { useEffect } from "react";

const useLocalTools = (toolsAndHandlers: ToolsAndHandlers) => {
  const { setToolsAndHandlers } = useRealtimeAiAgent();

  useEffect(() => {
    setToolsAndHandlers(
      (prev: ToolsAndHandlers) =>
        ({
          ...prev,
          tools: { ...prev.tools, ...toolsAndHandlers.tools },
          handlers: {
            ...prev.handlers,
            ...toolsAndHandlers.handlers,
          },
        } as ToolsAndHandlers)
    );
  }, [setToolsAndHandlers, toolsAndHandlers]);

  return { toolsAndHandlers, setToolsAndHandlers };
};

export default useLocalTools;
