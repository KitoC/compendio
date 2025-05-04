import React from "react";
import { FieldRendererProps } from "./index";

const MultiSelectRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  // Default colors if not provided
  const defaultColors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-purple-100 text-purple-800",
  ];

  // Map Airtable colors to Tailwind classes
  const getColorClass = (color?: string) => {
    if (!color) return defaultColors[0];

    // This is a simple mapping, you might want to expand it
    switch (color.toLowerCase()) {
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      case "pink":
        return "bg-pink-100 text-pink-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      default:
        return defaultColors[0];
    }
  };

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {value.map((id: string, index: number) => {
        // Find the choice by ID
        const choice = field.options?.find((c) => c.id === id);

        if (!choice) {
          return (
            <span
              key={`${id}-${index}`}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {id}
            </span>
          );
        }

        const colorClass = getColorClass(choice.color);

        return (
          <span
            key={`${id}-${index}`}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
          >
            {choice.name}
          </span>
        );
      })}
    </div>
  );
};

export default MultiSelectRenderer;
