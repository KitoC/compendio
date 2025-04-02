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

  return (
    <ChatProvider conversationId={conversation?.id || ""}>
      <div
        className={`flex flex-col h-full overflow-hidden bg-background ${className}`}
      >
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatMessages />
          <ChatFooter />
        </div>
      </div>
    </ChatProvider>
  );
};
