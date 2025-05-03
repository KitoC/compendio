import { useParams } from "react-router-dom";
import Page from "@/components/Page";
import { useCustomTableSchemaQuery } from "@/hooks/useCustomTableQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCustomTables } from "@/contexts/CustomTables";
import CustomTableView from "@/components/custom-tables";

interface CustomTablePageParams extends Record<string, string> {
  id: string;
}

const CustomTablePage = () => {
  const { id: tableName } = useParams<CustomTablePageParams>();

  const { tables } = useCustomTables();

  const table = tables.find((table) => table.name === tableName);

  const { data: tableSchema, isLoading: isLoadingSchema } =
    useCustomTableSchemaQuery(table?.external_id);

  if (isLoadingSchema) {
    return (
      <div className="flex flex-col h-full p-8 gap-6">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          <Skeleton className="h-8 w-1/3 border border-border" />
          <Skeleton className="h-8 w-1/4 border border-border" />
        </div>
        <div className="flex-grow border border-border rounded-md">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!tableSchema) {
    return (
      <Page>
        <Card>
          <CardHeader>
            <CardTitle>Resource Not Found</CardTitle>
            <CardDescription>
              The requested Resource "{tableName}" could not be found in this
              base.
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
    <CustomTableView
      className="rounded-none border-none h-full"
      table={tableSchema}
      permissions={{
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
      }}
    />
  );
};

export default CustomTablePage;
