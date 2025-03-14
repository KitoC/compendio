import "./styles/main.css";
import { BrowserRouter, Route, Routes } from "react-router";
import ChatPage from "./pages/chat-page";
import { AppConfigProvider } from "./contexts/appConfig";
import { AIProvider } from "./contexts/ai";
import { ChatProvider } from "./contexts/chat";

const App = () => {
  return (
    <BrowserRouter>
      <AppConfigProvider apiKey={""}>
        <AIProvider>
          <ChatProvider>
            <Routes>
              <Route
                path="/app/conversations/general-assistant"
                element={<ChatPage />}
              />
            </Routes>
          </ChatProvider>
        </AIProvider>
      </AppConfigProvider>
    </BrowserRouter>
  );
};

export default App;
