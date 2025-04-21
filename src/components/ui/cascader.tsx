import { Input } from "./input";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "./dropdown-menu";
import { DropdownMenuTrigger } from "./dropdown-menu";
import { LucideProps } from "lucide-react";

export type CascaderOption = {
  label: string;
  value: string;
  hidden?: boolean;
  Icon?: React.ComponentType<LucideProps>;
  children?: CascaderOption[];
  isGroupLabel?: boolean;
  formatValue?: (value: string) => string;
};

type CascaderProps = {
  value: string;
  onChange: (value: CascaderOption) => void;
  options: CascaderOption[];
  disabled?: boolean;
};

const Cascader = (props: CascaderProps) => {
  const { value, onChange, disabled } = props;
  const [inputWidth, setInputWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  const findValueLabel = (
    options: CascaderOption[],
    targetValue: string
  ): { parent?: CascaderOption; option: CascaderOption } | undefined => {
    for (const option of options) {
      if (option.value === targetValue) {
        return { option };
      }

      if (option.children?.length) {
        const result = findValueLabel(option.children, targetValue);

        if (result) {
          return { parent: option, option: result.option };
        }
      }
    }

    // Check if any top-level parent matches the target value
    const topLevelParent = options.find((opt) => opt.value === targetValue);
    if (topLevelParent) {
      return { option: topLevelParent };
    }

    return undefined;
  };

  const Value = findValueLabel(props.options, value);
  const ParentIcon = Value?.parent?.Icon;

  const ValueLabel = Value?.option.formatValue
    ? Value?.option.formatValue(Value?.option.label)
    : Value?.option.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Input
          disabled={disabled}
          icon={ParentIcon && <ParentIcon className="mr-2 h-4 w-4" />}
          className="flex-start text-left"
          ref={inputRef}
          value={value ? ValueLabel : ""}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-full"
        style={{ width: inputWidth }}
      >
        {props.options
          .filter((action) => !action.hidden)
          .map((action) => {
            if (action.children) {
              return (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="DropdownMenuSubTrigger">
                    {action.Icon && <action.Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      className="DropdownMenuSubContent"
                      sideOffset={2}
                      alignOffset={-5}
                    >
                      {action.children.map((child) => (
                        <DropdownMenuItem
                          key={child.value}
                          onClick={(e) => {
                            onChange(child);
                          }}
                        >
                          {child.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              );
            }

            if (action.isGroupLabel) {
              return (
                <DropdownMenuLabel className="DropdownMenuLabel">
                  {action.label}
                </DropdownMenuLabel>
              );
            }

            return (
              <DropdownMenuItem
                key={action.label}
                onClick={(e) => {
                  onChange(action);
                }}
              >
                {action.Icon && <action.Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Cascader;
