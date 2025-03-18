
import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, Move, Edit, Trash, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

// Define field types available for custom tables
const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Text Area" },
  { value: "relation", label: "Relation" }, // New field type for relationships
];

// Form schema for field
const fieldFormSchema = z.object({
  name: z.string().min(2, "Field name must be at least 2 characters").max(63, "Field name must be at most 63 characters")
    .regex(/^[a-z][a-z0-9_]*$/, "Field name must start with a letter and contain only lowercase letters, numbers and underscores"),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  field_type: z.string().min(1, "Field type is required"),
  is_required: z.boolean().optional().default(false),
  is_unique: z.boolean().optional().default(false),
  related_table_id: z.string().optional(),
  relationship_type: z.enum(["one-to-one", "one-to-many", "many-to-many"]).optional(),
});

type FieldFormValues = z.infer<typeof fieldFormSchema>;
type TableField = FieldFormValues & { id: string };

interface SchemaBuilderProps {
  tableId: string;
  fields: TableField[];
  availableTables?: Array<{ id: string, name: string, display_name: string }>;
  onSaveField: (field: TableField, isNew: boolean) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
  onReorderFields: (fields: TableField[]) => Promise<void>;
}

export const SchemaBuilder = ({ 
  tableId, 
  fields,
  availableTables = [],
  onSaveField,
  onDeleteField,
  onReorderFields
}: SchemaBuilderProps) => {
  const [isFieldDialogOpen, setIsFieldDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingField, setEditingField] = React.useState<TableField | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [fieldToDelete, setFieldToDelete] = React.useState<string | null>(null);

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

  // Function to open the field dialog
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
        related_table_id: field.related_table_id,
        relationship_type: field.relationship_type,
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

  // Function to handle field deletion confirmation
  const confirmDeleteField = (fieldId: string) => {
    setFieldToDelete(fieldId);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle field deletion
  const deleteField = async () => {
    if (!fieldToDelete) return;

    try {
      await onDeleteField(fieldToDelete);
      toast.success("Field deleted successfully");
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast.error(error.message || "Failed to delete field");
    } finally {
      setIsDeleteDialogOpen(false);
      setFieldToDelete(null);
    }
  };

  // Function to handle field form submission
  const onSubmitField = async (values: FieldFormValues) => {
    setIsSaving(true);
    try {
      if (editingField) {
        await onSaveField({...values, id: editingField.id}, false);
        toast.success("Field updated successfully");
      } else {
        // Generate temporary ID for new field
        const tempId = crypto.randomUUID();
        await onSaveField({...values, id: tempId}, true);
        toast.success("Field created successfully");
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

  // Handle drag and drop reordering
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    // Reorder the fields array
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Save the new order
    try {
      await onReorderFields(items);
    } catch (error) {
      console.error("Error reordering fields:", error);
      toast.error("Failed to reorder fields");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Schema Builder</h2>
        <Button onClick={() => openFieldDialog()} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Grid2X2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="mb-2"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-3 cursor-move"
                            >
                              <Move className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{field.display_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                                <span>{field.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                                </Badge>
                                {field.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                {field.is_unique && <Badge variant="secondary" className="text-xs">Unique</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => openFieldDialog(field)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDeleteField(field.id)}>
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
          </DialogHeader>

          <Form {...fieldForm}>
            <form onSubmit={fieldForm.handleSubmit(onSubmitField)} className="space-y-4">
              <FormField
                control={fieldForm.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fieldForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="first_name" 
                        {...field} 
                        disabled={!!editingField}
                        onChange={(e) => {
                          // Auto-generate field name from display name if user hasn't typed anything yet
                          field.onChange(e);
                          if (e.target.value === "" && fieldForm.getValues("display_name")) {
                            const displayName = fieldForm.getValues("display_name");
                            const generatedName = displayName
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "_")
                              .replace(/_{2,}/g, "_")
                              .replace(/^_|_$/g, "");
                            field.onChange(generatedName);
                          }
                        }}
                      />
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
                name="field_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset relationship fields if not a relation type
                        if (value !== "relation") {
                          fieldForm.setValue("related_table_id", undefined);
                          fieldForm.setValue("relationship_type", undefined);
                        }
                      }}
                      defaultValue={field.value}
                      disabled={!!editingField}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show relationship fields only when field_type is "relation" */}
              {fieldForm.watch("field_type") === "relation" && (
                <>
                  <FormField
                    control={fieldForm.control}
                    name="related_table_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Table</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select related table" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTables.map((table) => (
                              <SelectItem key={table.id} value={table.id}>
                                {table.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fieldForm.control}
                    name="relationship_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="one-to-one">One-to-One</SelectItem>
                            <SelectItem value="one-to-many">One-to-Many</SelectItem>
                            <SelectItem value="many-to-many">Many-to-Many</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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
          </DialogHeader>
          <p>Are you sure you want to delete this field? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteField}>
              Delete Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchemaBuilder;
