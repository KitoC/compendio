import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "./badge";
import { X } from "lucide-react";

interface TagProps extends BadgeProps {
  children: React.ReactNode;
  onRemove?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Tag = ({ children, ...props }: TagProps) => {
  return (
    <Badge
      {...props}
      className={cn("!rounded-sm px-2", props.className)}
      aria-role={props.onClick || props.onRemove ? "button" : undefined}
      onClick={props.onClick}
    >
      {children}
      {props.onRemove && (
        <X
          className="ml-1 h-4 w-4 hover:cursor-pointer hover:text-red-500"
          onClick={(e) => props.onRemove?.(e)}
        />
      )}
    </Badge>
  );
};

export { Tag };
