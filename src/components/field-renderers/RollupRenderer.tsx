import React from "react";
import { FieldRendererProps } from "./index";

const RollupRenderer = ({ field, value }: FieldRendererProps) => {
  const type = field.sub_type || "singleLineText";

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Rollup fields can return different types of values depending on the rollup function
  // (e.g., COUNT, SUM, AVERAGE, etc.)

  // For array values (e.g., from ARRAYCOMPACT, ARRAYJOIN functions)
  if (Array.isArray(value)) {
    return (
      <span className="text-sm truncate" title={value.join(", ")}>
        {value.join(", ")}
      </span>
    );
  }

  // For numeric values (e.g., from COUNT, SUM, AVERAGE functions)
  if (typeof value === "number" || type === "number") {
    const v =
      typeof value === "number"
        ? value
        : (value as { specialValue: number }).specialValue;
    // Format with precision if specified in options
    const precision =
      field?.precision !== undefined ? Number(field.precision) : 2;

    return (
      <span className="block w-full">
        {field?.prefix}
        {Number(value)?.toFixed?.(precision) || v}
        {field?.suffix}
      </span>
    );
  }

  // For string values
  if (
    typeof value === "string" ||
    ["singleLineText", "longText"].includes(type as string)
  ) {
    return (
      <span className="text-sm truncate" title={value as string}>
        {value as string}
      </span>
    );
  }

  // For object values (some rollups return objects)
  if (typeof value === "object") {
    const stringValue = JSON.stringify(value);

    return (
      <span className="text-sm truncate" title={stringValue}>
        {stringValue}
      </span>
    );
  }

  // Default fallback
  return <span className="text-sm">{String(value)}</span>;
};

export default RollupRenderer;
