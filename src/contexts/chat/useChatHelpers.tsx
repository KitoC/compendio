// NO_CHANGE

import { User } from "@/types/user";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

interface UseHelpersProps {
  conversationId: string;
  user: User;
  tenantId: string;
}

const useChatHelpers = ({
  conversationId,
  user,
  tenantId,
}: UseHelpersProps) => {
  const createAiMessage = useCallback(
    (text: string) => {
      return {
        id: uuidv4(),
        conversation_id: conversationId,
        role: "assistant",
        content: { text },
        metadata: {},
        user_id: user.id,
        tenant_id: tenantId,
      };
    },
    [conversationId, user.id, tenantId]
  );

  const createHumanMessage = useCallback(
    (text: string) => {
      return {
        id: uuidv4(),
        role: "user",
        content: { text },
        conversation_id: conversationId,
        metadata: {},
        reply_to: undefined,
        user_id: user.id,
        tenant_id: tenantId,
      };
    },
    [conversationId, user.id, tenantId]
  );

  return { createAiMessage, createHumanMessage };
};

export default useChatHelpers;
