
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DataTable, { Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WebhookEvent {
  id: string;
  subscription_id: string;
  event_type: string;
  payload: any;
  status: string;
  created_at: string;
  processed_at: string | null;
  tenant_id: string;
}

interface WebhookEventsTableProps {
  tenantId: string | null;
}

const WebhookEventsTable = ({ tenantId }: WebhookEventsTableProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchWebhookEvents();
    }
  }, [tenantId]);

  const fetchWebhookEvents = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching webhook events:", error);
      toast.error("Failed to load webhook events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (event: WebhookEvent) => {
    setSelectedEvent(event);
    setShowPayloadDialog(true);
  };

  const columns: Column<WebhookEvent>[] = [
    {
      field: "event_type",
      header: "Event Type",
      sortable: true,
    },
    {
      field: "subscription_id",
      header: "Subscription",
      sortable: true,
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      render: (event) => {
        const status = event.status || "unknown";
        return (
          <Badge
            variant={
              status === "processed" ? "success" :
              status === "pending" ? "warning" :
              status === "error" ? "destructive" : "default"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      field: "created_at",
      header: "Received",
      sortable: true,
      render: (event) => new Date(event.created_at).toLocaleString(),
    },
    {
      field: "processed_at",
      header: "Processed",
      sortable: true,
      render: (event) => event.processed_at ? 
        new Date(event.processed_at).toLocaleString() : "—",
    },
    {
      field: "payload",
      header: "Payload",
      render: () => (
        <Button variant="outline" size="sm">View</Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Webhook Events</h3>
      
      <DataTable
        data={events}
        columns={columns}
        onRowClick={handleRowClick}
        permissions={{
          create: false,
          read: true,
          update: false,
          delete: true,
          export: false,
        }}
        onDelete={(id) => {
          if (typeof id === 'string') {
            supabase
              .from("webhook_events")
              .delete()
              .eq("id", id)
              .eq("tenant_id", tenantId)
              .then(() => {
                toast.success("Event deleted");
                fetchWebhookEvents();
              })
              .catch((error) => {
                toast.error("Failed to delete event");
                console.error(error);
              });
          }
        }}
        isLoading={isLoading}
        searchable={true}
        pagination={true}
        pageSize={10}
        emptyMessage="No webhook events found."
      />

      {showPayloadDialog && selectedEvent && (
        <Dialog open={showPayloadDialog} onOpenChange={setShowPayloadDialog}>
          <DialogContent className="sm:max-w-[800px] sm:max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Webhook Event Payload</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Event Type:</h4>
                  <p>{selectedEvent.event_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Status:</h4>
                  <p>{selectedEvent.status}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Received:</h4>
                  <p>{new Date(selectedEvent.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Processed:</h4>
                  <p>{selectedEvent.processed_at ? 
                    new Date(selectedEvent.processed_at).toLocaleString() : "Not processed"}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Payload:</h4>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WebhookEventsTable;
