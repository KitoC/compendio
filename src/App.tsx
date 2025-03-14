
import { ThemeProvider } from "@/components/ThemeProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import ChatPage from "./pages/ChatPage";
import ChatWidgetTrigger from "./components/chat/ChatWidgetTrigger";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Navbar />
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path={ROUTES.CONVERSATIONS} element={<ConversationsPage />} />
          <Route path={`${ROUTES.CONVERSATION}/:id`} element={<ChatPage />} />
          <Route path={ROUTES.ASSISTANT_CHAT} element={<ChatPage />} />
        </Routes>
        <Footer />
        <Toaster />
        <ChatWidgetTrigger />
      </ThemeProvider>
    </div>
  );
}

export default App;

// Placeholder components until the actual ones are implemented
const HomePage = () => <div className="flex-1 container px-4 py-6 max-w-5xl mx-auto">Home Page</div>;
const AccountPage = () => <div className="flex-1 container px-4 py-6 max-w-5xl mx-auto">Account Page</div>;
const ConversationsPage = () => <div className="flex-1 container px-4 py-6 max-w-5xl mx-auto">Conversations Page</div>;

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page if user is already logged in
    if (localStorage.getItem("sb-access-token")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex-1 container px-4 py-6 max-w-5xl mx-auto">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={["github", "google"]}
      />
    </div>
  );
};
