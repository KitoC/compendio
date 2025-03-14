
export const ROUTES = {
  HOME: "/",
  INDEX: "/",
  LOGIN: "/auth",
  AUTH: "/auth",
  CONVERSATIONS: "/conversations",
  CONVERSATION: "/conversation",
  ASSISTANT_CHAT: "/app/conversations/general-assistant",
  CONVERSATION_ASSISTANT: "/app/conversations/general-assistant",
  FORGOT_PASSWORD: "/forgot-password",
  REQUEST_ACCESS: "/request-access",
  ACCESS_PENDING: "/access-pending"
};

export const sidebarItems = [
  {
    label: "Conversations",
    children: [{ label: "Assistant chat", url: ROUTES.ASSISTANT_CHAT }],
  },
  { label: "Assistant chat", url: ROUTES.ASSISTANT_CHAT },
];
