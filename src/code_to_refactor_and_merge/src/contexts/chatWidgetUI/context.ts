import { createContext, useContext } from "react";

export interface ChatWidgetUIContextType {
  isOpen: boolean;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  handleOpen: () => void;
  handleClose: () => void;
  toggleChatOpen: () => void;
  position:
    | "bottom-left"
    | "bottom-right"
    | "top-left"
    | "top-right"
    | "left"
    | "right"
    | "bottom"
    | "top";
}

export const ChatWidgetUIContext = createContext<ChatWidgetUIContextType>({
  isOpen: false,
  isFullScreen: false,
  toggleFullScreen: () => {},
  handleOpen: () => {},
  handleClose: () => {},
  toggleChatOpen: () => {},
  position: "bottom-right",
});

export const useChatWidgetUI = () => {
  const context = useContext(ChatWidgetUIContext);

  return context;
};
