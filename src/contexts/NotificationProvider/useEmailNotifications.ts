import { MessageService } from "@/services/MessageService";
import { ChatMessage } from "@/types/chat";
import { useState, useEffect } from "react";
import { useNotifications } from "./NotificationContext";
import { IAiAgent } from "@/types/aiAgents";

const useEmailAgentNotifications = ({ aiAgents }: { aiAgents: IAiAgent[] }) => {
  const emailAgent = aiAgents.find((agent) => agent.name === "email-assistant");

  const [isLoading, setIsLoading] = useState(true);
  const { setEmailCount, emailCount } = useNotifications();
  const [emailsNeedingAttention, setEmailsNeedingAttention] = useState<{
    messages: ChatMessage[];
  }>({ messages: [] });

  const emailConversation = emailAgent?.conversations.find(
    (conversation) => conversation.alias === "email-assistant"
  );
  console.log("aiAgents", aiAgents);

  useEffect(() => {
    const getEmailsNeedingAttention = async () => {
      if (emailConversation.id) {
        const response = await MessageService.getMessages(emailAgent.id, {
          conversation_id: emailConversation.id,
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

        setEmailsNeedingAttention(response);
        setIsLoading(false);

        if (response.total_count) {
          setEmailCount(response.total_count);
        }
      }
    };

    getEmailsNeedingAttention();
  }, [emailConversation, emailAgent, setEmailCount]);

  return {
    emailCount,
    setEmailCount,
    emailsNeedingAttention,
    isLoading,
    emailConversation,
  };
};

export default useEmailAgentNotifications;
