import React from "react";
import { FieldRendererProps } from "./index";

const TextRenderer = ({ field, value }: FieldRendererProps) => {
  const text = String(
    typeof value === "object" ? (value as { value: string }).value : value
  );
  const maxLength = 100;

  if (["longText", "aiText"].includes(field.type) && text.length > maxLength) {
    return (
      <span className="text-sm truncate" title={text}>
        {text.substring(0, maxLength)}...
      </span>
    );
  }

  return (
    <span className="text-sm truncate" title={text}>
      {text}
    </span>
  );
};

export default TextRenderer;
