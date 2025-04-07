import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatProvider } from "@/contexts/chat";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useTenant } from "@/contexts/TenantContext";
import useFindOrCreateConversation from "@/hooks/useFindOrCreateConversation";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/use-mobile";
interface ChatContainerProps {
  conversationId?: string;
  className?: string;
}

export const ChatContainer = ({
  conversationId: propConversationId,
  className,
}: ChatContainerProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Use the ID from props or URL params
  const conversationIdOrAlias = propConversationId || paramId;

  const { conversation, loading } = useFindOrCreateConversation({
    conversationIdOrAlias,
    tenantId,
  });

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-8 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading conversation...</p>
      </Card>
    );
  }

  if (!conversationIdOrAlias || !user || !tenantId) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 h-full">
        <p className="mb-4">No conversation selected or you need to sign in.</p>
        <Button onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Conversations
        </Button>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <ChatProvider conversationId={conversation?.id || ""}>
        <div className="overflow-y-auto h-full">
          <ChatMessages />
        </div>
        <ChatFooter />
      </ChatProvider>
    );
  }

  return (
    <ChatProvider conversationId={conversation?.id || ""}>
      <div className={clsx("flex flex-col h-full w-full items-center py-4")}>
        <div className="flex flex-col h-full w-full max-w-5xl">
          <ChatMessages />
          <ChatFooter />
        </div>
      </div>
    </ChatProvider>
  );
};
