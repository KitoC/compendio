import { useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useAiAgents } from "@/contexts/AiAgents";
import Loader from "@/components/ui/loader";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentAgent, isLoading } = useAiAgents();

  if (isLoading) {
    return <Loader />;
  }

  if (!id) {
    return <div>Agent not found...</div>;
  }

  if (!currentAgent) {
    return <div>Agent not found...</div>;
  }

  return <ChatContainer />;
};

export default ChatPage;
