import { FormConfig } from "@/components/FormBuilder/types";
import StaffMemberSelect from "@/components/EntitySelects/StaffMemberSelect";
import ClientSelect from "@/components/EntitySelects/ClientSelect";
import { LineItemsField } from "@/components/LineItemsField";

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
          className: "flex",
          fields: [
            {
              id: "name",
              name: "name",
              type: "text",
              label: "Quote Title",
              wrapperClassName: "w-1/2",
              placeholder: "e.g. 'Quote for fencing work at 123 Main St'",
              validation: {
                required: true,
              },
            },
            {
              id: "staff-member",
              name: "staffMember",
              type: "custom",
              label: "Quoted By",
              wrapperClassName: "w-1/4 min-w-[250px]",
              CustomComponent: StaffMemberSelect,
              validation: {
                required: true,
              },
            },
            {
              id: "client",
              name: "client",
              type: "custom",
              label: "Quote For",
              wrapperClassName: "w-1/4 min-w-[250px]",
              CustomComponent: ClientSelect,
              validation: {
                required: true,
              },
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
    {
      id: "line-items",
      title: "Line Items",
      description: "Add items to your quote",
      fields: [
        {
          id: "quote_line_items",
          name: "quote_line_items",
          type: "custom",
          label: "Line Items",
          CustomComponent: LineItemsField,
          defaultValue: [],
          validation: {
            required: true,
          },
        },
      ],
    },
  ],
  submitButtonText: "Preview Quote",
};
