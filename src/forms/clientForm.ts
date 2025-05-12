import { FormConfig } from "@/components/FormBuilder/types";

export const clientFormConfig: FormConfig = {
  id: "client-form",
  title: "Client",
  sections: [
    {
      id: "client-info",
      title: "",
      fields: [
        {
          id: "first_name",
          name: "first_name",
          label: "First Name",
          type: "text",
          validation: { required: true },
        },
        {
          id: "last_name",
          name: "last_name",
          label: "Last Name",
          type: "text",
          validation: { required: true },
        },
        {
          id: "email",
          name: "email",
          label: "Email",
          type: "email",
          validation: { required: true },
        },
        {
          id: "phone",
          name: "phone",
          label: "Phone",
          type: "text",
          validation: { required: true },
        },
        // {
        //   id: "address",
        //   name: "address",
        //   label: "Address",
        //   type: "text",
        // },
      ],
    },
  ],
};
