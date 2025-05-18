import { FormField } from "@/components/FormBuilder/types";

export const addressFields: FormField[] = [
  {
    id: "address_line_1",
    name: "address_line_1",
    label: "Address Line 1",
    type: "text",
    validation: { required: true },
  },
  {
    id: "address_line_2",
    name: "address_line_2",
    label: "Address Line 2",
    type: "text",
  },
  {
    id: "city",
    name: "city",
    label: "City",
    type: "text",
    validation: { required: true },
  },
  {
    id: "state",
    name: "state",
    label: "State",
    type: "text",
    validation: { required: true },
  },
  {
    id: "zip",
    name: "zip",
    label: "ZIP",
    type: "text",
    validation: { required: true },
  },
  {
    id: "country",
    name: "country",
    label: "Country",
    type: "text",
    validation: { required: true },
  },
];
