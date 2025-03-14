import { FormConfig, FormData } from "./types";
import { Button } from "../common/Button";
import styled from "styled-components";
import { useState } from "react";
import { Input, InputProps } from "../common/form/Input";
import { Checkbox, CheckboxProps } from "../common/form/Checkbox";
import OptionCard from "./OptionCard";
import LoadingSpinner from "../common/LoadingSpinner";
import { useAI } from "../../contexts/ai";

const FormContainer = styled.div<{ isStreaming: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  transition: opacity 0.3s ease-in-out;
  opacity: ${({ isStreaming }) => (isStreaming ? 0 : 1)};
`;

const ButtonGroup = styled.div<{ isInline: boolean }>`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-direction: ${({ isInline }) => (isInline ? "row" : "column")};
  justify-content: ${({ isInline }) => (isInline ? "flex-end" : "flex-end")};
  align-items: ${({ isInline }) => (isInline ? "center" : "flex-end")};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const COMPONENT_MAP: Record<
  string,
  React.ComponentType<InputProps> | React.ComponentType<CheckboxProps>
> = {
  text: Input,
  number: Input,
  email: Input,
  tel: Input,
  checkbox: Checkbox,
};

export type FormBuilderProps = {
  formConfig: FormConfig;
  loading?: boolean;
};

export const FormBuilder = ({ formConfig, loading }: FormBuilderProps) => {
  const { isStreaming } = useAI();
  const [formData, setFormData] = useState<FormData>(
    formConfig?.initialValues || {}
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  if (loading) return <LoadingSpinner />;

  if (!formConfig) {
    return <p className="text-center text-red-500">Form not found</p>;
  }

  return (
    <FormContainer isStreaming={isStreaming}>
      {formConfig?.options?.length && (
        <div className="flex flex-wrap gap-4">
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

          <ButtonGroup isInline>
            <Button
              type="submit"
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
          </ButtonGroup>
        </div>
      )}
      {formConfig?.fields?.length && (
        <Form
          onSubmit={(e) => {
            e.preventDefault();

            let message = "";

            Object.entries(formData).forEach(([key, value]) => {
              message += `**${key}:** ${value}\n`;
            });

            formConfig.onSubmit(message);
          }}
        >
          {formConfig.fields.map((field) => {
            const Component = COMPONENT_MAP[field.type] || Input;

            return (
              <Component
                key={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] as string}
                label={field.label}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (field.type === "checkbox") {
                    setFormData({
                      ...formData,
                      [field.name]: e.target.checked,
                    });
                  } else {
                    setFormData({ ...formData, [field.name]: e.target.value });
                  }
                }}
              />
            );
          })}
          <ButtonGroup isInline>
            <Button type="submit">Submit</Button>
          </ButtonGroup>
        </Form>
      )}
      {!formConfig?.fields?.length && (
        <ButtonGroup isInline={!!formConfig?.isInline}>
          {formConfig?.buttons?.map((button) => (
            <Button key={button.text} onClick={button.onClick}>
              {button.text}
            </Button>
          ))}
        </ButtonGroup>
      )}
    </FormContainer>
  );
};
