import { FormConfig } from "@/components/FormBuilder/types";
import { addressFields } from "./addressFields";

export const accountSettingsFormConfig: FormConfig = {
  id: "account-settings-form",
  title: "Account Settings",
  sections: [
    {
      id: "company-section",
      title: "Company Details",
      hidden: (values) => values.userRole !== "tenant_owner",
      fields: [
        {
          id: "company_name",
          name: "company_name",
          label: "Company Name",
          type: "text",
          validation: { required: true },
        },
        ...addressFields,
      ],
    },
    {
      id: "staff-section",
      title: "Personal Details",
      hidden: (values) => values.userRole === "tenant_owner",
      fields: [
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
        ...addressFields,
      ],
    },
  ],
};
