"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  id,
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() =>
    value ? new Date(value) : undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        setDate(d);
        setMonth(d);
      }
    } else {
      setDate(undefined);
      setMonth(undefined);
    }
  }, [value]);

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected);
    setMonth(selected);
    onChange?.(selected ? selected.toISOString().slice(0, 10) : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          id={id}
          variant="outline"
          data-empty={!date}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-4" />
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="start"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          captionLayout="dropdown"
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}
