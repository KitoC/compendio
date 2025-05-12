import { FieldRendererProps } from "./index";
import RecordTag from "../custom-tables/RecordTag";

// TODO: re-implement this
const MultipleRecordLinksRenderer = ({
  field,
  value,
  record,
}: FieldRendererProps) => {
  // Handle case when no values
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div
      className="flex flex-wrap gap-1 max-w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {value.map((item) => {
        return <RecordTag key={item.value} record={item} field={field} />;
      })}
    </div>
  );
};

export default MultipleRecordLinksRenderer;
