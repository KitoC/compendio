import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export interface Option {
  id: string;
  name: string;
  description?: string;
  onClick: () => void;
}

interface OptionCardProps {
  option: Option;
  isSelected: boolean;
  onSelect: () => void;
}

const OptionCard = ({ option, isSelected, onSelect }: OptionCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{option.name}</CardTitle>
        {option.description && (
          <CardDescription>{option.description}</CardDescription>
        )}
      </CardHeader>
      <CardFooter>
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          className="mt-2"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export interface OptionsBuilderConfig {
  options: Option[];
  isMulti: boolean;
  isInline: boolean;
}

export interface OptionsBuilderProps {
  config: OptionsBuilderConfig;
}

export const OptionsBuilder = ({ config }: OptionsBuilderProps) => {
  const { options, isMulti, isInline } = config;
  const { handleSendMessage } = useChat();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const submitMultipleOptions = () => {
    handleSendMessage(
      selectedOptions
        .map((id) => options?.find((option) => option.id === id)?.name)
        .join("\n")
    );
  };

  const onSelect = (option: { id: string; name: string }) => {
    if (isMulti) {
      setSelectedOptions((prev) =>
        prev.includes(option.id)
          ? prev.filter((id) => id !== option.id)
          : [...prev, option.id]
      );
    } else {
      handleSendMessage(option.name);
    }
  };

  if (!config) {
    return <p className="text-center text-destructive">Form not found</p>;
  }

  return (
    <div className="w-full transition-opacity duration-300 opacity-100">
      <div className="flex flex-wrap gap-4 w-full">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            isSelected={selectedOptions.includes(option.id)}
            onSelect={() => onSelect(option)}
          />
        ))}

        {config.isMulti && selectedOptions.length > 0 && (
          <div
            className={`flex ${
              isInline ? "justify-end" : "justify-end"
            } w-full`}
          >
            <Button onClick={submitMultipleOptions}>Submit</Button>
          </div>
        )}
      </div>
    </div>
  );
};
