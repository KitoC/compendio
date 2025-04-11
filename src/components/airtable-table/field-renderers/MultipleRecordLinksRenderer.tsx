import { FieldRendererProps } from "./index";
import { Tag } from "@/components/ui/tag";
import { useState } from "react";
import { Loader2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AirtableModal from "@/components/airtable-modal";

const MultipleRecordLinksRenderer = ({ field, value }: FieldRendererProps) => {
  const { linkedTableId } = field.options;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      {value.map((item, index) => (
        <Tag
          key={index}
          variant="muted"
          className="whitespace-nowrap"
          onClick={(e) => {
            setSelectedItem(item);
          }}
          // onRemove={(e) => {
          //   e.stopPropagation();
          //   console.log("remove", item);
          // }}
        >
          {!isLoading && <Table2 className="mr-2 w-3 h-3 rounded-full" />}
          {isLoading && <Loader2 className={cn("mr-2 animate-spin w-3 h-3")} />}
          {String(item)}
        </Tag>
      ))}

      <AirtableModal
        tableId={linkedTableId as string}
        recordId={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onSave={async (record) => {
          console.log("record", record);
        }}
        onLoadingChange={setIsLoading}
      />
    </div>
  );
};

export default MultipleRecordLinksRenderer;
