import { FieldRendererProps } from "./index";
import { Tag } from "@/components/ui/tag";
import { useState } from "react";
import { Loader2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomTableModal from "@/components/custom-tables/CustomTableModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RecordTag from "../RecordTag";

// TODO: re-implement this
const MultipleRecordLinksRenderer = ({
  field,
  value,
  record,
}: FieldRendererProps) => {
  // Handle case when no values
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div
      className="flex flex-wrap gap-1 max-w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {value.map((item, index) => {
        return <RecordTag record={item} field={field} />;
      })}
    </div>
  );
};

export default MultipleRecordLinksRenderer;
