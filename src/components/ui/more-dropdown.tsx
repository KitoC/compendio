
import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface MoreDropdownProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export const MoreDropdown = ({
  children,
  align = "end",
  side = "bottom"
}: MoreDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-[160px]">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return <DropdownMenuItem asChild>{child}</DropdownMenuItem>;
          }
          return child;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
