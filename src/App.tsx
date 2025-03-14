import { ThemeProvider } from "@/components/ThemeProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ROUTES } from "@/lib/constants";
import { SiteConfig } from "@/types";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Account from "./pages/Account";
import AuthRequired from "./components/AuthRequired";
import Conversations from "./pages/Conversations";
import Home from "./pages/Home";

import ChatPage from "./pages/ChatPage";
import ChatWidgetTrigger from "./components/chat/ChatWidgetTrigger";
import { ROUTES } from "./lib/constants";

function App() {
  const { session, isLoading } = useAuth();

  const siteConfig: SiteConfig = {
    name: "Skybrook AI",
    description:
      "An open source platform for creating and managing AI-powered chatbots.",
    url: "https://skybrook.ai",
    ogImage: "https://skybrook.ai/og.jpg",
    links: {
      twitter: "https://twitter.com/skybrookai",
      github: "https://github.com/skybrookai/skybrookai",
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Navbar />
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.LOGIN} element={<AuthPage />} />
          <Route path="/account" element={<Account />} />
          <Route path={ROUTES.CONVERSATIONS} element={<Conversations />} />
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
        supabaseClient={"" as any}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={["github", "google"]}
      />
    </div>
  );
};
