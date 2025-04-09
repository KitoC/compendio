import {
  Menubar,
  MenubarTrigger,
  MenubarPortal,
  MenubarContent,
  MenubarMenu,
  MenubarCheckboxItem,
  MenubarItemIndicator,
} from "@/components/ui/menubar";
import { ListFilter, LucideProps } from "lucide-react";
import { useChat } from "@/contexts/chat";
import { BadgeProps } from "@/components/ui/badge";

interface FilterMenuItem {
  label: string;
  value: unknown;
  color?: string;
  variant?: BadgeProps["variant"];
  Icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

interface FilterMenuProps {
  filterKey: string;
  items: FilterMenuItem[];
  label: string;
  renderItem?: (item: FilterMenuItem) => React.ReactNode;
}

const FilterMenu = ({
  filterKey,
  items,
  label,
  renderItem,
}: FilterMenuProps) => {
  const { filter, setFilter } = useChat();

  const handleFilterChange = (value: unknown) => {
    setFilter((prev) => {
      const nextPriority = [...(prev[filterKey] || [])];

      if (nextPriority.includes(value)) {
        nextPriority.splice(nextPriority.indexOf(value), 1);
      } else {
        nextPriority.push(value);
      }
      return {
        ...prev,
        [filterKey]: nextPriority,
      };
    });
  };
  const checkedItems = filter[filterKey] || [];

  return (
    <div className="relative">
      <div className="absolute top-[-10px] right-[-10px] bg-sidebar rounded-full px-2 py-1 text-xs z-10">
        {checkedItems.length}
      </div>
      <MenubarMenu>
        <MenubarTrigger>
          {label} <ListFilter className="ml-2 h-4 w-4" />
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent className="w-fit min-w-fit">
            {items.map((item) => (
              <MenubarCheckboxItem
                className="MenubarCheckboxItem inset"
                key={`${item.value}` as string}
                checked={filter[filterKey]?.includes(item.value)}
                onCheckedChange={() => handleFilterChange(item.value)}
              >
                <MenubarItemIndicator className="MenubarItemIndicator"></MenubarItemIndicator>
                <span className="mr-1">
                  {renderItem ? renderItem(item) : item.label}
                </span>
                {item.Icon && <item.Icon className="ml-auto w-4 h-4" />}
              </MenubarCheckboxItem>
            ))}
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
    </div>
  );
};

export default FilterMenu;
