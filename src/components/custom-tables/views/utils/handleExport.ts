import { CustomTableField, CustomTableRecord } from "@/types/customTable";
import { CustomTableSchema } from "@/types/customTable";
import { formatFieldValue } from "@/components/custom-tables/utils";
import { UserPermissions } from "@/components/custom-tables/types";

export const handleExport = (
  table: CustomTableSchema,
  records: CustomTableRecord[],
  permissions: UserPermissions,
  organizedFields: CustomTableField[]
) => {
  //   try {
  //     const fieldNames = organizedFields.map((field) => field.name);
  //     const csvRows = [fieldNames.join(",")];
  //     for (const record of processedRecords) {
  //       const values = fieldNames.map((fieldName) => {
  //         const field = table.fields.find((f) => f.name === fieldName);
  //         if (!field) return "";
  //         const value = record.fields[fieldName];
  //         const formatted = formatFieldValue(value, field, record);
  //         return value !== null && value !== undefined
  //           ? `"${String(formatted).replace(/"/g, '""')}"`
  //           : "";
  //       });
  //       csvRows.push(values.join(","));
  //     }
  //     const csvContent = csvRows.join("\n");
  //     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.setAttribute("href", url);
  //     link.setAttribute("download", `${table.name}_export.csv`);
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     toast.success("Export completed");
  //   } catch (error) {
  //     console.error("Export error:", error);
  //     toast.error("Failed to export data");
  //   }
};
