import { IMessage, MessageRole } from "../contexts/ai/types";
import { v4 as uuidv4 } from "uuid";

export const createMessage = (message: Partial<IMessage>): IMessage => {
  return {
    id: uuidv4(),
    role: message.role || MessageRole.USER,
    content: message.content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    loading: message.loading || false,
  };
};
