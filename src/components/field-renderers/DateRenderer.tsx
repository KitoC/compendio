import { FieldRendererProps } from "./index";
import { formatValue } from "../custom-tables/utils";
import { useUserSettings } from "@/contexts/UserSettingsProvider";

const DateRenderer = ({ field, value }: FieldRendererProps) => {
  const { timeSettings } = useUserSettings();

  try {
    const formattedDate = formatValue(value, field, timeSettings);

    return <span className="text-sm">{formattedDate}</span>;
  } catch (error) {
    return <span className="text-sm text-muted-foreground">Invalid date</span>;
  }
};

export default DateRenderer;
