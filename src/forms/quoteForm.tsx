import { FormConfig } from "@/components/FormBuilder/types";
import ClientSelect from "@/components/EntitySelects/ClientSelect";
import StaffMemberSelect from "@/components/EntitySelects/StaffMemberSelect";
import { Mail } from "lucide-react";

export const quoteFormConfig: FormConfig = {
  id: "new-quote",
  sections: [
    {
      id: "details",
      title: "Quote Details",
      fields: [
        {
          id: "quote-details",
          name: "quote-details",
          type: "field-group",
          fields: [
            {
              id: "name",
              name: "name",
              type: "text",
              label: "Quote Title",
              wrapperClassName: "w-1/2",
              placeholder: "e.g. 'Quote for fencing work at 123 Main St'",
            },
            {
              id: "staff-member",
              name: "staffMember",
              type: "custom",
              label: "Quoted By",
              wrapperClassName: "w-1/4",
              CustomComponent: StaffMemberSelect,
            },
            {
              id: "client",
              name: "client",
              type: "custom",
              label: "Quote For",
              wrapperClassName: "w-1/4",
              CustomComponent: ClientSelect,
            },
          ],
        },
        {
          id: "description",
          name: "description",
          type: "textarea",
          label: "Description",
          wrapperClassName: "w-full",
          placeholder:
            "Describe the work to be done and any other details needed to complete the quote.",
        },
      ],
    },
  ],
  submitButtonText: "Preview Quote",
};
