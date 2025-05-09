import { Badge } from "@/components/ui/badge";
import { formatValue } from "../utils";
import BooleanRenderer from "./BooleanRenderer";
import { useUserSettings } from "@/contexts/UserSettingsProvider";
import { CustomTableField, CustomTableRecord } from "@/types/customTable";

interface ReadonlyFieldsProps {
  readonlyItems: CustomTableField[];
  record: CustomTableRecord;
}

const ReadonlyBadge = ({
  value,
  item,
}: {
  value: string;
  item: CustomTableField;
}) => {
  const { timeSettings } = useUserSettings();

  const formattedValue = formatValue(value, item, timeSettings);

  return (
    <Badge className="text-xs w-fit" variant="outline">
      {item.prefix}
      {formattedValue || "-"}
      {item.suffix}
    </Badge>
  );
};

const ReadonlyFields = ({ readonlyItems, record }: ReadonlyFieldsProps) => {
  const { timeSettings } = useUserSettings();

  if (!readonlyItems.length) {
    return null;
  }

  return (
    <div className="p-6 pb-0 bg-card flex flex-col gap-2">
      <p className="text-muted-foreground font-bold text-xs">
        Calculated fields
      </p>
      {readonlyItems.map((item) => {
        const value = record?.[item?.name] as string;

        return (
          <div key={item.id} className="gap-2">
            <p className="text-muted-foreground font-bold text-sm">
              {item.name}
            </p>

            <div className="flex flex-col gap-1">
              {Array.isArray(value) ? (
                value.map((v) => (
                  <ReadonlyBadge
                    value={v.label || v.value}
                    item={item}
                    key={v.value}
                  />
                ))
              ) : typeof value === "boolean" ? (
                <BooleanRenderer value={value} />
              ) : (
                <ReadonlyBadge value={value} item={item} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReadonlyFields;
