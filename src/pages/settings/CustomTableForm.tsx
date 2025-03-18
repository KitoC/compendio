
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";
import { ColumnEditor, Column } from "@/components/tables/ColumnEditor";

const tableFormSchema = z.object({
  name: z
    .string()
    .min(3, "Table name must be at least 3 characters")
    .max(63, "Table name must be at most 63 characters")
    .regex(/^[a-z][a-z0-9_]*$/, "Table name must start with a letter and contain only lowercase letters, numbers and underscores"),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof tableFormSchema>;

interface CustomTableFormProps {
  tableId: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CustomTableForm = ({ tableId, onSuccess, onCancel }: CustomTableFormProps) => {
  const isEditing = Boolean(tableId);
  const { user, tenantId } = useAuth();
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
        const { data, error } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("id", tableId)
          .eq("tenant_id", tenantId)
          .single();

        if (error) throw error;
        
        if (data) {
          form.reset({
            name: data.name,
            display_name: data.display_name,
            description: data.description || "",
            icon: data.icon || "",
          });

          // Fetch columns if they exist
          if (data.columns) {
            try {
              const columnsData = JSON.parse(data.columns);
              setColumns(columnsData);
            } catch (e) {
              console.error("Error parsing columns data", e);
              setColumns([]);
            }
          }
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
      const tableData = {
        name: values.name,
        display_name: values.display_name,
        description: values.description,
        icon: values.icon,
        columns: JSON.stringify(columns),
        updated_at: new Date().toISOString(),
      };

      if (isEditing && tableId) {
        // Update existing table
        const { error } = await supabase
          .from("custom_table_definitions")
          .update(tableData)
          .eq("id", tableId)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        toast.success("Table updated successfully");
      } else {
        // Create new table
        const { error } = await supabase
          .from("custom_table_definitions")
          .insert({
            tenant_id: tenantId,
            ...tableData,
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
          });

        if (error) throw error;
        toast.success("Table created successfully");
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
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
                  <Input placeholder="customers" {...field} disabled={isEditing} />
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

          <FormField
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
          />

          <ColumnEditor 
            columns={columns} 
            onChange={setColumns}
          />
        </form>
      </Form>
    </div>
  );
};

export default CustomTableForm;
