// NO_CHANGE

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";
import { ColumnEditor, Column } from "@/components/tables/ColumnEditor";
import { Database } from "@/integrations/supabase/types";
import { useTenant } from "@/contexts/TenantContext";
const tableFormSchema = z.object({
  name: z
    .string()
    .min(3, "Table name must be at least 3 characters")
    .max(63, "Table name must be at most 63 characters")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Table name must start with a letter and contain only lowercase letters, numbers and underscores"
    ),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof tableFormSchema>;

export interface CustomTableFormProps {
  tableId: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CustomTableForm = ({
  tableId,
  onSuccess,
  onCancel,
}: CustomTableFormProps) => {
  const isEditing = Boolean(tableId);
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      icon: "",
    },
  });

  useEffect(() => {
    const fetchTableData = async () => {
      if (!user || !tenantId || !tableId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch table definition
        const { data: tableData, error: tableError } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("id", tableId)
          .eq("tenant_id", tenantId)
          .single();

        if (tableError) throw tableError;

        if (tableData) {
          form.reset({
            name: tableData.name,
            display_name: tableData.display_name,
            description: tableData.description || "",
            icon: tableData.icon || "",
          });

          // Fetch table fields/columns
          const { data: fieldsData, error: fieldsError } = await supabase
            .from("custom_table_fields")
            .select("*")
            .eq("table_id", tableId)
            .eq("tenant_id", tenantId)
            .is("deleted_at", null);

          if (fieldsError) throw fieldsError;

          // Map the fields to columns format
          const mappedColumns: Column[] =
            fieldsData?.map((field) => ({
              id: field.id,
              tableFieldId: field.id,
              name: field.name,
              type: field.field_type,
              isPrimary: field.is_unique,
              isNullable: !field.is_required,
              defaultValue: field.default_value
                ? JSON.stringify(field.default_value)
                : undefined,
            })) || [];

          setColumns(mappedColumns);
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        toast.error("Failed to load table data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, [user, tenantId, tableId, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !tenantId) return;

    setIsSaving(true);
    try {
      let tableId: string;

      if (isEditing) {
        // Update existing table
        const { data: updatedTable, error: updateError } = await supabase
          .from("custom_table_definitions")
          .update({
            display_name: values.display_name,
            description: values.description,
            icon: values.icon,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tableId as string)
          .eq("tenant_id", tenantId)
          .select("id")
          .single();

        if (updateError) throw updateError;
        tableId = updatedTable.id;
      } else {
        // Create new table
        const { data: newTable, error: createError } = await supabase
          .from("custom_table_definitions")
          .insert({
            tenant_id: tenantId,
            name: values.name,
            display_name: values.display_name,
            description: values.description,
            icon: values.icon,
            permissions: {
              system_roles: {
                create: ["super-admin", "tenant-owner"],
                read: ["super-admin", "tenant-owner"],
                update: ["super-admin", "tenant-owner"],
                delete: ["super-admin", "tenant-owner"],
              },
              custom_roles: {
                create: [],
                read: [],
                update: [],
                delete: [],
              },
            },
          })
          .select("id")
          .single();

        if (createError) throw createError;
        tableId = newTable.id;
      }

      // Handle columns (fields)
      // For each column in the current state
      for (const column of columns) {
        // Skip columns with empty names
        if (!column.name.trim()) continue;

        const fieldData = {
          table_id: tableId,
          tenant_id: tenantId,
          name: column.name,
          display_name: column.name, // Using name as display_name for simplicity
          field_type:
            column.type as Database["public"]["Enums"]["field_type_enum"],
          is_required: !column.isNullable,
          is_unique: column.isPrimary,
          default_value: column.defaultValue
            ? JSON.parse(column.defaultValue)
            : null,
          permissions: {
            system_roles: {
              read: ["super-admin", "tenant-owner"],
              write: ["super-admin", "tenant-owner"],
            },
            custom_roles: {
              read: [],
              write: [],
            },
          },
        };

        if (column.tableFieldId) {
          // Update existing field
          const { error: updateFieldError } = await supabase
            .from("custom_table_fields")
            .update({
              ...fieldData,
              field_type:
                fieldData.field_type as Database["public"]["Enums"]["field_type_enum"],
              updated_at: new Date().toISOString(),
            })
            .eq("id", column.tableFieldId)
            .eq("tenant_id", tenantId);

          if (updateFieldError) throw updateFieldError;
        } else {
          // Create new field
          const { error: createFieldError } = await supabase
            .from("custom_table_fields")
            .insert([fieldData]);

          if (createFieldError) throw createFieldError;
        }
      }

      // If editing, handle deleted fields
      if (isEditing) {
        // Get all existing fields for this table
        const { data: currentFields, error: fieldsError } = await supabase
          .from("custom_table_fields")
          .select("id")
          .eq("table_id", tableId)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        if (fieldsError) throw fieldsError;

        // Find fields that need to be deleted
        const currentFieldIds = currentFields.map((f) => f.id);
        const fieldsToDelete = currentFieldIds.filter(
          (id) => !columns.some((col) => col.tableFieldId === id)
        );

        // Soft delete fields that are no longer in the columns list
        if (fieldsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("custom_table_fields")
            .update({ deleted_at: new Date().toISOString() })
            .in("id", fieldsToDelete)
            .eq("tenant_id", tenantId);

          if (deleteError) throw deleteError;
        }
      }

      toast.success(
        isEditing ? "Table updated successfully" : "Table created successfully"
      );

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(error.message || "Failed to save table");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Table Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="customers"
                    {...field}
                    disabled={isEditing}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  This will be used as the table name in the database.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Customers" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  This is how the table will be displayed in the UI.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Store information about your customers"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <Input placeholder="users" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Icon name from Lucide icons.
                </p>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <ColumnEditor columns={columns} onChange={setColumns} />
        </form>
      </Form>
    </div>
  );
};

export default CustomTableForm;
