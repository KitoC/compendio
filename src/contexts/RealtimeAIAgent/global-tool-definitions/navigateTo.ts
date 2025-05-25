import { Type } from "@sinclair/typebox";

const navigateTo = {
  type: "function",
  name: "navigateTo",
  description: "Navigates to a new page",
  parameters: Type.Object({
    url: Type.String({
      description: "The URL to navigate to",
      enum: [
        "/dashboard",
        "/clients",
        "/staff-members",
        "/quotes",
        "/quotes/new",
      ],
    }),
  }),
};

export default navigateTo;
