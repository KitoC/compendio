const gridViewColumns = [
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
  },
  {
    id: "email",
    header: "Email",
    accessorFn: (row) => row.email,
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (row) => row.phone,
  },
];

export default gridViewColumns;
