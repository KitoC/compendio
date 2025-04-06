import { useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import clsx from "clsx";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();

  const isMobile = useIsMobile();

  if (!id) {
    return <div>Agent not found...</div>;
  }

  return (
    <div
      className={clsx(
        "flex-1 container px-4 py-0 pb-6 max-w-5xl mx-auto h-[calc(100vh-4rem)]",
        isMobile && "px-0 pb-0"
      )}
    >
      <ChatContainer />
    </div>
  );
};

export default ChatPage;
