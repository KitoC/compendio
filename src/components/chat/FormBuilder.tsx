
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormConfig, FormData } from "@/types/chat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface OptionCardProps {
  option: {
    id: string;
    name: string;
    description?: string;
    onClick: () => void;
  };
  isSelected: boolean;
  onSelect: () => void;
}

const OptionCard = ({ option, isSelected, onSelect }: OptionCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{option.name}</CardTitle>
        {option.description && <CardDescription>{option.description}</CardDescription>}
      </CardHeader>
      <CardFooter>
        <Button variant={isSelected ? "default" : "outline"} size="sm" onClick={onSelect} className="mt-2">
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const COMPONENT_MAP: Record<string, any> = {
  text: Input,
  number: Input,
  email: Input,
  tel: Input,
  checkbox: Checkbox,
};

export interface FormBuilderProps {
  formConfig: FormConfig;
  loading?: boolean;
}

export const FormBuilder = ({ formConfig, loading }: FormBuilderProps) => {
  const [formData, setFormData] = useState<FormData>(
    formConfig?.initialValues || {}
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formConfig) {
    return <p className="text-center text-destructive">Form not found</p>;
  }

  return (
    <div className="w-full transition-opacity duration-300 opacity-100">
      {formConfig?.options?.length ? (
        <div className="flex flex-wrap gap-4 w-full">
          {formConfig.options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              onSelect={() => {
                if (formConfig.isMulti) {
                  setSelectedOptions((prev) =>
                    prev.includes(option.id)
                      ? prev.filter((id) => id !== option.id)
                      : [...prev, option.id]
                  );
                } else {
                  option.onClick();
                }
              }}
            />
          ))}

          {formConfig.isMulti && selectedOptions.length > 0 && (
            <div className={`flex ${formConfig.isInline ? 'justify-end' : 'justify-end'} w-full`}>
              <Button
                onClick={() =>
                  formConfig.onSubmit(
                    selectedOptions
                      .map(
                        (id) =>
                          formConfig.options?.find((option) => option.id === id)
                            ?.name
                      )
                      .join("\n")
                  )
                }
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      ) : null}
      
      {formConfig?.fields?.length ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();

            let message = "";
            Object.entries(formData).forEach(([key, value]) => {
              message += `**${key}:** ${value}\n`;
            });

            formConfig.onSubmit(message);
          }}
          className="space-y-4"
        >
          {formConfig.fields.map((field) => {
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
                  value={formData[field.name] as string || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFormData({ ...formData, [field.name]: e.target.value });
                  }}
                />
              </div>
            );
          })}
          
          <div className={`flex ${formConfig.isInline ? 'justify-end' : 'justify-end'}`}>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      ) : null}
      
      {!formConfig?.fields?.length && !formConfig?.options?.length && (
        <div className={`flex ${formConfig.isInline ? 'flex-row' : 'flex-col'} gap-2`}>
          {formConfig?.buttons?.map((button) => (
            <Button key={button.text} onClick={button.onClick}>
              {button.text}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
