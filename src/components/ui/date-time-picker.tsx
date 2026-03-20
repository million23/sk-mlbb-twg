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

function formatDateTime(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

function formatTime(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "HH:mm");
}

function parseTime(value: string): { hours: number; minutes: number } | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  id,
  className,
  disabled,
}: DateTimePickerProps) {
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

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) {
      setDate(undefined);
      onChange?.("");
      return;
    }
    const newDate = date
      ? new Date(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
          date.getHours(),
          date.getMinutes(),
        )
      : new Date(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
          0,
          0,
        );
    setDate(newDate);
    setMonth(newDate);
    onChange?.(newDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    const parsed = parseTime(timeValue);
    const baseDate = date ?? new Date();
    if (parsed) {
      const newDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        parsed.hours,
        parsed.minutes,
      );
      setDate(newDate);
      onChange?.(newDate.toISOString());
    } else if (!timeValue) {
      const newDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        0,
        0,
      );
      setDate(newDate);
      onChange?.(newDate.toISOString());
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
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
              {date ? formatDateTime(date) : placeholder}
            </span>
            <ChevronDownIcon className="size-4 opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            defaultMonth={date}
          />
          <div className="flex flex-col gap-2 border-t pt-3">
            <label
              htmlFor={`${id ?? "dt"}-time`}
              className="text-sm font-medium"
            >
              Time
            </label>
            <input
              id={`${id ?? "dt"}-time`}
              type="time"
              value={formatTime(date)}
              onChange={handleTimeChange}
              step="60"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
