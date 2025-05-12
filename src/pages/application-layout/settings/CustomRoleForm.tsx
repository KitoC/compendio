import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/consts/routes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";
import { useTenant } from "@/contexts/TenantContext";

const roleFormSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be at most 50 characters"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof roleFormSchema>;

const CustomRoleForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = id && id !== "new-role";

  const form = useForm<FormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchRoleData = async () => {
      if (!user || !tenantId || !isEditing) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("custom_roles")
          .select("*")
          .eq("id", id)
          .eq("tenant_id", tenantId)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name,
            description: data.description || "",
          });
        }
      } catch (error) {
        console.error("Error fetching role data:", error);
        toast.error("Failed to load role data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleData();
  }, [user, tenantId, id, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !tenantId) return;

    setIsSaving(true);
    try {
      if (isEditing) {
        // Update existing role
        const { error } = await supabase
          .from("custom_roles")
          .update({
            name: values.name,
            description: values.description,
            updated_at: new Date(),
          })
          .eq("id", id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        toast.success("Role updated successfully");
      } else {
        // Create new role
        const { error } = await supabase.from("custom_roles").insert({
          tenant_id: tenantId,
          name: values.name,
          description: values.description,
        });

        if (error) throw error;
        toast.success("Role created successfully");
      }

      // Navigate back to the roles list
      navigate(ROUTES.SETTINGS_CUSTOM_TABLES);
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast.error(error.message || "Failed to save role");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Role" : "Create New Role"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the details of your custom role"
              : "Create a new custom role for your application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Project Manager" {...field} />
                    </FormControl>
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
                        placeholder="Manages projects and their resources"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.SETTINGS_CUSTOM_TABLES)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : isEditing
                    ? "Update Role"
                    : "Create Role"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomRoleForm;
