import { CustomFieldComponentProps } from "@/components/FormBuilder/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrashIcon, DollarSignIcon } from "lucide-react";
import QuoteItemSelect from "@/components/EntitySelects/QuoteItemSelect";
import { Input } from "@/components/ui/input";
import { QuoteLineItemWithRelations } from "@/services/supabase/QuoteLineItemService";
import { QuoteItem } from "@/services/supabase/QuoteItemService";
import { SelectOption } from "@/types/fieldTypes";

interface LineItemFieldProps {
  index: number;
  onRemove: () => void;
  value: Partial<QuoteLineItemWithRelations>;
  onChange: (item: Partial<QuoteLineItemWithRelations>) => void;
  formFieldProps: Omit<CustomFieldComponentProps, "onChange">;
}

const LineItemField = ({
  value,
  onChange,
  index,
  onRemove,
  formFieldProps,
}: LineItemFieldProps) => {
  const handleChange = (
    fieldName: keyof QuoteLineItemWithRelations,
    fieldValue: number | string | SelectOption<QuoteItem>[]
  ) => {
    const newValue = { ...value, [fieldName]: fieldValue };

    // Calculate total price
    const quantity =
      fieldName === "quantity" ? Number(fieldValue) : value.quantity;
    const unitPrice =
      fieldName === "unit_price" ? Number(fieldValue) : value.unit_price;
    const discountPercentage =
      fieldName === "discount_percentage"
        ? Number(fieldValue)
        : value.discount_percentage;

    if (fieldName === "quote_item") {
      const [quoteItem] = fieldValue as SelectOption<QuoteItem>[];
      newValue.quote_item = quoteItem?.data;
      newValue.unit_price = quoteItem?.data?.unit_price;
      newValue.quantity = quoteItem?.data?.quantity;
    }

    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalPrice = subtotal - discountAmount;

    newValue.total_price = totalPrice;
    newValue.discount_amount = discountAmount;

    onChange(newValue);
  };

  const totalPrice = value.unit_price * value.quantity;
  const discountAmount = (totalPrice * value.discount_percentage) / 100;
  const subtotal = totalPrice - discountAmount;

  return (
    <Card className="p-4 mb-2 w-full">
      <div className="flex items-center gap-4 w-full">
        <div className="w-8 text-sm font-medium text-muted-foreground">
          {index + 1}
        </div>

        <div className="flex-1 min-w-[200px]">
          <QuoteItemSelect
            name="quote_item"
            id="quote_item"
            type="custom"
            value={
              value.quote_item
                ? [
                    {
                      value: value.quote_item.id,
                      label: value.quote_item.name,
                      data: value.quote_item,
                    },
                  ]
                : []
            }
            onChange={handleChange}
            isMulti={false}
            formValues={formFieldProps.formValues}
            setFormValues={formFieldProps.setFormValues}
          />
        </div>

        <div className="w-24">
          <Input
            type="number"
            value={value.quantity}
            onChange={(e) => handleChange("quantity", Number(e.target.value))}
            min={1}
            placeholder="Qty"
            className="h-9"
          />
        </div>

        <div className="w-32">
          <Input
            prefix={"$"}
            type="number"
            value={value.unit_price}
            onChange={(e) => handleChange("unit_price", Number(e.target.value))}
            min={0}
            step={0.01}
            placeholder="Price"
            className="h-9"
          />
        </div>

        <div className="w-24">
          <Input
            type="number"
            value={value.discount_percentage}
            onChange={(e) =>
              handleChange("discount_percentage", Number(e.target.value))
            }
            min={0}
            max={100}
            step={0.01}
            placeholder="Disc %"
            className="h-9"
          />
        </div>

        <div className="w-32">
          <Input
            prefix={"$"}
            type="number"
            value={subtotal}
            readOnly
            className="bg-muted h-9"
            placeholder="Total"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive/90 h-9 w-9"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default LineItemField;
