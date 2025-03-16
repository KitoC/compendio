
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import AuthRequired from "@/components/AuthRequired";
import { ROUTES } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import ChatNotificationDemo from "@/components/chat/ChatNotificationDemo";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    console.log("id", id);
    if (!id) {
      // If no ID is provided, create a new one and redirect
      navigate(`${ROUTES.CONVERSATION}/${uuidv4()}`);
    }
  }, [id, navigate]);

  return (
    <AuthRequired>
      <div className="flex-1 container px-4 py-6 max-w-5xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-2 h-full">
            <ChatContainer />
          </div>
          <div className="md:col-span-1">
            <Card className="h-fit">
              <CardHeader className="cursor-pointer" onClick={() => setShowDemo(!showDemo)}>
                <CardTitle className="text-lg">WebSocket Notification Demo</CardTitle>
              </CardHeader>
              <CardContent>
                {showDemo && <ChatNotificationDemo />}
                {!showDemo && (
                  <p className="text-muted-foreground">
                    Click the header to show the WebSocket notification demo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthRequired>
  );
};

export default ChatPage;
