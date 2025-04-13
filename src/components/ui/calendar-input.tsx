import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar, CalendarProps } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import { useState } from "react";
import { ChangeEventHandler } from "react";
import { setHours, setMinutes } from "date-fns";

export type CalendarInputProps = CalendarProps & {
  name: string;
  value: string;
  onChange: (value: string) => void;
};

function CalendarInput({ value, onChange, ...props }: CalendarInputProps) {
  const timeValue = dayjs(value).format("hh:mm");
  const dateValue = dayjs(value).format("YYYY-MM-DD");

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value;

    const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
    const newSelectedDate = setHours(
      setMinutes(new Date(value), minutes),
      hours
    );

    onChange(newSelectedDate.toISOString());
  };

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      return;
    }
    const [hours, minutes] = timeValue
      .split(":")
      .map((str) => parseInt(str, 10));
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes
    );
    onChange(newDate.toISOString());
  };

  return (
    <DropdownMenu>
      <div className="flex gap-2">
        <DropdownMenuTrigger asChild>
          <Input type="date" value={dateValue} className="text-left w-fit" />
        </DropdownMenuTrigger>
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="text-left w-fit"
        />
      </div>
      <DropdownMenuContent>
        <Calendar
          {...props}
          mode="single"
          selected={new Date(value)}
          onSelect={handleDaySelect}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

CalendarInput.displayName = "Calendar";

export { CalendarInput };
