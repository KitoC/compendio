
import "./styles/main.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/chat-page";
import { AppConfigProvider } from "./contexts/appConfig";
import { AIProvider } from "./contexts/ai";
import { ChatProvider } from "./contexts/chat";

const App = () => {
  return (
    <Router>
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
    </Router>
  );
};

export default App;
