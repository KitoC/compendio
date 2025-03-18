
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Trash,
  Pencil
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input as FormInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// Define a schema for dynamic form validation
const formSchema = z.object({
  // Dynamic schema will be added here based on table fields
});

// Update the CustomTableRow type to accept UUID as string or Json
interface CustomTableRow {
  id: string;
  [key: string]: any;
}

interface Field {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
  options?: {
    [key: string]: any;
  };
}

interface DataManagerProps {
  tableId: string;
  tableName: string;
  displayName: string;
  fields: Field[];
}

export const DataManager: React.FC<DataManagerProps> = ({ tableId, tableName, displayName, fields }) => {
  const { tenantId } = useAuth();
  const [tableData, setTableData] = useState<CustomTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<CustomTableRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dynamically create the form schema based on the fields
  const generateDynamicFormSchema = () => {
    const schemaFields: Record<string, any> = {};
    
    fields.forEach((field) => {
      let fieldSchema: any = z.string().optional();

      if (field.is_required) {
        fieldSchema = z.string().min(1, `${field.display_name} is required`);
      }

      if (field.field_type === "number") {
        fieldSchema = field.is_required 
          ? z.string().min(1).transform(val => Number(val))
          : z.string().optional().transform(val => val ? Number(val) : undefined);
      }

      if (field.field_type === "boolean") {
        fieldSchema = z.boolean().optional();
        if (field.is_required) {
          fieldSchema = z.boolean().refine(val => val === true, `${field.display_name} is required`);
        }
      }

      schemaFields[field.name] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const dynamicFormSchema = generateDynamicFormSchema();
  type FormData = z.infer<typeof dynamicFormSchema>;

  const addForm = useForm<FormData>({
    resolver: zodResolver(dynamicFormSchema),
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(dynamicFormSchema),
  });

  useEffect(() => {
    loadTableData();
  }, [tableName, tenantId]);

  // Fix the setTableData type issue - making sure we convert Json id to string
  const loadTableData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_custom_table_data", {
        p_table_name: tableName,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      // Transform the data to ensure id is a string
      const typedData = (data || []).map((row: Record<string, any>) => ({
        ...row,
        id: row.id?.toString() || '',
      }));

      setTableData(typedData as CustomTableRow[]);
    } catch (error: any) {
      console.error("Error loading table data:", error);
      toast.error(error.message || "Failed to load table data");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    addForm.reset();
    setAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
  };

  const openEditDialog = (row: CustomTableRow) => {
    setEditingRow(row);
    editForm.reset({ ...row });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
  };

  const confirmDeleteRow = (rowId: string) => {
    setRowToDelete(rowId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  const deleteRow = async () => {
    if (!rowToDelete) return;

    try {
      const { error } = await supabase.rpc("delete_custom_table_record", {
        p_table_name: tableName,
        p_record_id: rowToDelete,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      setTableData((prev) => prev.filter((row) => row.id !== rowToDelete));
      toast.success("Record deleted successfully");
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error(error.message || "Failed to delete record");
    } finally {
      closeDeleteDialog();
    }
  };

  // Fix the type issue in the addRow function
  const addRow = async (formData: Record<string, any>) => {
    try {
      const { data, error } = await supabase.rpc("insert_custom_table_record", {
        p_table_name: tableName,
        p_tenant_id: tenantId,
        p_data: formData,
      });

      if (error) throw error;

      // Make sure we have a string ID
      const newRowId = typeof data?.id === 'string' ? data.id : data?.id?.toString() || '';
      const newRow: CustomTableRow = { id: newRowId, ...formData };
      
      setTableData((prev) => [...prev, newRow]);
      
      toast.success("Record created successfully");
      setAddDialogOpen(false);
      addForm.reset();
    } catch (error: any) {
      console.error("Error creating record:", error);
      toast.error(error.message || "Failed to create record");
    }
  };

  const updateRow = async (formData: Record<string, any>) => {
    if (!editingRow) return;

    try {
      const { error } = await supabase.rpc("update_custom_table_record", {
        p_table_name: tableName,
        p_record_id: editingRow.id,
        p_tenant_id: tenantId,
        p_data: formData,
      });

      if (error) throw error;

      setTableData((prev) =>
        prev.map((row) => (row.id === editingRow.id ? { ...row, ...formData } : row))
      );
      toast.success("Record updated successfully");
      closeEditDialog();
    } catch (error: any) {
      console.error("Error updating record:", error);
      toast.error(error.message || "Failed to update record");
    }
  };

  // Filtering function for search
  const filteredData = tableData.filter(row => {
    if (!searchQuery) return true;
    
    // Search in all text fields
    return Object.keys(row).some(key => {
      const value = row[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });
  });

  // Sorting function
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Handle different types for comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // For mixed or unsortable types, convert to string
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and reset to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderTableCell = (row: CustomTableRow, field: Field) => {
    const value = row[field.name];
    
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }
    
    switch (field.field_type) {
      case 'boolean':
        return value ? (
          <Badge variant="success" className="bg-green-100 text-green-800">Yes</Badge>
        ) : (
          <Badge variant="outline" className="text-gray-500">No</Badge>
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  };

  // Render form field based on field type
  const renderFormField = (field: Field, form: any) => {
    switch (field.field_type) {
      case 'boolean':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                <div>
                  <FormLabel>{field.display_name}</FormLabel>
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        );
      case 'select':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.display_name}</FormLabel>
                <Select 
                  onValueChange={formField.onChange} 
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.display_name}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.values?.map((option: string) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'textarea':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.display_name}</FormLabel>
                <FormControl>
                  <textarea
                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={field.display_name}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.display_name}</FormLabel>
                <FormControl>
                  <FormInput 
                    placeholder={field.display_name} 
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    {...formField} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{displayName}</h2>
          <p className="text-sm text-muted-foreground">
            Manage data records for this table
          </p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field) => (
                <TableHead key={field.name} className="whitespace-nowrap">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort(field.name)}
                  >
                    {field.display_name}
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${sortColumn === field.name ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={fields.length + 1} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fields.length + 1} className="h-24 text-center">
                  {searchQuery ? "No results found." : "No data available."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={row.id} className="group hover:bg-muted/50">
                  {fields.map((field) => (
                    <TableCell key={`${row.id}-${field.name}`}>
                      {renderTableCell(row, field)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(row)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => confirmDeleteRow(row.id)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={addForm.handleSubmit(addRow)} className="space-y-4 py-2">
            {fields.map(field => renderFormField(field, addForm))}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeAddDialog}>
                Cancel
              </Button>
              <Button type="submit">Add Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={editForm.handleSubmit(updateRow)} className="space-y-4 py-2">
            {fields.map(field => renderFormField(field, editForm))}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit">Update Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this record? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRow}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
