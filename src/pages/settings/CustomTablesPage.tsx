
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash } from "lucide-react";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreDropdown } from "@/components/ui/more-dropdown";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";

const CustomTablesPage = () => {
  const navigate = useNavigate();
  const { user, tenantId } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      if (!user || !tenantId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("custom_table_definitions")
          .select("*")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTables(data || []);
      } catch (error) {
        console.error("Error fetching custom tables:", error);
        toast.error("Failed to load custom tables");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, [user, tenantId]);

  const deleteTable = async (tableId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from("custom_table_definitions")
        .update({
          deleted_at: new Date().toISOString(), // Convert Date to string
          updated_at: new Date().toISOString(),  // Convert Date to string
        })
        .eq("id", tableId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      setTables((prevTables) => prevTables.filter((table) => table.id !== tableId));
      toast.success("Table deleted successfully");
    } catch (error: any) {
      console.error("Error deleting table:", error);
      toast.error(error.message || "Failed to delete table");
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Custom Tables</h1>
        <Button onClick={() => navigate(ROUTES.SETTINGS_CUSTOM_TABLES_NEW)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table List</CardTitle>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-4">No custom tables created yet.</div>
          ) : (
            <Table>
              <TableCaption>A list of your custom tables.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell>{table.name}</TableCell>
                    <TableCell>{table.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {new Date(table.created_at).toLocaleDateString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoreDropdown>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`${ROUTES.SETTINGS_CUSTOM_TABLES}/${table.id}`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`${ROUTES.SETTINGS_CUSTOM_TABLES}/${table.id}/data`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          View Data
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTable(table.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </MoreDropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomTablesPage;
