export type FormField = {
  name: string;
  type:
    | "text"
    | "number"
    | "email"
    | "tel"
    | "password"
    | "textarea"
    | "checkbox";
  label: string;
  placeholder: string;
  value?: string | boolean;
};

export type FormButton = {
  text: string;
  onClick: () => void;
};
export type FormData = Record<string, unknown>;

export type OptionCardType = {
  id: string;
  name: string;
  description: string;
  imgUrl?: string;
  tags: string[];
  onClick: () => void;
};

export type FormConfig = {
  initialValues?: FormData;
  buttons?: FormButton[];
  fields?: FormField[];
  options?: OptionCardType[];
  onSubmit: (formattedMessage: string) => void;
  isInline?: boolean;
  isMulti?: boolean;
  hideChatInput?: boolean;
  disableChatInput?: boolean;
};
