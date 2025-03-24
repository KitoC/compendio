import { useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Agent not found...</div>;
  }

  return (
    <div className="flex-1 container px-4 py-0 py-6 max-w-5xl mx-auto h-[calc(100vh-4rem)]">
      <ChatContainer />
    </div>
  );
};

export default ChatPage;
