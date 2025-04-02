import ChatFooter from "@/components/chat/ChatFooter";
import ChatMessages from "@/components/chat/ChatMessages";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import { ChatProvider } from "@/contexts/chat/ChatProvider";
import { useTenant } from "@/contexts/TenantContext";
import useFindOrCreateConversation from "@/hooks/useFindOrCreateConversation";

const OnboardingPage = () => {
  const { tenantId } = useTenant();

  // Use the ID from props or URL params

  const { conversation, loading } = useFindOrCreateConversation({
    conversationIdOrAlias: "onboarding",
    tenantId,
  });

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 h-full">
        <Loader />
        <p className="mt-2">Getting ready to be awesome...</p>
      </Card>
    );
  }

  return (
    <div className="flex-1 container px-4 py-0 py-6 max-w-5xl mx-auto h-[calc(100vh-4rem)]">
      <ChatProvider conversationId={conversation.id}>
        <div className={`flex flex-col h-full overflow-hidden bg-background`}>
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages />
            <ChatFooter />
          </div>
        </div>
      </ChatProvider>{" "}
    </div>
  );
};

export default OnboardingPage;
