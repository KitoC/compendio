import Page from "@/components/Page";
import { Card } from "@/components/ui/card";
import { GridView } from "@/components/views";
import { ClientsService } from "@/services/supabase/ClientsServices";
import gridViewColumns from "./gridViewColumns";
import { useServiceListQuery } from "@/hooks/queries/useServiceListQuery";
const clientService = new ClientsService();

const Clients = () => {
  const response = useServiceListQuery({
    tableName: "clients",
    uniqueKey: "id",
    initialQuery: {
      pagination: { page: 1, pageSize: 10 },
    },
    onFetch: async (query) => {
      const response = await clientService.get(query);

      return response;
    },
  });

  console.log(response);

  return (
    <Page>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Clients</h1>
        </div>

        <Card className="flex-grow p-2">
          <GridView
            data={response.data}
            count={response.count}
            isLoading={response.isLoading}
            isFetching={response.isFetching}
            setQuery={response.setQuery}
            query={response.query}
            service={clientService}
            columns={gridViewColumns}
            emptyMessage="No clients found"
            permissions={{
              create: true,
              read: true,
              update: true,
              delete: true,
              export: true,
            }}
          />
        </Card>
      </div>
    </Page>
  );
};

export default Clients;
