import type { IAiAgent } from "@/types/aiAgents";
import { useEffect, useState } from "react";
import { MessageService } from "@/services/MessageService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Bot } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/contexts/NotificationProvider";
import { NormalizedEmailResponse } from "@/types/emailAgentMessage";
import EmailAgentMessage from "@/components/chat/MarkupBuilder/EmailAgentMessage";
import { ChatProvider } from "@/contexts/chat/ChatProvider";

const EmailAgentCard = ({ agent }: { agent: IAiAgent }) => {
  const { urlTenantAlias } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const { setEmailCount } = useNotifications();
  const [emailsNeedingAttention, setEmailsNeedingAttention] = useState<{
    messages: ChatMessage[];
  }>({ messages: [] });

  const emailConversation = agent.conversations.find(
    (conversation) => conversation.alias === "email-assistant"
  );

  useEffect(() => {
    const getEmailsNeedingAttention = async () => {
      if (emailConversation.id) {
        const response = await MessageService.getMessages(agent.id, {
          conversation_id: emailConversation.id,
          filter: JSON.stringify({ "metadata.status": "draft" }),
          // priority_sort_direction: "desc",
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
  }, []);

  if (!emailConversation) return null;

  const EMAIL_CHAT_ROUTE = ROUTES.AGENT_CHAT.replace(
    ":tenantId",
    urlTenantAlias
  ).replace(":id", emailConversation.alias);

  return (
    <ChatProvider conversationId={emailConversation.id}>
      <Card className="px-1">
        <CardHeader className="pb-3 px-2">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 w-full">
              <Bot />
              {agent.human_name}
            </CardTitle>
          </div>
          <CardDescription className="w-full flex items-center">
            Emails needing attention{" "}
            {!!emailsNeedingAttention.messages.length && (
              <Badge className="ml-auto" variant="warning">
                {emailsNeedingAttention.messages.length}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <div className="flex flex-col gap-2">
            {emailsNeedingAttention?.messages?.length > 0 ? (
              emailsNeedingAttention.messages.map((email) => {
                const emailContent = email.content as NormalizedEmailResponse;
                return (
                  <EmailAgentMessage
                    message={email}
                    compact={true}
                    key={email.id}
                  />
                );
              })
            ) : isLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : (
              <p>No emails needing attention</p>
            )}
          </div>
        </CardContent>
      </Card>
    </ChatProvider>
  );
};

export default EmailAgentCard;
