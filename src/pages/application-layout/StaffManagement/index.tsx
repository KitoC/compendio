import Page from "@/components/Page";
import { Card } from "@/components/ui/card";
import { GridView } from "@/components/views";
import { StaffService, StaffMember } from "@/services/supabase/StaffService";
import gridViewColumns from "./gridViewColumns";
import { useServiceListQuery } from "@/hooks/queries/useServiceListQuery";
import { useState } from "react";
import StaffModal from "@/components/modals/StaffModal";
import { Button } from "@/components/ui/button";
import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";

const staffService = new StaffService();

const Staff = () => {
  const [editingRecord, setEditingRecord] = useState<StaffMember | null>(null);

  const response = useServiceListQuery<StaffMember>({
    optimistic: true,
    tableName: staffService.tableName,
    uniqueKey: staffService.primaryKey,
    initialQuery: {
      pagination: { page: 1, pageSize: 10 },
    },
    onFetch: async (query) => {
      const response = await staffService.get(query);

      return response;
    },
    onUpsert: async (record) => {
      return await staffService.upsert(record);
    },
    onDelete: async (record) => {
      return await staffService.delete(record);
    },
  });

  return (
    <Page title="Employees">
      <Card className="flex-grow flex flex-col p-4 gap-4">
        <div className="flex flex-row gap-2 justify-end">
          <Button onClick={() => setEditingRecord({} as StaffMember)}>
            <PlusIcon />
            Add Staff Member
          </Button>
        </div>
        <GridView
          data={response.data}
          count={response.count}
          isLoading={response.isLoading}
          isFetching={response.isFetching}
          setQuery={response.setQuery}
          query={response.query}
          service={staffService}
          columns={gridViewColumns}
          emptyMessage={
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground">No staff members found</p>
              <Button onClick={() => setEditingRecord({} as StaffMember)}>
                <PlusIcon />
                Add Staff Member
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

      <StaffModal
        isOpen={!!editingRecord}
        initialValues={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={async (record: StaffMember) => {
          await response.upsertRecord({ record });
          setEditingRecord(null);
        }}
      />
    </Page>
  );
};

export default Staff;
