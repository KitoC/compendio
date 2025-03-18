
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Hash, Link, List, MessageSquare, X, Plus } from "lucide-react";

export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string;
}

interface ColumnEditorProps {
  columns: Column[];
  onChange: (columns: Column[]) => void;
}

const COLUMN_TYPES = [
  { value: "text", label: "Text", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "integer", label: "Integer", icon: <Hash className="h-4 w-4" /> },
  { value: "boolean", label: "Boolean", icon: <List className="h-4 w-4" /> },
  { value: "reference", label: "Reference", icon: <Link className="h-4 w-4" /> }
];

export const ColumnEditor: React.FC<ColumnEditorProps> = ({ columns, onChange }) => {
  const [newColumns, setNewColumns] = useState<Column[]>(columns);

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: crypto.randomUUID(),
      name: "",
      type: "text",
      isPrimary: false,
      isNullable: true,
      defaultValue: ""
    };
    
    const updatedColumns = [...newColumns, newColumn];
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
  };

  const handleRemoveColumn = (id: string) => {
    const updatedColumns = newColumns.filter(col => col.id !== id);
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
  };

  const handleUpdateColumn = (id: string, field: keyof Column, value: any) => {
    const updatedColumns = newColumns.map(col => {
      if (col.id === id) {
        return { ...col, [field]: value };
      }
      return col;
    });
    setNewColumns(updatedColumns);
    onChange(updatedColumns);
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
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Default Value</div>
              <div className="col-span-2">Options</div>
              <div className="col-span-1"></div>
            </div>
            
            {newColumns.map((column, index) => (
              <div key={column.id} className={`grid grid-cols-12 gap-2 p-3 items-center ${index !== newColumns.length - 1 ? 'border-b' : ''}`}>
                <div className="col-span-3">
                  <Input
                    value={column.name}
                    onChange={(e) => handleUpdateColumn(column.id, "name", e.target.value)}
                    placeholder="Column name"
                    className="w-full"
                  />
                </div>
                
                <div className="col-span-3">
                  <Select
                    value={column.type}
                    onValueChange={(value) => handleUpdateColumn(column.id, "type", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-3">
                  <Input
                    value={column.defaultValue || ""}
                    onChange={(e) => handleUpdateColumn(column.id, "defaultValue", e.target.value)}
                    placeholder="Default value"
                    className="w-full"
                  />
                </div>
                
                <div className="col-span-2 flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={column.isPrimary}
                      onCheckedChange={(checked) => handleUpdateColumn(column.id, "isPrimary", checked)}
                      id={`primary-${column.id}`}
                    />
                    <Label htmlFor={`primary-${column.id}`} className="text-xs">Primary</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={column.isNullable}
                      onCheckedChange={(checked) => handleUpdateColumn(column.id, "isNullable", checked)}
                      id={`nullable-${column.id}`}
                    />
                    <Label htmlFor={`nullable-${column.id}`} className="text-xs">Nullable</Label>
                  </div>
                </div>
                
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveColumn(column.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
