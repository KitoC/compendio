import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormData } from "@/types/chat";
import { useChat } from "@/contexts/chat";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface FormBuilderConfig {
  fields?: Array<{
    name: string;
    label: string;
    placeholder?: string;
    type: string;
  }>;

  initialValues?: Record<string, unknown>;
  onSubmit: (formattedMessage: string) => void;
  isInline?: boolean;
  isMulti?: boolean;
  hideChatInput?: boolean;
  disableChatInput?: boolean;
}

const COMPONENT_MAP: {
  [key: string]: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
} = {
  text: Input,
  number: Input,
  email: Input,
  tel: Input,
  checkbox: Checkbox as React.FC<React.InputHTMLAttributes<HTMLInputElement>>,
};

export interface FormBuilderProps {
  config: FormBuilderConfig;
  initialValues?: FormData;
  loading?: boolean;
}

export const FormBuilder = ({
  config,
  initialValues,
  loading,
}: FormBuilderProps) => {
  const { fields = [], isInline } = config;
  const { handleSendMessage } = useChat();

  const [formData, setFormData] = useState<FormData>(initialValues || {});

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return <p className="text-center text-destructive">Form not found</p>;
  }

  return (
    <div className="w-full transition-opacity duration-300 opacity-100">
      <form
        onSubmit={(e) => {
          e.preventDefault();

          let message = "";
          Object.entries(formData).forEach(([key, value]) => {
            message += `**${key}:** ${value}\n`;
          });

          handleSendMessage(message);
        }}
        className="space-y-4"
      >
        {fields.map((field) => {
          const Component = COMPONENT_MAP[field.type] || Input;

          return field.type === "checkbox" ? (
            <div key={field.name} className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={!!formData[field.name]}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    [field.name]: checked,
                  });
                }}
              />
              <Label htmlFor={field.name}>{field.label}</Label>
            </div>
          ) : (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Component
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={(formData[field.name] as string) || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, [field.name]: e.target.value });
                }}
              />
            </div>
          );
        })}

        <div className={`flex ${isInline ? "justify-end" : "justify-end"}`}>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
};
