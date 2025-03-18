import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input as FormInput } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import PageLoading from "@/components/PageLoading";

// Define a schema for dynamic form validation
const formSchema = z.object({
  // Dynamic schema will be added here based on table fields
});

// Update the CustomTableRow type to accept UUID as string or Json
interface CustomTableRow {
  id: string;
  [key: string]: any;
}

interface DataManagerProps {
  tableId: string;
  tableName: string;
  fields: any[];
}

export const DataManager = ({ tableId, tableName, fields }: DataManagerProps) => {
  const { tenantId } = useAuth();
  const [tableData, setTableData] = useState<CustomTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<CustomTableRow | null>(null);

  // Dynamically create the form schema based on the fields
  const dynamicFormSchema = z.object(
    fields.reduce((acc: any, field: any) => {
      let fieldSchema: any = z.string().optional();

      if (field.is_required) {
        fieldSchema = z.string().min(1, `${field.display_name} is required`);
      }

      if (field.field_type === "number") {
        fieldSchema = z.number().optional();
        if (field.is_required) {
          fieldSchema = z.number().min(1, `${field.display_name} is required`);
        }
      }

      if (field.field_type === "boolean") {
        fieldSchema = z.boolean().optional();
        if (field.is_required) {
          fieldSchema = z.boolean().refine(val => val === true, `${field.display_name} is required`);
        }
      }

      acc[field.name] = fieldSchema;
      return acc;
    }, {})
  );

  type FormData = z.infer<typeof dynamicFormSchema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
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
    reset();
    setAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
  };

  const openEditDialog = (row: CustomTableRow) => {
    setEditingRow(row);
    reset({ ...row } as any); // Type assertion here
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
        p_row_id: rowToDelete,
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
      const newRowId = data?.id?.toString() || '';
      const newRow: CustomTableRow = { id: newRowId, ...formData };
      
      setTableData((prev) => [...prev, newRow]);
      
      toast.success("Record created successfully");
      setAddDialogOpen(false);
      reset();
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
        p_row_id: editingRow.id,
        p_tenant_id: tenantId,
        p_data: formData,
      });

      if (error) throw error;

      setTableData((prev) =>
        prev.map((row) => (row.id === editingRow.id ? { ...row, ...formData } : row))
      );
      toast.success("Record updated successfully");
    } catch (error: any) {
      console.error("Error updating record:", error);
      toast.error(error.message || "Failed to update record");
    } finally {
      closeEditDialog();
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Data Manager</h2>
        <Button onClick={openAddDialog} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      {tableData.length === 0 ? (
        <p>No data available.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field) => (
                <TableHead key={field.name}>{field.display_name}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                {fields.map((field) => (
                  <TableCell key={field.name}>{row[field.name] != null ? row[field.name].toString() : ''}</TableCell>
                ))}
                <TableCell className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(row)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeleteRow(row.id)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
          </DialogHeader>
          <Form {...{
            register,
            handleSubmit,
            reset,
            control,
            formState: { errors },
            setValue,
          }}>
            <form onSubmit={handleSubmit(addRow)} className="space-y-4">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.display_name}</FormLabel>
                      <FormControl>
                        <FormInput placeholder={field.display_name} {...formField} />
                      </FormControl>
                      <FormMessage>{errors[field.name]?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAddDialog}>
                  Cancel
                </Button>
                <Button type="submit">Add Record</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          <Form {...{
            register,
            handleSubmit,
            reset,
            control,
            formState: { errors },
            setValue,
          }}>
            <form onSubmit={handleSubmit(updateRow)} className="space-y-4">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.display_name}</FormLabel>
                      <FormControl>
                        <FormInput placeholder={field.display_name} {...formField} />
                      </FormControl>
                      <FormMessage>{errors[field.name]?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  Cancel
                </Button>
                <Button type="submit">Update Record</Button>
              </DialogFooter>
            </form>
          </Form>
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
