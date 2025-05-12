import { GridViewColumn } from "@/components/views/GridView/GridView";
import { Client } from "@/services/supabase/ClientsServices";

const gridViewColumns: GridViewColumn<Client>[] = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row: Client) => `${row.first_name} ${row.last_name}`,
    renderOptions: {
      type: "text",
    },
  },
  {
    id: "email",
    header: "Email",
    accessorFn: (row: Client) => row.email,
    renderOptions: {
      type: "email",
    },
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (row: Client) => row.phone,
    renderOptions: {
      type: "phone",
    },
  },
];

export default gridViewColumns;
