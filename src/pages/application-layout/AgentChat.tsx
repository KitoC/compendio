import { useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import clsx from "clsx";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Agent not found...</div>;
  }

  return <ChatContainer />;
};

export default ChatPage;
