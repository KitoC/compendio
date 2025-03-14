import { AppConfigProvider } from "../contexts/appConfig";
import { AIProvider } from "../contexts/ai";
import { ChatProvider } from "../contexts/chat";
import { ChatWidgetUIProvider } from "../contexts/chatWidgetUI";

const withConfigConnectedProviders = (Component: React.ComponentType) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    return (
      <AppConfigProvider apiKey={""}>
        <AIProvider>
          <ChatWidgetUIProvider>
            <ChatProvider>
              <Component {...props} />
            </ChatProvider>
          </ChatWidgetUIProvider>
        </AIProvider>
      </AppConfigProvider>
    );
  };
};

export default withConfigConnectedProviders;
