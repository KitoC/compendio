
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Settings, Trash2, MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import PageLoading from "@/components/PageLoading";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, Column } from "@/components/ui/data-table";
import { SlidePanel } from "@/components/ui/slide-panel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CustomTableForm from "./CustomTableForm";

interface CustomTable {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  columns?: string; // New field to store column data
}

const CustomTablesPage = () => {
  const { user, tenantId } = useAuth();
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

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
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load custom tables");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, tenantId, isEditPanelOpen]);

  const handleCreateTable = () => {
    setEditingTable(null);
    setIsEditPanelOpen(true);
  };

  const handleEditTable = (tableId: string) => {
    setEditingTable(tableId);
    setIsEditPanelOpen(true);
  };

  const confirmDelete = (id: string) => {
    setTableToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!tableToDelete || !tenantId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("custom_table_definitions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", tableToDelete)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      
      setTables(tables.filter(table => table.id !== tableToDelete));
      toast.success("Table deleted successfully");
    } catch (error: any) {
      console.error("Error deleting table:", error);
      toast.error(error.message || "Failed to delete table");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTableToDelete(null);
    }
  };

  const tableColumns: Column<CustomTable>[] = [
    {
      header: "Name",
      accessorKey: "display_name",
      cell: (row) => (
        <div className="font-medium">{row.display_name}</div>
      )
    },
    {
      header: "Table Name",
      accessorKey: "name",
      cell: (row) => (
        <code className="px-1 py-0.5 bg-muted rounded text-sm">{row.name}</code>
      )
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row) => (
        <div className="text-muted-foreground truncate max-w-xs">
          {row.description || "No description"}
        </div>
      )
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTable(row.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => confirmDelete(row.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "w-[80px]"
    }
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  // Prepare the slide panel title based on whether we're editing or creating
  const slidePanelTitle = editingTable 
    ? `Editing ${tables.find(t => t.id === editingTable)?.display_name || "Table"}` 
    : "Create Table";

  // Prepare the footer with Cancel and Save buttons
  const slidePanelFooter = (
    <div className="flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsEditPanelOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        form="table-form"
        disabled={isDeleting}
      >
        Save
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Custom Tables</h2>
          <p className="text-muted-foreground">
            Create and manage custom tables for your application.
          </p>
        </div>
        <Button onClick={handleCreateTable}>
          <Plus className="h-4 w-4 mr-2" />
          New Table
        </Button>
      </div>
      <Separator />

      <Card>
        {tables.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No custom tables</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any custom tables yet.
            </p>
            <Button onClick={handleCreateTable}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Table
            </Button>
          </div>
        ) : (
          <DataTable
            data={tables}
            columns={tableColumns}
          />
        )}
      </Card>

      {/* Slide Panel for Creating/Editing */}
      <SlidePanel
        open={isEditPanelOpen}
        onOpenChange={setIsEditPanelOpen}
        title={slidePanelTitle}
        description={editingTable ? "Update your custom table details" : "Create a new custom table for your application"}
        footer={slidePanelFooter}
      >
        <CustomTableForm
          tableId={editingTable}
          onSuccess={() => setIsEditPanelOpen(false)}
          onCancel={() => setIsEditPanelOpen(false)}
        />
      </SlidePanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this table? This action cannot be undone.
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
