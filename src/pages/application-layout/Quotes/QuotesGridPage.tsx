import Page from "@/components/Page";
import { Card } from "@/components/ui/card";
import { GridView } from "@/components/views";
import { Quote, QuoteService } from "@/services/supabase/QuoteService";
import gridViewColumns from "./gridViewColumns";
import { useServiceListQuery } from "@/hooks/queries/useServiceListQuery";
import { Button } from "@/components/ui/button";
import { EditIcon, FilePlusIcon, FileTextIcon, TrashIcon } from "lucide-react";
import { paths } from "@/utils/pathHelpers";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";

const quoteService = new QuoteService();

export const QuotesGridPage = () => {
  const navigate = useNavigate();
  const { urlTenantAlias } = useTenant();

  const response = useServiceListQuery<Quote>({
    optimistic: true,
    tableName: quoteService.tableName,
    uniqueKey: quoteService.primaryKey,
    initialQuery: {
      pagination: { page: 1, pageSize: 10 },
    },
    onFetch: async (query) => {
      const response = await quoteService.get(query);

      return response;
    },
    onUpsert: async (record) => {
      return await quoteService.upsert(record);
    },
    onDelete: async (record) => {
      return await quoteService.delete(record);
    },
  });

  return (
    <Page title="Quotes" subtitle="Manage your quotes and view their status">
      <Card className="flex-grow flex flex-col p-4 gap-4">
        <GridView
          data={response.data}
          count={response.count}
          isLoading={response.isLoading}
          isFetching={response.isFetching}
          setQuery={response.setQuery}
          query={response.query}
          service={quoteService}
          columns={gridViewColumns}
          emptyMessage={
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-muted-foreground text-md font-medium">
                No quotes found
              </p>
              <Button
                onClick={() => {
                  navigate(paths.getNewQuotePath(urlTenantAlias));
                }}
              >
                <FileTextIcon />
                Create Quote
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
              onClick: (record) => {},
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
    </Page>
  );
};
