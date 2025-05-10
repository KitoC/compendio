import { CustomTableField, SelectOption } from "@/types/customTable";
import { Tag } from "../ui/tag";
import { Loader2 } from "lucide-react";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomTableModal from "./CustomTableModal";
import { useState, useEffect } from "react";
import { useUpdateRecord } from "@/hooks/useCustomTableQuery";

const RecordTag = ({
  record,
  className,
  children,
  field,
  onDialogOpen,
  onDialogClose,
  modalId,
}: {
  record: SelectOption;
  className?: string;
  children?: React.ReactNode;
  field: CustomTableField;
  onDialogOpen?: () => void;
  onDialogClose?: () => void;
  modalId?: string;
}) => {
  const { inverse_linked_table_id } = field;

  const update = useUpdateRecord(inverse_linked_table_id as string);

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
        className={cn(
          "whitespace-nowrap cursor-pointer hover:bg-sidebar",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          setSelectedItem(record.value);
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
      <CustomTableModal
        tableId={inverse_linked_table_id as string}
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
