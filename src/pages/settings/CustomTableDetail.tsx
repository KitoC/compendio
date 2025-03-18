
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Edit, Trash, ArrowLeft, Database, Shield } from "lucide-react";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";

interface TableField {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
  created_at: string;
}

interface TableDetails {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

const fieldFormSchema = z.object({
  name: z.string().min(2, "Field name must be at least 2 characters").max(63, "Field name must be at most 63 characters")
    .regex(/^[a-z][a-z0-9_]*$/, "Field name must start with a letter and contain only lowercase letters, numbers and underscores"),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  field_type: z.string().min(1, "Field type is required"),
  is_required: z.boolean().optional().default(false),
  is_unique: z.boolean().optional().default(false),
});

type FieldFormValues = z.infer<typeof fieldFormSchema>;

const CustomTableDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, tenantId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [activeTab, setActiveTab] = useState("fields");
  const [editingField, setEditingField] = useState<TableField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  const fieldForm = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      field_type: "text",
      is_required: false,
      is_unique: false,
    },
  });

  useEffect(() => {
    const fetchTableData = async () => {
      if (!user || !tenantId || !id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch table details
        const { data: tableData, error: tableError } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .single();

        if (tableError) throw tableError;
        setTableDetails(tableData);

        // Fetch table fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from("custom_table_fields")
          .select("*")
          .eq("table_id", id)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true });

        if (fieldsError) throw fieldsError;
        setFields(fieldsData || []);

      } catch (error) {
        console.error("Error fetching table data:", error);
        toast.error("Failed to load table data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTableData();
  }, [user, tenantId, id]);

  const openFieldDialog = (field: TableField | null = null) => {
    if (field) {
      setEditingField(field);
      fieldForm.reset({
        name: field.name,
        display_name: field.display_name,
        description: field.description || "",
        field_type: field.field_type,
        is_required: field.is_required,
        is_unique: field.is_unique,
      });
    } else {
      setEditingField(null);
      fieldForm.reset({
        name: "",
        display_name: "",
        description: "",
        field_type: "text",
        is_required: false,
        is_unique: false,
      });
    }
    setIsFieldDialogOpen(true);
  };

  const confirmDeleteField = (fieldId: string) => {
    setFieldToDelete(fieldId);
    setIsDeleteDialogOpen(true);
  };

  const deleteField = async () => {
    if (!fieldToDelete || !tenantId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("custom_table_fields")
        .update({ deleted_at: new Date() })
        .eq("id", fieldToDelete)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Field deleted successfully");
      setFields(fields.filter(f => f.id !== fieldToDelete));
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast.error(error.message || "Failed to delete field");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  const onSubmitField = async (values: FieldFormValues) => {
    if (!user || !tenantId || !id) return;

    setIsSaving(true);
    try {
      if (editingField) {
        // Update existing field
        const { error } = await supabase
          .from("custom_table_fields")
          .update({
            name: values.name,
            display_name: values.display_name,
            description: values.description,
            field_type: values.field_type,
            is_required: values.is_required,
            is_unique: values.is_unique,
            updated_at: new Date(),
          })
          .eq("id", editingField.id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        toast.success("Field updated successfully");

        // Update the fields list
        setFields(fields.map(f => 
          f.id === editingField.id 
            ? { ...f, ...values, description: values.description || null } 
            : f
        ));
      } else {
        // Create new field
        const { data, error } = await supabase
          .from("custom_table_fields")
          .insert({
            tenant_id: tenantId,
            table_id: id,
            name: values.name,
            display_name: values.display_name,
            description: values.description,
            field_type: values.field_type,
            is_required: values.is_required,
            is_unique: values.is_unique,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Field created successfully");

        // Add the new field to the list
        if (data) {
          setFields([...fields, data]);
        }
      }

      // Close the dialog
      setIsFieldDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving field:", error);
      toast.error(error.message || "Failed to save field");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!tableDetails) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Table not found</h1>
        <Button onClick={() => navigate(ROUTES.SETTINGS_CUSTOM_TABLES)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tables
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(ROUTES.SETTINGS_CUSTOM_TABLES)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{tableDetails.display_name}</h1>
        </div>
        <div>
          <Button variant="outline" onClick={() => navigate(`${ROUTES.SETTINGS_CUSTOM_TABLES}/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Table
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Information</CardTitle>
          <CardDescription>Details about this custom table</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Display Name</p>
            <p className="text-sm text-muted-foreground">{tableDetails.display_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Table Name</p>
            <p className="text-sm text-muted-foreground">{tableDetails.name}</p>
          </div>
          {tableDetails.description && (
            <div className="col-span-2">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{tableDetails.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Created</p>
            <p className="text-sm text-muted-foreground">
              {new Date(tableDetails.created_at).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openFieldDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          {fields.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No Fields Defined</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  This table doesn't have any fields yet. Add your first field to define the structure.
                </p>
                <Button onClick={() => openFieldDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Field
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Unique</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>{field.display_name}</TableCell>
                        <TableCell>{field.field_type}</TableCell>
                        <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
                        <TableCell>{field.is_unique ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openFieldDialog(field)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDeleteField(field.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Configuration</CardTitle>
              <CardDescription>
                Configure who can create, read, update and delete records in this table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Permission management for this table will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
            <DialogDescription>
              {editingField
                ? "Update the properties of this field"
                : "Add a new field to define the structure of your table"}
            </DialogDescription>
          </DialogHeader>

          <Form {...fieldForm}>
            <form onSubmit={fieldForm.handleSubmit(onSubmitField)} className="space-y-4">
              <FormField
                control={fieldForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input placeholder="first_name" {...field} disabled={!!editingField} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Used as the column name in the database. Use lowercase and underscores.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      How this field will be displayed in forms and tables.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="field_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!editingField}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={fieldForm.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Required Field</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          This field must have a value
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={fieldForm.control}
                  name="is_unique"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Unique Field</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Values must be unique
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={fieldForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What this field is used for" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingField ? "Update Field" : "Add Field"}
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
            <DialogDescription>
              Are you sure you want to delete this field? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteField} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomTableDetail;
