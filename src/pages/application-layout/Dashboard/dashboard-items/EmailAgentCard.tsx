import type { IAiAgent } from "@/types/aiAgents";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmailAgentMessage from "@/components/chat/MarkupBuilder/EmailAgentMessage";
import { ChatProvider } from "@/contexts/chat/ChatProvider";
import useEmailAgentNotifications from "@/contexts/NotificationProvider/useEmailNotifications";

const EmailAgentCard = ({ agent }: { agent: IAiAgent }) => {
  const { emailCount, emailsNeedingAttention, isLoading, emailConversation } =
    useEmailAgentNotifications({ aiAgents: [agent] });

  if (!emailConversation) return null;

  return (
    <ChatProvider conversationId={emailConversation.id} agentOverride={agent}>
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
            {!!emailCount && (
              <Badge className="ml-auto" variant="warning">
                {emailCount}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <div className="flex flex-col gap-2">
            {emailsNeedingAttention?.messages?.length > 0 ? (
              emailsNeedingAttention.messages.map((email) => {
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
