
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { formatFieldValue } from "../utils";
import { AirtableViewProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

const GridView = ({
  records,
  table,
  isLoading,
  onRowClick,
  emptyMessage = "No records available",
  sortField,
  sortDirection,
  handleSort,
}: AirtableViewProps) => {
  const isMobile = useIsMobile();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const primaryField = useMemo(() => {
    if (table && table.primaryFieldId) {
      return table.fields.find((field) => field.id === table.primaryFieldId);
    }
    return null;
  }, [table]);

  const organizedFields = useMemo(() => {
    if (!table || !table.fields) return [];

    const filteredFields = table.fields.filter(
      (field) => !["createdBy", "lastModifiedBy"].includes(field.type)
    );

    const sortedFields = [...filteredFields];

    if (primaryField) {
      const primaryFieldIndex = sortedFields.findIndex(
        (f) => f.id === primaryField.id
      );
      if (primaryFieldIndex > -1) {
        const [removed] = sortedFields.splice(primaryFieldIndex, 1);
        sortedFields.unshift(removed);
      }
    }

    return sortedFields;
  }, [table, primaryField]);

  const displayFields = useMemo(() => {
    const fields = [...organizedFields];

    if (isMobile) {
      return fields.slice(0, 2);
    }

    return fields;
  }, [organizedFields, isMobile]);

  if (records.length === 0) {
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {displayFields.map((field) => (
                  <TableHead key={field.id} className="whitespace-nowrap">
                    {field.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={displayFields.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div
        className="relative w-full overflow-hidden"
        ref={tableContainerRef}
      >
        <div className="flex w-full">
          <div className="sticky left-0 z-10 bg-background shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {displayFields.length > 0 && (
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort && handleSort(displayFields[0].name)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{displayFields[0].name}</span>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow
                    key={record.id}
                    className={`animate-fade-in transition-colors cursor-pointer hover:bg-muted/50`}
                    onClick={() => onRowClick(record)}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      height: "60px",
                    }}
                  >
                    {displayFields.length > 0 && (
                      <TableCell className="whitespace-nowrap align-middle p-2">
                        <div className="h-full flex items-center">
                          {formatFieldValue(
                            record.fields[displayFields[0].name],
                            displayFields[0]
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="overflow-x-auto flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  {displayFields.slice(1).map((field) => (
                    <TableHead
                      key={field.id}
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort && handleSort(field.name)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{field.name}</span>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow
                    key={record.id}
                    className={`animate-fade-in transition-colors cursor-pointer hover:bg-muted/50`}
                    onClick={() => onRowClick(record)}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      height: "60px",
                    }}
                  >
                    {displayFields.slice(1).map((field) => (
                      <TableCell
                        key={field.id}
                        className="whitespace-nowrap align-middle p-2"
                      >
                        <div className="h-full flex items-center">
                          {formatFieldValue(
                            record.fields[field.name],
                            field
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridView;
