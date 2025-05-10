import { useCustomTables } from "@/contexts/CustomTables";
import { useTenant } from "@/contexts/TenantContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableSelectorProps {
  selectedTableId: string;
  onTableChange: (tableId: string) => void;
}

const TableSelector = ({
  selectedTableId,
  onTableChange,
}: TableSelectorProps) => {
  const { tables } = useCustomTables();

  return (
    <Select value={selectedTableId} onValueChange={onTableChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a table" />
      </SelectTrigger>
      <SelectContent>
        {tables.map((table) => (
          <SelectItem key={table.id} value={table.id}>
            {table.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TableSelector;
