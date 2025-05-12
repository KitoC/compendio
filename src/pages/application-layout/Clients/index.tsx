import Page from "@/components/Page";
import { Card } from "@/components/ui/card";
import { GridView } from "@/components/views";
import { Client, ClientService } from "@/services/supabase/ClientService";
import gridViewColumns from "./gridViewColumns";
import { useServiceListQuery } from "@/hooks/queries/useServiceListQuery";
import { useState } from "react";
import ClientModal from "@/components/modals/ClientModal";
import { Button } from "@/components/ui/button";
import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";

const clientService = new ClientService();

const Clients = () => {
  const [editingRecord, setEditingRecord] = useState<Client | null>(null);

  const response = useServiceListQuery<Client>({
    optimistic: true,
    tableName: clientService.tableName,
    uniqueKey: clientService.primaryKey,
    initialQuery: {
      pagination: { page: 1, pageSize: 10 },
    },
    onFetch: async (query) => {
      const response = await clientService.get(query);

      return response;
    },
    onUpsert: async (record) => {
      return await clientService.upsert(record);
    },
    onDelete: async (record) => {
      return await clientService.delete(record);
    },
  });

  return (
    <Page title="Clients">
      <Card className="flex-grow flex flex-col p-4 gap-4">
        <div className="flex flex-row gap-2 justify-end">
          <Button onClick={() => setEditingRecord({} as Client)}>
            <PlusIcon />
            Add Client
          </Button>
        </div>
        <GridView
          data={response.data}
          count={response.count}
          isLoading={response.isLoading}
          isFetching={response.isFetching}
          setQuery={response.setQuery}
          query={response.query}
          service={clientService}
          columns={gridViewColumns}
          emptyMessage={
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground">No clients found</p>
              <Button onClick={() => setEditingRecord({} as Client)}>
                <PlusIcon />
                Add Client
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

      <ClientModal
        isOpen={!!editingRecord}
        initialValues={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={async (record: Client) => {
          await response.upsertRecord({ record });
          setEditingRecord(null);
        }}
      />
    </Page>
  );
};

export default Clients;
