import { AppConfigProvider } from "../contexts/appConfig";
import { AIProvider } from "../contexts/ai";
import { ChatProvider } from "../contexts/chat";

const withConfigConnectedProvidersApp = (Component: React.ComponentType) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => {
    return (
      <AppConfigProvider apiKey={""}>
        <AIProvider>
          <ChatProvider>
            <Component {...props} />
          </ChatProvider>
        </AIProvider>
      </AppConfigProvider>
    );
  };
};

export default withConfigConnectedProvidersApp;
