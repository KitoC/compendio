import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Page from "@/components/Page";
import AirtableTable from "@/components/airtable-table";
import {
  useAirtableTableSchemaQuery,
  useAirtableRecordsQuery,
} from "@/hooks/useAirtableQuery";
import { AirtableService } from "@/services/AirtableService";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { FormConfig } from "@/components/form-builder";
import { AirtableRecord } from "@/components/airtable-table/types";
import { useTenant } from "@/contexts/TenantContext";
import { useCustomTables } from "@/contexts/CustomTables";

const AirtableTablePage = () => {
  const { tenantData } = useTenant();
  const { id: tableName, ...params } = useParams<{
    id: string;
  }>();
  const { data: tableSchema, isLoading: isLoadingSchema } =
    useAirtableTableSchemaQuery(tableName);
  const {
    records,
    isLoading: isLoadingRecords,
    refetch,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useAirtableRecordsQuery({ tableName });

  console.log("tableSchema", tableSchema);

  const getFormConfig = (config: FormConfig, record: AirtableRecord | null) => {
    return config;
  };

  const handleCreate = async (record: Partial<AirtableRecord>) => {
    try {
      await createRecord(record.fields || {});
      refetch();
    } catch (error) {
      console.error("Error creating record:", error);
    }
  };

  const handleUpdate = async (record: AirtableRecord) => {
    try {
      await updateRecord(record.id, record.fields || {});
      refetch();
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      refetch();
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  if (isLoadingSchema) {
    return (
      <Page>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (!tableSchema) {
    return (
      <Page>
        <Card>
          <CardHeader>
            <CardTitle>Table Not Found</CardTitle>
            <CardDescription>
              The requested table "{tableName}" could not be found in this base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Back to Previous Page
            </Button>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{tableSchema.name}</h1>
        <Button size="sm" onClick={() => refetch()} variant="ghost">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <AirtableTable
        table={tableSchema}
        records={records || []}
        isLoading={isLoadingRecords}
        permissions={{
          create: true,
          read: true,
          update: true,
          delete: true,
          export: true,
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        getFormConfig={getFormConfig}
        searchable={true}
        pagination={true}
        pageSize={10}
      />
    </Page>
  );
};

export default AirtableTablePage;
