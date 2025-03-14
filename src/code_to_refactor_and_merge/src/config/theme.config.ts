export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
  };
  branding: {
    logo?: string;
    title: string;
  };
  chat: {
    userTextColor: string;
    botTextColor: string;
    userBubbleColor: string;
    botBubbleColor: string;
    userAvatarBg: string;
    botAvatarBg: string;
  };
}

const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#4F46E5", // indigo-600
    secondary: "#6366F1", // indigo-500
  },
  branding: {
    title: "AI Chat",
  },
  chat: {
    userTextColor: "#FFFFFF",
    botTextColor: "#374151", // gray-700
    userBubbleColor: "#4F46E5", // indigo-600
    botBubbleColor: "#FFFFFF",
    userAvatarBg: "#4F46E5", // indigo-600
    botAvatarBg: "#E5E7EB", // gray-200
  },
};

export default defaultTheme;
