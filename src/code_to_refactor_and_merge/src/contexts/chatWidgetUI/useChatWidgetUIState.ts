import { useState, useCallback, useEffect, useMemo } from "react";
import { eventEmitter, EventMap } from "../../events";
import { useAppConfig } from "../appConfig";

const useChatWidgetUIState = () => {
  const [isOpen, setIsOpen] = useState(
    import.meta.env.VITE_CHAT_WIDGET_OPEN || false
  );
  const [isFullScreen, setIsFullScreen] = useState(
    import.meta.env.VITE_CHAT_WIDGET_FULL_SCREEN || false
  );
  const { chatWidgetConfig } = useAppConfig();
  const { position = "bottom-right" } = chatWidgetConfig;

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const toggleChatOpen = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    eventEmitter.on("chat:open", handleOpen);
    eventEmitter.on("chat:close", handleClose);
    eventEmitter.on("chat:toggle", toggleChatOpen);

    return () => {
      eventEmitter.off("chat:open", handleOpen);
      eventEmitter.off("chat:close", handleClose);
      eventEmitter.off("chat:toggle", toggleChatOpen);
    };
  }, [isOpen, handleOpen, handleClose, toggleChatOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.dataset.event) {
        eventEmitter.emit(
          target.dataset.event as keyof EventMap,
          target.dataset.payload
        );
      }
    };

    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  return useMemo(
    () => ({
      isOpen,
      isFullScreen,
      toggleFullScreen,
      handleOpen,
      handleClose,
      toggleChatOpen,
      position,
    }),
    [
      isOpen,
      isFullScreen,
      toggleFullScreen,
      handleOpen,
      handleClose,
      toggleChatOpen,
      position,
    ]
  );
};

export default useChatWidgetUIState;
