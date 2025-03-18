
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  FileDown, 
  FileUp, 
  MoreHorizontal,
  Check,
  X
} from "lucide-react";
import { format } from "date-fns";

// Define the type for a custom table field
interface CustomTableField {
  id: string;
  name: string;
  display_name: string;
  field_type: string;
  is_required: boolean;
  description?: string;
  options?: any;
}

// Define the type for a custom table row (records)
interface CustomTableRow {
  id: string;
  [key: string]: any;
}

interface DataManagerProps {
  tableId: string;
  tableName: string;
  displayName: string;
  fields: CustomTableField[];
  onSuccess?: () => void;
}

export const DataManager = ({ 
  tableId, 
  tableName, 
  displayName,
  fields,
  onSuccess
}: DataManagerProps) => {
  const { user, tenantId } = useAuth();
  const [rows, setRows] = useState<CustomTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomTableRow | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Generate a dynamic schema based on the fields
  const generateFormSchema = () => {
    const schemaObj: Record<string, any> = {};
    
    fields.forEach(field => {
      let fieldSchema;
      
      switch (field.field_type) {
        case 'text':
        case 'textarea':
          fieldSchema = field.is_required 
            ? z.string().min(1, `${field.display_name} is required`) 
            : z.string().optional();
          break;
        case 'number':
          fieldSchema = field.is_required 
            ? z.number().or(z.string().regex(/^\d+$/).transform(Number)) 
            : z.number().or(z.string().regex(/^\d*$/).transform(val => val ? Number(val) : undefined)).optional();
          break;
        case 'email':
          fieldSchema = field.is_required 
            ? z.string().email(`Invalid email address`) 
            : z.string().email(`Invalid email address`).optional();
          break;
        case 'boolean':
          fieldSchema = z.boolean().optional().default(false);
          break;
        case 'date':
          fieldSchema = field.is_required 
            ? z.date()
            : z.date().optional();
          break;
        case 'select':
          // For select fields, we need to ensure that the value is one of the available options
          const options = field.options?.values || [];
          fieldSchema = field.is_required 
            ? z.string().refine(val => options.includes(val), `Please select a valid option`) 
            : z.string().optional();
          break;
        default:
          fieldSchema = field.is_required 
            ? z.string().min(1, `${field.display_name} is required`) 
            : z.string().optional();
      }
      
      schemaObj[field.name] = fieldSchema;
    });
    
    return z.object(schemaObj);
  };

  const dynamicSchema = generateFormSchema();
  type FormValues = z.infer<typeof dynamicSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {}
  });

  // Fetch data when component mounts
  useEffect(() => {
    if (!tenantId || !tableName) return;
    
    const fetchRecords = async () => {
      setLoading(true);
      try {
        // Query the dynamic table (using RPC or custom endpoint)
        const { data, error } = await supabase.rpc('get_custom_table_data', {
          p_table_name: tableName,
          p_tenant_id: tenantId
        });

        if (error) throw error;
        
        setRows(data || []);
      } catch (error: any) {
        console.error("Error fetching records:", error);
        toast.error(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [tenantId, tableName]);

  // Open the record dialog for adding or editing a record
  const openRecordDialog = (record: CustomTableRow | null = null) => {
    if (record) {
      setEditingRecord(record);
      // Reset form with current values
      const formValues: Record<string, any> = {};
      
      fields.forEach(field => {
        // Convert date strings to Date objects for date fields
        if (field.field_type === 'date' && record[field.name]) {
          formValues[field.name] = new Date(record[field.name]);
        } else {
          formValues[field.name] = record[field.name];
        }
      });
      
      form.reset(formValues);
    } else {
      setEditingRecord(null);
      // Reset form with empty values
      const defaultValues: Record<string, any> = {};
      
      fields.forEach(field => {
        if (field.field_type === 'boolean') {
          defaultValues[field.name] = false;
        } else {
          defaultValues[field.name] = '';
        }
      });
      
      form.reset(defaultValues);
    }
    
    setIsRecordDialogOpen(true);
  };

  // Confirm record deletion
  const confirmDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setIsDeleteDialogOpen(true);
  };

  // Delete record
  const deleteRecord = async () => {
    if (!recordToDelete || !tenantId || !tableName) return;

    try {
      // Delete the record from the dynamic table
      const { error } = await supabase.rpc('delete_custom_table_record', {
        p_table_name: tableName,
        p_record_id: recordToDelete,
        p_tenant_id: tenantId
      });

      if (error) throw error;

      toast.success("Record deleted successfully");
      // Update local state
      setRows(rows.filter(row => row.id !== recordToDelete));
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error(error.message || "Failed to delete record");
    } finally {
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Submit record form
  const onSubmitRecord = async (values: FormValues) => {
    if (!tenantId || !tableName) return;

    setIsSaving(true);
    try {
      // Prepare values to match database expectations
      const recordValues = { ...values };
      
      // Handle date values
      fields.forEach(field => {
        if (field.field_type === 'date' && recordValues[field.name]) {
          recordValues[field.name] = (recordValues[field.name] as Date).toISOString();
        }
      });

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase.rpc('update_custom_table_record', {
          p_table_name: tableName,
          p_record_id: editingRecord.id,
          p_tenant_id: tenantId,
          p_data: recordValues
        });

        if (error) throw error;
        
        toast.success("Record updated successfully");
        
        // Update local state
        setRows(rows.map(row => 
          row.id === editingRecord.id 
            ? { ...row, ...recordValues } 
            : row
        ));
      } else {
        // Create new record
        const { data, error } = await supabase.rpc('insert_custom_table_record', {
          p_table_name: tableName,
          p_tenant_id: tenantId,
          p_data: recordValues
        });

        if (error) throw error;
        
        toast.success("Record created successfully");
        
        // Update local state with the new record (including its ID)
        if (data && data.id) {
          setRows([...rows, { id: data.id, ...recordValues }]);
        }
      }

      if (onSuccess) onSuccess();
      
      // Close the dialog
      setIsRecordDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving record:", error);
      toast.error(error.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  // Export data to CSV
  const exportToCsv = () => {
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Create headers row
      const headers = fields.map(field => field.display_name).join(',');
      
      // Create data rows
      const csvRows = rows.map(row => {
        return fields.map(field => {
          const value = row[field.name];
          
          // Handle different field types
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if needed
            return `"${value.replace(/"/g, '""')}"`;
          } else if (field.field_type === 'date') {
            return `"${format(new Date(value), 'yyyy-MM-dd')}"`;
          } else if (field.field_type === 'boolean') {
            return value ? 'true' : 'false';
          } else {
            return value;
          }
        }).join(',');
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...csvRows].join('\n');
      
      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${displayName.toLowerCase().replace(/\s+/g, '_')}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  // Toggle select all rows
  const toggleSelectAll = () => {
    if (selectedRows.length === rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(rows.map(row => row.id));
    }
  };

  // Toggle select a single row
  const toggleSelectRow = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      setSelectedRows(selectedRows.filter(id => id !== rowId));
    } else {
      setSelectedRows([...selectedRows, rowId]);
    }
  };

  // Filter rows based on search term
  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    
    // Search in all text/string fields
    return fields.some(field => {
      if (['text', 'textarea', 'email', 'select'].includes(field.field_type)) {
        const value = row[field.name];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  });

  // Render field value based on type
  const renderFieldValue = (row: CustomTableRow, field: CustomTableField) => {
    const value = row[field.name];
    
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    switch (field.field_type) {
      case 'boolean':
        return value ? 
          <Check className="h-4 w-4 text-green-500" /> : 
          <X className="h-4 w-4 text-red-500" />;
      case 'date':
        return format(new Date(value), 'yyyy-MM-dd');
      default:
        return value.toString();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => openRecordDialog()} className="flex-1 sm:flex-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-auto">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCsv}>
                <FileDown className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              {/* Future: Add more export options */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRows.length === rows.length && rows.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                {fields.map(field => (
                  <TableHead key={field.id}>{field.display_name}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={fields.length + 2} className="text-center py-8">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={fields.length + 2} className="text-center py-8">
                    {searchTerm ? "No matching records found" : "No records found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.includes(row.id)}
                        onCheckedChange={() => toggleSelectRow(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </TableCell>
                    {fields.map(field => (
                      <TableCell key={`${row.id}-${field.id}`}>
                        {renderFieldValue(row, field)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openRecordDialog(row)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => confirmDeleteRecord(row.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Edit Record" : "Add New Record"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRecord)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                        <FormLabel>{field.display_name}</FormLabel>
                        <FormControl>
                          {renderFormInput(field, formField)}
                        </FormControl>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRecordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingRecord ? "Update Record" : "Add Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRecord}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to render the appropriate form input based on field type
function renderFormInput(field: CustomTableField, formField: any) {
  switch (field.field_type) {
    case 'textarea':
      return (
        <Textarea 
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          className="min-h-[100px]"
          {...formField}
        />
      );
    case 'select':
      return (
        <Select
          onValueChange={formField.onChange}
          defaultValue={formField.value}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.display_name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options?.values || []).map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'boolean':
      return (
        <Switch
          checked={formField.value}
          onCheckedChange={formField.onChange}
        />
      );
    case 'date':
      return (
        <Input
          type="date"
          value={formField.value instanceof Date 
            ? format(formField.value, 'yyyy-MM-dd')
            : formField.value
          }
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            formField.onChange(date);
          }}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          {...formField}
        />
      );
    case 'email':
      return (
        <Input
          type="email"
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          {...formField}
        />
      );
    default:
      return (
        <Input
          placeholder={`Enter ${field.display_name.toLowerCase()}`}
          {...formField}
        />
      );
  }
}

export default DataManager;
