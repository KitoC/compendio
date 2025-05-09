import { useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatFieldValue } from "../utils";
import { CustomTableViewProps } from "./types";
import { useDataViewContext } from "@/contexts/DataViewProvider";
const GalleryView = ({
  table,

  emptyMessage = "No records available",
}: CustomTableViewProps) => {
  const { data: records, isLoadingData, onEdit } = useDataViewContext();
  // Find the primary field for the table
  const primaryField = useMemo(() => {
    if (table && table.primary_field_id) {
      return table.fields.find((field) => field.id === table.primary_field_id);
    }
    return table.fields[0];
  }, [table]);

  // Find attachment fields that might contain images
  const attachmentField = useMemo(() => {
    return table.fields.find(
      (field) =>
        field.type === "attachment" || field.type === "multipleAttachments"
    );
  }, [table.fields]);

  // Select a few fields to display as details
  const detailFields = useMemo(() => {
    // Get up to 3 fields excluding the primary field and attachment fields
    return table.fields
      .filter(
        (field) =>
          field.id !== primaryField?.id &&
          field.type !== "attachment" &&
          field.type !== "multipleAttachments" &&
          !["createdBy", "lastModifiedBy"].includes(field.type)
      )
      .slice(0, 3);
  }, [table.fields, primaryField]);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-md">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {records.map((record) => {
        // Try to get an attachment to use as cover image
        let coverImage = null;
        if (attachmentField) {
          const attachments = record[attachmentField.name];
          if (Array.isArray(attachments) && attachments.length > 0) {
            const firstAttachment = attachments[0];
            if (
              firstAttachment.type?.startsWith("image/") &&
              firstAttachment.url
            ) {
              coverImage = firstAttachment.url;
            }
          } else if (
            attachments &&
            typeof attachments === "object" &&
            "url" in attachments
          ) {
            coverImage = attachments.url;
          }
        }

        return (
          <Card
            key={record._id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEdit(record)}
          >
            {coverImage && (
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={coverImage}
                  alt="Record attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className={`${coverImage ? "pt-4" : "pt-6"} pb-2`}>
              {primaryField && (
                <h3 className="font-medium text-lg truncate">
                  {formatFieldValue(
                    record[primaryField.name],
                    primaryField,
                    record
                  )}
                </h3>
              )}

              <div className="mt-2 space-y-1">
                {detailFields.map((field) => {
                  const value = record[field.name];
                  if (value === undefined || value === null) return null;

                  return (
                    <div key={field.id} className="text-sm">
                      <span className="text-muted-foreground">
                        {field.name}:{" "}
                      </span>
                      <span>{formatFieldValue(value, field, record)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-3 px-6">
              <div className="text-xs text-muted-foreground mt-2">
                ID: {record._id.substring(0, 8)}...
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default GalleryView;
