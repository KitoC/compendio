import { useParams } from "react-router-dom";
import Page from "@/components/Page";
import AirtableTable from "@/components/airtable-table";
import {
  useAirtableTableSchemaQuery,
  useAirtableRecordsQuery,
} from "@/hooks/useAirtableQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FormConfig } from "@/components/form-builder";
import { AirtableRecord } from "@/components/airtable-table/types";
import { useCustomTables } from "@/contexts/CustomTables";

interface AirtableTablePageParams extends Record<string, string> {
  id: string;
}

const AirtableTablePage = () => {
  const { id: tableName } = useParams<AirtableTablePageParams>();

  const { tables } = useCustomTables();

  const table = tables.find((table) => table.name === tableName);

  const { data: tableSchema, isLoading: isLoadingSchema } =
    useAirtableTableSchemaQuery(table?.external_id);
  const {
    records,
    isLoading: isLoadingRecords,
    refetch,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useAirtableRecordsQuery({ tableId: table?.external_id });

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
      await updateRecord(record);
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
  console.log("tableSchema", tableSchema);
  console.log("records", records);
  return (
    <AirtableTable
      className="rounded-none border-none h-full"
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
      onRefresh={refetch}
    />
  );
};

export default AirtableTablePage;
