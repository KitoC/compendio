
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Database, Shield, Table2, Grid, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import PageLoading from "@/components/PageLoading";
import SchemaBuilder from "@/components/custom-tables/SchemaBuilder";
import DataManager from "@/components/custom-tables/DataManager";
import RelationshipViewer from "@/components/custom-tables/RelationshipViewer";

interface TableField {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
  related_table_id?: string;
  relationship_type?: string;
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

const CustomTableDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, tenantId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [activeTab, setActiveTab] = useState("schema");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<TableDetails[]>([]);

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

        // Fetch all tables (for relationships)
        const { data: allTables, error: allTablesError } = await supabase
          .from("custom_table_definitions")
          .select("id, name, display_name")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("display_name", { ascending: true });

        if (allTablesError) throw allTablesError;
        setAvailableTables(allTables || []);

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

  const handleSaveField = async (field: TableField, isNew: boolean) => {
    if (!user || !tenantId || !id) return;

    try {
      if (isNew) {
        // Create new field
        const { data, error } = await supabase
          .from("custom_table_fields")
          .insert({
            tenant_id: tenantId,
            table_id: id,
            name: field.name,
            display_name: field.display_name,
            description: field.description,
            field_type: field.field_type,
            is_required: field.is_required,
            is_unique: field.is_unique,
            options: field.field_type === 'relation' 
              ? { related_table_id: field.related_table_id, relationship_type: field.relationship_type }
              : null
          })
          .select()
          .single();

        if (error) throw error;
        
        // Add the new field to the list
        if (data) {
          setFields([...fields, data]);
        }
        
        return data;
      } else {
        // Update existing field
        const { error } = await supabase
          .from("custom_table_fields")
          .update({
            display_name: field.display_name,
            description: field.description,
            is_required: field.is_required,
            is_unique: field.is_unique,
            options: field.field_type === 'relation' 
              ? { related_table_id: field.related_table_id, relationship_type: field.relationship_type }
              : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", field.id)
          .eq("tenant_id", tenantId);

        if (error) throw error;
        
        // Update the fields list
        setFields(fields.map(f => 
          f.id === field.id 
            ? { ...f, ...field } 
            : f
        ));
        
        return field;
      }
    } catch (error: any) {
      console.error("Error saving field:", error);
      throw error;
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from("custom_table_fields")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", fieldId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      setFields(fields.filter(f => f.id !== fieldId));
    } catch (error: any) {
      console.error("Error deleting field:", error);
      throw error;
    }
  };

  const handleReorderFields = async (reorderedFields: TableField[]) => {
    // For now, just update the local state
    // In a real implementation, you might want to store order in the database
    setFields(reorderedFields);
    return true;
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schema" className="p-6">
            <SchemaBuilder 
              tableId={id || ''}
              fields={fields.map(field => ({
                ...field,
                related_table_id: field.options?.related_table_id,
                relationship_type: field.options?.relationship_type
              }))}
              availableTables={availableTables.filter(table => table.id !== id)}
              onSaveField={handleSaveField}
              onDeleteField={handleDeleteField}
              onReorderFields={handleReorderFields}
            />
          </TabsContent>

          <TabsContent value="data" className="p-6">
            <DataManager 
              tableId={id || ''}
              tableName={tableDetails.name}
              displayName={tableDetails.display_name}
              fields={fields.map(field => ({
                ...field,
                options: field.options
              }))}
            />
          </TabsContent>

          <TabsContent value="relationships" className="p-6">
            <RelationshipViewer 
              tables={availableTables.map(table => {
                // Find fields for this table
                const tableFields = table.id === id ? fields : [];
                return {
                  ...table,
                  fields: tableFields.map(field => ({
                    ...field,
                    related_table_id: field.options?.related_table_id,
                    relationship_type: field.options?.relationship_type
                  }))
                };
              })} 
            />
          </TabsContent>

          <TabsContent value="permissions" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Permissions Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure who can create, read, update and delete records in this table.
              </p>
              <div className="bg-muted/40 p-8 rounded-lg text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Permission management for this table will be available in a future update.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CustomTableDetail;
