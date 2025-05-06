import { FieldRendererProps } from "./index";
import { getAirtableColor } from "@/utils/airtable";
import { SelectOption } from "@/types/customTable";

const SingleSelectRenderer = ({ value }: FieldRendererProps<SelectOption>) => {
  if (!value) return <span className="text-sm text-muted-foreground">-</span>;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAirtableColor(
        value.color
      )}`}
    >
      {value.value}
    </span>
  );
};

export default SingleSelectRenderer;
