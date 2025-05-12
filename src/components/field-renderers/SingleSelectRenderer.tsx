import { FieldRendererProps } from "./index";
import { getCustomTableColor } from "@/utils/customTableHelpers";

function SingleSelectRenderer<RecordType>({
  value,
  field,
}: FieldRendererProps<string | number, RecordType>) {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;

  const option = field.options.find((option) => option.value === value);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        getCustomTableColor(option.color).theme
      }`}
    >
      {option?.label}
    </span>
  );
}

export default SingleSelectRenderer;
