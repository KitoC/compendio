import { DataTableRecordLabel } from "@/types/airtable";
import { Tag } from "../ui/tag";
import { Loader2 } from "lucide-react";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AirtableModal from "../airtable-modal";
import { useState, useEffect } from "react";
import { AirtableField } from "@/types/airtable";
import { useUpdateRecord } from "@/hooks/useAirtableQuery";
import { createPortal } from "react-dom";
const preventDefaults = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const RecordTag = ({
  record,
  className,
  children,
  field,
  onDialogOpen,
  onDialogClose,
  modalId,
}: {
  record: DataTableRecordLabel;
  className?: string;
  children?: React.ReactNode;
  field: AirtableField;
  onDialogOpen?: () => void;
  onDialogClose?: () => void;
  modalId?: string;
}) => {
  const { linkedTableId } = field.options;

  const update = useUpdateRecord(linkedTableId as string);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalEl, setModalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedItem) {
      onDialogOpen?.();
    } else {
      onDialogClose?.();
    }
  }, [selectedItem, onDialogOpen, onDialogClose]);

  return (
    <>
      <Tag
        variant="outline"
        className={cn("whitespace-nowrap", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          setSelectedItem(record.record_id);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {isLoading ? (
          <Loader2 className={cn("mr-1 animate-spin w-3 h-3")} />
        ) : (
          <Table2 className="mr-1 w-3 h-3 rounded-full" />
        )}
        {children || record.label}
      </Tag>
      <AirtableModal
        tableId={linkedTableId as string}
        recordId={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onSave={async (record) => {
          await update.mutateAsync(record);
          setSelectedItem(null);
        }}
        onLoadingChange={setIsLoading}
      />{" "}
    </>
  );
};

export default RecordTag;
