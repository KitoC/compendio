import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageLoading from "@/components/PageLoading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SlidePanel } from "@/components/ui/slide-panel";
import CustomTableForm from "./CustomTableForm";
import { format } from "date-fns";
import { useTenant } from "@/contexts/TenantContext";
interface CustomTable {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

const CustomTablesPage = () => {
  const { tenantId } = useTenant();
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, [tenantId]);

  const fetchTables = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_table_definitions")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("name");

      if (error) {
        throw error;
      }

      setTables(data || []);
    } catch (error: any) {
      console.error("Error fetching tables:", error);
      toast.error(`Failed to load tables: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = () => {
    setSelectedTableId(null);
    setFormOpen(true);
  };

  const handleEditTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setFormOpen(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from("custom_table_definitions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", tableId)
        .eq("tenant_id", tenantId);

      if (error) {
        throw error;
      }

      toast.success("Table deleted successfully");
      await fetchTables();
    } catch (error: any) {
      console.error("Error deleting table:", error);
      toast.error(`Failed to delete table: ${error.message}`);
    }
  };

  const handleFormSubmit = () => {
    setFormOpen(false);
    fetchTables();
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Tables</h1>
        <Button onClick={handleCreateTable}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Table
        </Button>
      </div>

      {tables.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{table.display_name}</span>
                      <Badge variant="outline" className="w-fit">
                        {table.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {table.description || "No description"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {table.created_at
                      ? format(new Date(table.created_at), "MMM d, yyyy")
                      : ""}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleEditTable(table.id)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border rounded-lg p-8">
          <h3 className="text-lg font-medium">No custom tables yet</h3>
          <p className="text-muted-foreground mt-1">
            Start by creating your first custom table.
          </p>
          <Button className="mt-4" onClick={handleCreateTable}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Table
          </Button>
        </div>
      )}

      <SlidePanel
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selectedTableId ? "Edit Table" : "Create New Table"}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="table-form">
              {selectedTableId ? "Save Changes" : "Create Table"}
            </Button>
          </div>
        }
      >
        <CustomTableForm
          tableId={selectedTableId}
          onSuccess={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </SlidePanel>
    </div>
  );
};

export default CustomTablesPage;
