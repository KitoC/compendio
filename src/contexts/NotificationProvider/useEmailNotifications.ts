import { MessageService } from "@/services/MessageService";
import { ChatMessage } from "@/types/chat";
import { useState, useEffect } from "react";
import { useNotifications } from "./NotificationContext";
import { IAiAgent } from "@/types/aiAgents";
import { QUERY_KEYS } from "@/hooks/useAiAgentsQuery";
import { useQuery } from "@tanstack/react-query";

const useEmailAgentNotifications = ({ aiAgents }: { aiAgents: IAiAgent[] }) => {
  const emailAgent = aiAgents.find((agent) => agent.name === "email-assistant");

  const { setEmailCount, emailCount } = useNotifications();

  const emailConversation = emailAgent?.conversations.find(
    (conversation) => conversation.alias === "email-assistant"
  );

  const { data: emailsNeedingAttention = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.aiAgents, emailConversation?.id],
    queryFn: async () => {
      const response = await MessageService.getMessages(emailAgent.id, {
        conversation_id: emailConversation?.id,
        priority_sort_direction: "desc",
        filter: JSON.stringify({
          "metadata.status": ["draft", "received"],
          "metadata.priority": [3, 4],
        }),
        order: "updated_at",
        sort_direction: "desc",
        limit: "5",
        offset: "0",
      });

      if (response.total_count) {
        setEmailCount(response.total_count);
      }
      return response;
    },
    enabled: !!emailConversation?.id, // Only run query if we have a tenantId
  });

  return {
    emailCount,
    setEmailCount,
    emailsNeedingAttention,
    isLoading,
    emailConversation,
  };
};

export default useEmailAgentNotifications;
