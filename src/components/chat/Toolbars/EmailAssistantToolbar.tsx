import { ListFilter } from "lucide-react";
import {
  PRIORITIES,
  PRIORITY_FILTER_KEY,
  EMAIL_STATUSES,
  EMAIL_STATUS_FILTER_KEY,
} from "../MarkupBuilder/EmailAgentMessage/consts";
import FilterMenu from "./FilterMenuItem";
import { Badge } from "@/components/ui/badge";
import { Menubar } from "@/components/ui/menubar";

const PRIORITY_CHECK_ITEMS = Object.entries(PRIORITIES)
  .sort((a, b) => Number(a[0]) - Number(b[0]))
  .reverse()
  .map(([key, value]) => ({
    color: value.color,
    label: value.label,
    value: Number(key),
  }));

const EMAIL_STATUS_CHECK_ITEMS = Object.entries(EMAIL_STATUSES).map(
  ([key, value]) => ({
    color: value.color,
    label: value.label,
    value: key,
    Icon: value.Icon,
  })
);

export const EmailAssistantToolbar = () => {
  return (
    <div className="p-4 flex items-center justify-end gap-3">
      <Menubar>
        <FilterMenu
          filterKey={EMAIL_STATUS_FILTER_KEY}
          items={EMAIL_STATUS_CHECK_ITEMS}
          label="Status"
        />

        <FilterMenu
          filterKey={PRIORITY_FILTER_KEY}
          items={PRIORITY_CHECK_ITEMS}
          label="Priority"
          renderItem={(item) => (
            <Badge
              variant="default"
              className={`font-bold text-[10px] px-1.5 ${item.color}`}
            >
              {item.label}
            </Badge>
          )}
        />
      </Menubar>
    </div>
  );
};
