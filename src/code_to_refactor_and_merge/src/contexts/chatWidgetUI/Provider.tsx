import { ReactNode, FC } from "react";
import { ChatWidgetUIContext } from "./context";
import useChatWidgetUIState from "./useChatWidgetUIState";
interface ChatWidgetUIProviderProps {
  children: ReactNode;
}

export const ChatWidgetUIProvider: FC<ChatWidgetUIProviderProps> = ({
  children,
}) => {
  const value = useChatWidgetUIState();

  return (
    <ChatWidgetUIContext.Provider value={value}>
      {children}
    </ChatWidgetUIContext.Provider>
  );
};
