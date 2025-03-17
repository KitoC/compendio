import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ROUTES } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("id", id);
    if (!id) {
      // If no ID is provided, create a new one and redirect
      navigate(`${ROUTES.CONVERSATION}/${uuidv4()}`);
    }
  }, [id, navigate]);

  return (
    <div className="flex-1 container px-4 py-0 py-6 max-w-5xl mx-auto h-[calc(100vh-4rem)]">
      <ChatContainer />
    </div>
  );
};

export default ChatPage;
