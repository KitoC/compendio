import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import DataTable from "@/components/data-table";
import type { Column } from "@/components/data-table";
import Page from "@/components/Page";
import { FormConfig } from "@/components/form-builder/types";
import { CustomTableService } from "../../services/CustomTableService";
import { useCustomTables } from "@/contexts/CustomTables";

const CustomTableDataPage = () => {
  const { id: tableName } = useParams<{ id: string }>();

  const { tables } = useCustomTables();

  const tableDefinition = tables.find((table) => table.name === tableName);
  const tableFields = tableDefinition?.fields || [];

  const [tableData, setTableData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTableData = useCallback(async () => {
    if (!tableName) return;
    try {
      setIsLoading(true);
      const { data } = await CustomTableService.listRecords(tableName);
      setTableData(data || []);
    } catch (error) {
      toast.error("Failed to load table data");
    } finally {
      setIsLoading(false);
    }
  }, [tableName]);

  const generateColumns = (): Column<unknown>[] => {
    return tableFields.map((field) => ({
      field: field.schema.name,
      header: field.schema.name,
      sortable: true,
      render: (row) => {
        const value = row.fields?.[field.schema.name] ?? "-";
        if (field.schema.type === "date") {
          return new Date(value).toLocaleDateString();
        }

        if (typeof value === "object") {
          return JSON.stringify(value);
        }

        return value;
      },
    }));
  };

  const getFormConfig = (defaultConfig: FormConfig): FormConfig => {
    const fields = tableFields.map((field) => ({
      id: field.schema.name,
      name: field.schema.name,
      label: field.schema.name,
      type: "text",
      placeholder: `Enter ${field.schema.name}`,
      validation: { required: false },
    }));

    console.log("fields", fields);

    return {
      ...defaultConfig,
      sections: [{ id: "main", title: "Record Details", fields }],
    };
  };

  const handleCreate = async (newRecord: Record<string, unknown>) => {
    try {
      await CustomTableService.createRecord(tableName!, newRecord);
      toast.success("Record created");
      fetchTableData();
    } catch (err) {
      toast.error("Failed to create record");
    }
  };

  const handleUpdate = async (updatedRecord: Record<string, unknown>) => {
    try {
      const recordId = updatedRecord.id as string;

      console.log("updatedRecord", updatedRecord);
      // await CustomTableService.updateRecord(
      //   tableName!,
      //   recordId,
      //   updatedRecord.fields as Record<string, unknown>
      // );
      toast.success("Record updated");
      fetchTableData();
    } catch (err) {
      toast.error("Failed to update record");
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await CustomTableService.deleteRecord(tableName!, recordId);
      toast.success("Record deleted");
      fetchTableData();
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  useEffect(() => {
    if (tableDefinition) {
      fetchTableData();
    }
  }, [fetchTableData, tableDefinition]);

  return (
    <Page>
      {tableDefinition && (
        <DataTable
          data={tableData.map((r) => ({ ...r, ...r.fields }))}
          columns={generateColumns()}
          idField="id"
          title={tableDefinition.name}
          subtitle={tableDefinition.description || ""}
          permissions={{
            create: true,
            update: true,
            delete: true,
            read: true,
            export: true,
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          searchable
          onSearch={setSearchTerm}
          getFormConfig={getFormConfig}
          isLoading={isLoading}
        />
      )}
    </Page>
  );
};

export default CustomTableDataPage;
