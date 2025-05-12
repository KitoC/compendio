import { GridViewColumn } from "@/components/views/GridView/GridView";
import { Quote } from "@/services/supabase/QuoteService";

const gridViewColumns: GridViewColumn<Quote>[] = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row: Quote) => row.name,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "client",
    header: "Client",
    accessorFn: (row: Quote) => row.client_id,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row: Quote) => row.status,
    renderOptions: {
      type: "text",
    },
  },
];

export default gridViewColumns;
