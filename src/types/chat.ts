
export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  FORM = "form"
}

export interface IMessage {
  id: string;
  role: MessageRole | string;
  content: string | object;
  createdAt?: string;
  loading?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id?: string;
  role: MessageRole | string;
  content: {
    text?: string;
    [key: string]: any;
  };
  metadata: Record<string, any>;
  created_at?: string;
  loading?: boolean;
}

export interface FormConfig {
  fields?: Array<{
    name: string;
    label: string;
    placeholder?: string;
    type: string;
  }>;
  buttons?: Array<{
    text: string;
    onClick: () => void;
  }>;
  options?: Array<{
    id: string;
    name: string;
    description?: string;
    onClick: () => void;
  }>;
  initialValues?: Record<string, any>;
  onSubmit: (formattedMessage: string) => void;
  isInline?: boolean;
  isMulti?: boolean;
  hideChatInput?: boolean;
  disableChatInput?: boolean;
}

export interface FormData {
  [key: string]: string | boolean | number;
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  domain?: string;
  session_id?: string;
}
