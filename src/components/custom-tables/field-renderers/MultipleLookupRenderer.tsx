
import React from "react";
import { FieldRendererProps } from "./index";
import { Badge } from "@/components/ui/badge";

const MultipleLookupRenderer = ({ field, value }: FieldRendererProps) => {
  // Handle case when no values
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-full">
      {value.map((item, index) => (
        <Badge key={index} variant="outline" className="whitespace-nowrap">
          {String(item)}
        </Badge>
      ))}
    </div>
  );
};

export default MultipleLookupRenderer;
