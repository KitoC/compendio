import LineItemField from "./LineItemField";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { v4 as uuidv4 } from "uuid";
import { QuoteLineItemWithRelations } from "@/services/supabase/QuoteLineItemService";
import { Divider } from "../ui/divider";

export const LineItemsField = ({
  value = [],
  onChange,
  error,
  touched,
  formValues,
  setFormValues,
  name,
}: {
  value: Partial<QuoteLineItemWithRelations>[];
  onChange: (
    name: string,
    value: Partial<QuoteLineItemWithRelations>[]
  ) => void;
  error?: string;
  touched?: boolean;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  name: string;
}) => {
  const handleAddItem = useCallback(() => {
    const newItem: Partial<QuoteLineItemWithRelations> = {
      id: uuidv4(),
      tenant_id: formValues.tenant_id as string,
      quote_id: formValues.quote_id as string,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
    };

    onChange("quote_line_items", [...value, newItem]);
  }, [value, onChange, formValues]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      const newItems = [...value];
      newItems.splice(index, 1);
      onChange("quote_line_items", newItems);
    },
    [value, onChange]
  );

  const handleChangeItem = useCallback(
    (updatedItem: Partial<QuoteLineItemWithRelations>) => {
      const newItems = value.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );

      console.log(newItems);

      onChange("quote_line_items", newItems);
    },
    [value, onChange]
  );

  console.log(value);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Card className="p-4 mb-2 w-full bg-muted/50">
        <div className="flex items-center gap-4 w-full">
          <div className="w-8 text-sm font-medium text-muted-foreground">#</div>
          <div className="flex-1 min-w-[200px] text-sm font-medium text-muted-foreground">
            Item
          </div>
          <div className="w-24 text-sm font-medium text-muted-foreground">
            Quantity
          </div>
          <div className="w-32 text-sm font-medium text-muted-foreground">
            Unit Price
          </div>
          <div className="w-24 text-sm font-medium text-muted-foreground">
            Discount %
          </div>
          <div className="w-32 text-sm font-medium text-muted-foreground">
            Total
          </div>
          <div className="w-9"></div>
        </div>
      </Card>
      {value.map((item, index) => (
        <>
          {/* {index !== 0 && (
            <Divider className="w-full h-px opacity-50 my-2"></Divider>
          )} */}
          <LineItemField
            formFieldProps={{
              id: "quote_line_items",
              name: "quote_line_items",
              type: "custom",
              value,
              formValues,
              setFormValues,
            }}
            key={index}
            value={item}
            onChange={handleChangeItem}
            index={index}
            onRemove={() => handleRemoveItem(index)}
          />
        </>
      ))}
      <div className="flex justify-end w-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
      </div>
    </div>
  );
};
