"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
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

function mergeDayAndTime(day: Date, hhmm: string): Date {
  const parsed = parseTime(hhmm);
  const hours = parsed?.hours ?? 0;
  const minutes = parsed?.minutes ?? 0;
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
  );
}

function safeDate(iso: string | undefined): Date | undefined {
  if (!iso?.trim()) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatRangeTrigger(
  start?: Date,
  end?: Date,
  placeholder: string,
): string {
  if (!start) return placeholder;
  if (!end) return `${formatDateTime(start)} – …`;
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

export interface DateTimeRangePickerProps {
  startValue?: string;
  endValue?: string;
  onChange: (next: { startAt: string; endAt: string }) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Single control for tournament-style start/end: range calendar (see
 * [date-range-picker-for-shadcn](https://github.com/johnpolacek/date-range-picker-for-shadcn))
 * plus per-boundary time fields. Emits ISO strings like {@link DateTimePicker}.
 */
export function DateTimeRangePicker({
  startValue,
  endValue,
  onChange,
  placeholder = "Select start and end date & time",
  id,
  className,
  disabled,
}: DateTimeRangePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [month, setMonth] = React.useState<Date | undefined>();
  const [startTime, setStartTime] = React.useState("00:00");
  const [endTime, setEndTime] = React.useState("23:59");

  React.useEffect(() => {
    const start = safeDate(startValue);
    const end = safeDate(endValue);
    if (start) {
      setRange({
        from: startOfDay(start),
        to: end ? startOfDay(end) : undefined,
      });
      setMonth(startOfDay(start));
      setStartTime(formatTime(start));
    } else {
      setRange(undefined);
      setMonth(undefined);
    }
    if (end) {
      setEndTime(formatTime(end));
    } else if (!start) {
      setEndTime("23:59");
    }
  }, [startValue, endValue]);

  const emitFromRange = React.useCallback(
    (
      nextRange: DateRange | undefined,
      startT: string,
      endT: string,
    ) => {
      if (!nextRange?.from) {
        onChange({ startAt: "", endAt: "" });
        return;
      }
      const startAt = mergeDayAndTime(nextRange.from, startT).toISOString();
      const endAt = nextRange.to
        ? mergeDayAndTime(nextRange.to, endT).toISOString()
        : "";
      onChange({ startAt, endAt });
    },
    [onChange],
  );

  const handleRangeSelect = (next: DateRange | undefined) => {
    if (!next) {
      setRange(undefined);
      onChange({ startAt: "", endAt: "" });
      return;
    }
    setRange(next);
    emitFromRange(next, startTime, endTime);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setStartTime(v);
    if (!range?.from) return;
    const parsed = parseTime(v);
    if (!parsed && v !== "") return;
    const next: DateRange = {
      from: range.from,
      to: range.to,
    };
    emitFromRange(next, v || "00:00", endTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEndTime(v);
    if (!range?.from) return;
    const parsed = parseTime(v);
    if (!parsed && v !== "") return;
    const next: DateRange = {
      from: range.from,
      to: range.to ?? range.from,
    };
    emitFromRange(next, startTime, v || "23:59");
  };

  const startDt = safeDate(startValue);
  const endDt = safeDate(endValue);
  const label = formatRangeTrigger(startDt, endDt, placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="w-full"
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            data-empty={!startDt}
            disabled={disabled}
            className={cn(
              "h-auto min-h-10 w-full justify-between gap-2 py-2 text-left font-normal",
              !startDt && "text-muted-foreground",
              className,
            )}
          >
            <span className="flex min-w-0 items-start gap-2">
              <CalendarIcon className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 whitespace-normal wrap-break-word">
                {label}
              </span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent
        className="w-auto max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-none"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col gap-3 p-3">
          <Calendar
            mode="range"
            selected={range}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleRangeSelect}
            captionLayout="dropdown"
            defaultMonth={month ?? range?.from}
            numberOfMonths={isMobile ? 1 : 2}
          />
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${id ?? "dtr"}-start-time`}
                className="text-sm font-medium"
              >
                Start time
              </label>
              <input
                id={`${id ?? "dtr"}-start-time`}
                type="time"
                value={startTime}
                onChange={handleStartTimeChange}
                disabled={!range?.from}
                step="60"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${id ?? "dtr"}-end-time`}
                className="text-sm font-medium"
              >
                End time
              </label>
              <input
                id={`${id ?? "dtr"}-end-time`}
                type="time"
                value={endTime}
                onChange={handleEndTimeChange}
                disabled={!range?.to}
                step="60"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
