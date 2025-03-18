
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TableProperties, Settings, UsersRound, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import PageLoading from "@/components/PageLoading";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CustomTable {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const CustomTablesPage = () => {
  const { user, tenantId } = useAuth();
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [activeTab, setActiveTab] = useState("tables");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'table' | 'role'} | null>(null);

  useEffect(() => {
    if (!user || !tenantId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch custom tables
        const { data: tablesData, error: tablesError } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (tablesError) throw tablesError;
        setTables(tablesData || []);

        // Fetch custom roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("custom_roles")
          .select("*")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (rolesError) throw rolesError;
        setRoles(rolesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load custom tables and roles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, tenantId]);

  const handleCreateTable = () => {
    navigate(ROUTES.SETTINGS_CUSTOM_TABLES_NEW);
  };

  const handleCreateRole = () => {
    navigate(ROUTES.SETTINGS_CUSTOM_ROLES_NEW);
  };

  const confirmDelete = (id: string, type: 'table' | 'role') => {
    setItemToDelete({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || !tenantId) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'table') {
        const { error } = await supabase
          .from("custom_table_definitions")
          .update({ deleted_at: new Date() })
          .eq("id", itemToDelete.id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        
        setTables(tables.filter(table => table.id !== itemToDelete.id));
        toast.success("Table deleted successfully");
      } else {
        const { error } = await supabase
          .from("custom_roles")
          .update({ deleted_at: new Date() })
          .eq("id", itemToDelete.id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        
        setRoles(roles.filter(role => role.id !== itemToDelete.id));
        toast.success("Role deleted successfully");
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Custom Tables</h2>
          <p className="text-muted-foreground">
            Create and manage custom tables and user roles.
          </p>
        </div>
      </div>
      <Separator />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-[400px] mb-4">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <TableProperties className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateTable}>
              <Plus className="h-4 w-4 mr-2" />
              New Table
            </Button>
          </div>
          
          {tables.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">No Custom Tables</CardTitle>
                <CardDescription>
                  You haven't created any custom tables yet.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleCreateTable}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Table
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => (
                <Card key={table.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{table.display_name}</CardTitle>
                    <CardDescription className="text-sm truncate">
                      {table.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm pb-2">
                    <p className="text-muted-foreground">
                      Table name: <code>{table.name}</code>
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4 bg-muted/50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => navigate(`${ROUTES.SETTINGS_CUSTOM_TABLES}/${table.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive"
                      onClick={() => confirmDelete(table.id, 'table')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </div>
          
          {roles.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">No Custom Roles</CardTitle>
                <CardDescription>
                  You haven't created any custom roles yet.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-6">
                <Button onClick={handleCreateRole}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Role
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="text-sm truncate">
                      {role.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-end border-t pt-4 bg-muted/50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => navigate(`${ROUTES.SETTINGS}/custom-tables/roles/${role.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive"
                      onClick={() => confirmDelete(role.id, 'role')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomTablesPage;
