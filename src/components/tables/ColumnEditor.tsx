// NO_CHANGE
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Hash,
  AlignLeft,
  Check,
  Calendar,
  Key,
  X,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/IconButton";
import { Checkbox } from "@/components/ui/checkbox";
export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string;
  // Add field for persisted columns to track if this is a new or existing column
  tableFieldId?: string;
}

interface ColumnEditorProps {
  columns: Column[];
  onChange: (columns: Column[]) => void;
}

// Define the field type icons mapping
const FIELD_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <AlignLeft className="h-4 w-4" />,
  integer: <Hash className="h-4 w-4" />,
  boolean: <Check className="h-4 w-4" />,
  reference: <Key className="h-4 w-4" />,
  timestamp: <Calendar className="h-4 w-4" />,
  uuid: <Key className="h-4 w-4 rotate-45" />,
};

export const ColumnEditor: React.FC<ColumnEditorProps> = ({
  columns,
  onChange,
}) => {
  const [newColumns, setNewColumns] = useState<Column[]>(columns);
  const [fieldTypes, setFieldTypes] = useState<string[]>([]);

  // Fetch available field types from the database
  useEffect(() => {
    const fetchFieldTypes = async () => {
      try {
        const { data, error } = await supabase.rpc("get_field_types");

        if (error) {
          throw error;
        }

        if (data) {
          setFieldTypes(data);
        }
      } catch (error) {
        console.error("Error fetching field types:", error);
        toast.error("Failed to load field types");
        // Fallback to default types if fetch fails
        setFieldTypes([
          "text",
          "integer",
          "boolean",
          "reference",
          "timestamp",
          "uuid",
        ]);
      }
    };

    fetchFieldTypes();
  }, []);

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: crypto.randomUUID(),
      name: "",
      type: "text",
      isPrimary: false,
      isNullable: true,
      defaultValue: "",
    };

    const updatedColumns = [...newColumns, newColumn];
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
  };

  const handleRemoveColumn = (id: string) => {
    const updatedColumns = newColumns.filter((col) => col.id !== id);
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
  };

  const handleUpdateColumn = (
    id: string,
    field: keyof Column,
    value: string | boolean | number
  ) => {
    const updatedColumns = newColumns.map((col) => {
      if (col.id === id) {
        return { ...col, [field]: value };
      }
      return col;
    });
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
  };

  const toggleColumnOptions = (id: string) => {
    // This function would handle showing/hiding column options
    // For now, we'll just show the options directly in the main view
    console.log("Toggle options for column:", id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Columns</h3>
      </div>

      <div className="space-y-4">
        {newColumns.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted text-xs font-medium">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Default Value</div>
              <div className="col-span-1 text-center">Primary</div>
              <div className="col-span-1"></div>
            </div>

            {newColumns.map((column, index) => (
              <div
                key={column.id}
                className={`grid grid-cols-12 gap-2 py-2 px-2 items-center ${
                  index !== newColumns.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="col-span-4">
                  <Input
                    value={column.name}
                    onChange={(e) =>
                      handleUpdateColumn(column.id, "name", e.target.value)
                    }
                    placeholder="Column name"
                    className="w-full"
                  />
                </div>

                <div className="col-span-3">
                  <Select
                    value={column.type}
                    onValueChange={(value) =>
                      handleUpdateColumn(column.id, "type", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type">
                        {column.type && (
                          <div className="flex items-center">
                            {FIELD_TYPE_ICONS[column.type] || (
                              <AlignLeft className="h-4 w-4" />
                            )}
                            <span className="ml-2 capitalize">
                              {column.type}
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center">
                            {FIELD_TYPE_ICONS[type] || (
                              <AlignLeft className="h-4 w-4" />
                            )}
                            <span className="ml-2 capitalize">{type}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Input
                    value={column.defaultValue || ""}
                    onChange={(e) =>
                      handleUpdateColumn(
                        column.id,
                        "defaultValue",
                        e.target.value
                      )
                    }
                    placeholder="Default value"
                    className="w-full"
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={column.isPrimary}
                    onCheckedChange={(checked) =>
                      handleUpdateColumn(column.id, "isPrimary", checked)
                    }
                    id={`primary-${column.id}`}
                  />
                </div>

                <div className="col-span-1 flex justify-end space-x-1">
                  <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => toggleColumnOptions(column.id)}
                    title="Column settings"
                    icon={<Settings className="h-4 w-4" />}
                  />

                  <IconButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveColumn(column.id)}
                    title="Column settings"
                    icon={<X className="h-4 w-4" />}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 border rounded-md">
            <p className="text-muted-foreground">No columns added yet</p>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={handleAddColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>
    </div>
  );
};
