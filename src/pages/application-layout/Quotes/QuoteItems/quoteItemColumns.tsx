import { GridViewColumn } from "@/components/views/GridView/GridView";
import { QuoteItem } from "@/services/supabase/QuoteItemService";

const gridViewColumns: GridViewColumn<QuoteItem>[] = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row: QuoteItem) => row.name,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "code",
    header: "Code",
    accessorFn: (row: QuoteItem) => row.code,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "description",
    header: "Description",
    accessorFn: (row: QuoteItem) => row.description,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "quantity",
    header: "Quantity",
    accessorFn: (row: QuoteItem) => row.quantity?.toString(),
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "unit_price",
    header: "Unit Price",
    accessorFn: (row: QuoteItem) => row.unit_price?.toString(),
    renderOptions: {
      type: "currency",
    },
  },
  {
    id: "total_price",
    header: "Total Price",
    accessorFn: (row: QuoteItem) => row.total_price?.toString(),
    renderOptions: {
      type: "currency",
    },
  },
];

export default gridViewColumns;
