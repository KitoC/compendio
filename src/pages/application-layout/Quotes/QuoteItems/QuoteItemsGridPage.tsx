import Page from "@/components/Page";
import { Card } from "@/components/ui/card";
import { GridView } from "@/components/views";
import {
  QuoteItem,
  QuoteItemService,
} from "@/services/supabase/QuoteItemService";
import quoteItemColumns from "./quoteItemColumns";
import { useServiceListQuery } from "@/hooks/queries/useServiceListQuery";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import ServiceRecordModal from "@/components/modals/FormModal";
import { quoteItemFormConfig } from "@/forms/quoteItemForm";
import { useRenderPortal } from "@/hooks/useRenderPortal";

const quoteItemService = new QuoteItemService();

export const QuoteItemsGridPage = () => {
  const [editingRecord, setEditingRecord] = useState<QuoteItem | null>(null);

  const response = useServiceListQuery<QuoteItem>({
    optimistic: true,
    tableName: quoteItemService.tableName,
    uniqueKey: quoteItemService.primaryKey,
    initialQuery: {
      pagination: { page: 1, pageSize: 10 },
    },
    onFetch: async (query) => {
      const response = await quoteItemService.get(query);
      return response;
    },
    onUpsert: async (record) => {
      return await quoteItemService.upsert(record);
    },
    onDelete: async (record) => {
      return await quoteItemService.delete(record);
    },
  });

  const renderPortal = useRenderPortal("tabs-actions");

  return (
    <>
      {!!response?.data.length &&
        renderPortal(
          <div className="flex flex-row gap-2 justify-end">
            <Button onClick={() => setEditingRecord({} as QuoteItem)}>
              <PlusIcon />
              Add Quote Item
            </Button>
          </div>
        )}
      <Card className="h-full flex flex-col p-4 gap-4">
        <GridView
          data={response.data}
          count={response.count}
          isLoading={response.isLoading}
          isFetching={response.isFetching}
          setQuery={response.setQuery}
          query={response.query}
          service={quoteItemService}
          columns={quoteItemColumns}
          emptyMessage={
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground">No quote items found</p>
              <Button onClick={() => setEditingRecord({} as QuoteItem)}>
                <PlusIcon />
                Add Quote Item
              </Button>
            </div>
          }
          permissions={{
            create: true,
            read: true,
            update: true,
            delete: true,
            export: true,
          }}
          actions={[
            {
              id: "edit",
              label: "Edit",
              icon: <EditIcon />,
              onClick: (record) => setEditingRecord(record),
            },
            {
              id: "delete",
              label: "Delete",
              icon: <TrashIcon />,
              onClick: (record) => {
                response.deleteRecord({ record });
              },
            },
          ]}
        />
      </Card>

      <ServiceRecordModal
        isOpen={!!editingRecord}
        initialValues={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={async (record: QuoteItem) => {
          await response.upsertRecord({ record });
          setEditingRecord(null);
        }}
        formConfig={quoteItemFormConfig}
      />
    </>
  );
};
