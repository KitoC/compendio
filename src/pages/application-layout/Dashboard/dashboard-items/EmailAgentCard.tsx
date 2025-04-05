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
    <Card>
      <CardHeader className="pb-3">
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
      <CardContent>
        <div className="flex flex-col gap-1">
          {emailsNeedingAttention?.messages?.length > 0 ? (
            emailsNeedingAttention.messages.map((email) => {
              const emailContent = email.content as NormalizedEmailResponse;
              return (
                <NavLink
                  to={EMAIL_CHAT_ROUTE + "?message_id=" + email.id}
                  className="flex flex-col bg-sidebar p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  key={email.id}
                >
                  <p className="text-sm font-bold truncate">
                    {emailContent.email_received.subject}
                  </p>
                  <p className="text-xs text-gray-400">
                    {emailContent.email_received.from}
                  </p>
                </NavLink>
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
  );
};

export default EmailAgentCard;
