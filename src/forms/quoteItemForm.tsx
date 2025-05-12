import { FormConfig } from "@/components/FormBuilder/types";

export const quoteItemFormConfig: FormConfig = {
  id: "quote-item-form",
  sections: [
    {
      id: "details",
      title: "Quote Item Details",
      fields: [
        {
          id: "quote-item-details",
          name: "quote-item-details",
          type: "field-group",
          fields: [
            {
              id: "name",
              name: "name",
              type: "text",
              label: "Name",
              wrapperClassName: "w-1/2",
              placeholder: "Enter item name",
            },
            {
              id: "code",
              name: "code",
              type: "text",
              label: "Code",
              wrapperClassName: "w-1/2",
              placeholder: "Enter item code",
            },
          ],
        },
        {
          id: "description",
          name: "description",
          type: "textarea",
          label: "Description",
          wrapperClassName: "w-full",
          placeholder: "Enter item description",
        },
        {
          id: "pricing",
          name: "pricing",
          type: "field-group",
          fields: [
            {
              id: "quantity",
              name: "quantity",
              type: "number",
              label: "Quantity",
              wrapperClassName: "w-1/3",
              defaultValue: 1,
            },
            {
              id: "unit_price",
              name: "unit_price",
              type: "number",
              label: "Unit Price",
              wrapperClassName: "w-1/3",
              defaultValue: 0,
            },
            {
              id: "total_price",
              name: "total_price",
              type: "number",
              label: "Total Price",
              wrapperClassName: "w-1/3",
              defaultValue: 0,
              disabled: true,
            },
          ],
        },
      ],
    },
  ],
  submitButtonText: "Save Quote Item",
};
