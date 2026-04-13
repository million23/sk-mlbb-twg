"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const currentYear = new Date().getFullYear();
const MIN_YEAR = 1950;
const MAX_YEAR = currentYear;

export interface BirthdayPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

function toYYYYMMDD(year: number, month: number, day: number): string {
  const y = year.toString();
  const m = month.toString().padStart(2, "0");
  const d = day.toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseNum(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? null : n;
}

export function BirthdayPicker({
  value,
  onChange,
  id,
  className,
  disabled,
}: BirthdayPickerProps) {
  const parsed = React.useMemo(() => {
    if (!value?.trim()) return { year: "", month: "", day: "" };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { year: "", month: "", day: "" };
    return {
      year: d.getFullYear().toString(),
      month: (d.getMonth() + 1).toString(),
      day: d.getDate().toString(),
    };
  }, [value]);

  const [month, setMonth] = React.useState(parsed.month);
  const [day, setDay] = React.useState(parsed.day);
  const [year, setYear] = React.useState(parsed.year);

  React.useEffect(() => {
    setMonth(parsed.month);
    setDay(parsed.day);
    setYear(parsed.year);
  }, [parsed.month, parsed.day, parsed.year]);

  const daysInMonth = React.useMemo(() => {
    const y = parseNum(year) ?? currentYear;
    const m = parseNum(month) ?? 1;
    return getDaysInMonth(y, m);
  }, [year, month]);

  const days = React.useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const commit = React.useCallback(
    (m: string, d: string, y: string) => {
      const mn = parseNum(m);
      const dn = parseNum(d);
      const yn = parseNum(y);
      if (mn === null || dn === null || yn === null) {
        onChange?.("");
        return;
      }
      if (
        mn < 1 ||
        mn > 12 ||
        dn < 1 ||
        dn > getDaysInMonth(yn, mn) ||
        yn < MIN_YEAR ||
        yn > MAX_YEAR
      ) {
        onChange?.("");
        return;
      }
      onChange?.(toYYYYMMDD(yn, mn, dn));
    },
    [onChange]
  );

  const handleMonthChange = (v: string) => {
    setMonth(v);
    const dn = parseNum(day);
    const yn = parseNum(year);
    const mn = parseNum(v);
    if (mn !== null && dn !== null && yn !== null) {
      const clampedDay = Math.min(dn, getDaysInMonth(yn, mn));
      setDay(clampedDay.toString());
      commit(v, clampedDay.toString(), year);
    } else {
      commit(v, day, year);
    }
  };

  const handleDayChange = (v: string) => {
    setDay(v);
    commit(month, v, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setYear(v);
    const dn = parseNum(day);
    const yn = parseNum(v);
    const mn = parseNum(month);
    if (yn !== null && dn !== null && mn !== null) {
      const clampedDay = Math.min(dn, getDaysInMonth(yn, mn));
      setDay(clampedDay.toString());
      commit(month, clampedDay.toString(), v);
    } else {
      commit(month, day, v);
    }
  };

  return (
    <fieldset
      id={id}
      className={cn("m-0 flex min-w-0 gap-2 border-0 p-0", className)}
      aria-label="Birthday"
      disabled={disabled}
    >
      <Select value={month} onValueChange={handleMonthChange}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder="Month">
            {(value) =>
              value != null && value !== ""
                ? (MONTHS.find((m) => m.value === value)?.label ?? String(value))
                : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={day} onValueChange={handleDayChange}>
        <SelectTrigger className="w-20 shrink-0">
          <SelectValue placeholder="Day">
            {(value) => (value != null && value !== "" ? String(value) : null)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d.toString()}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={year}
        onChange={handleYearChange}
        placeholder="Year"
        className="w-24 shrink-0"
      />
    </fieldset>
  );
}
