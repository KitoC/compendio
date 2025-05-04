import React from "react";
import { FieldRendererProps } from "./index";
import { getAirtableColor } from "@/utils/airtable";

const SingleSelectRenderer = ({ field, value }: FieldRendererProps) => {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;

  // Find the choice by ID
  const choice = field.options?.find((c) => c.name === value);

  if (!choice) {
    return <span className="text-sm">{String(value)}</span>;
  }

  // Default colors if not provided

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAirtableColor(
        choice.color
      )}`}
    >
      {choice.name}
    </span>
  );
};

export default SingleSelectRenderer;
