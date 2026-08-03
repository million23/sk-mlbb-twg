"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
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
const YEAR_MAX_LENGTH = 4;

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

function parseNum(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? null : n;
}

function parseValue(value: string | undefined): {
  year: string;
  month: string;
  day: string;
} {
  if (!value?.trim()) return { year: "", month: "", day: "" };
  // Parse YYYY-MM-DD without Date() timezone shifts.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m?.[1] && m[2] && m[3]) {
    return {
      year: m[1],
      month: String(Number(m[2])),
      day: String(Number(m[3])),
    };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { year: "", month: "", day: "" };
  return {
    year: d.getFullYear().toString(),
    month: (d.getMonth() + 1).toString(),
    day: d.getDate().toString(),
  };
}

export function BirthdayPicker({
  value,
  onChange,
  id,
  className,
  disabled,
}: BirthdayPickerProps) {
  const parsed = React.useMemo(() => parseValue(value), [value]);

  const [month, setMonth] = React.useState(parsed.month);
  const [day, setDay] = React.useState(parsed.day);
  const [year, setYear] = React.useState(parsed.year);

  /** Last value we pushed via onChange — distinguishes our clears from external resets. */
  const lastCommittedRef = React.useRef(value?.trim() ?? "");

  React.useEffect(() => {
    const next = value?.trim() ?? "";
    if (next === lastCommittedRef.current) return;
    lastCommittedRef.current = next;
    const p = parseValue(next);
    setMonth(p.month);
    setDay(p.day);
    setYear(p.year);
  }, [value]);

  const daysInMonth = React.useMemo(() => {
    const y = parseNum(year) ?? currentYear;
    const m = parseNum(month) ?? 1;
    return getDaysInMonth(y, m);
  }, [year, month]);

  const days = React.useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const commit = React.useCallback(
    (m: string, d: string, y: string) => {
      const mn = parseNum(m);
      const dn = parseNum(d);
      const yn = parseNum(y);
      const yearComplete = y.trim().length === YEAR_MAX_LENGTH;

      const valid =
        mn !== null &&
        dn !== null &&
        yn !== null &&
        yearComplete &&
        mn >= 1 &&
        mn <= 12 &&
        dn >= 1 &&
        dn <= getDaysInMonth(yn, mn) &&
        yn >= MIN_YEAR &&
        yn <= MAX_YEAR;

      if (!valid) {
        if (lastCommittedRef.current) {
          lastCommittedRef.current = "";
          onChange?.("");
        }
        return;
      }

      const next = toYYYYMMDD(yn, mn, dn);
      if (next === lastCommittedRef.current) return;
      lastCommittedRef.current = next;
      onChange?.(next);
    },
    [onChange],
  );

  const handleMonthChange = (v: string | null) => {
    const next = v ?? "";
    setMonth(next);
    const dn = parseNum(day);
    const yn = parseNum(year);
    const mn = parseNum(next);
    if (mn !== null && dn !== null && yn !== null && year.length === YEAR_MAX_LENGTH) {
      const clampedDay = Math.min(dn, getDaysInMonth(yn, mn));
      setDay(clampedDay.toString());
      commit(next, clampedDay.toString(), year);
    } else {
      commit(next, day, year);
    }
  };

  const handleDayChange = (v: string | null) => {
    const next = v ?? "";
    setDay(next);
    commit(month, next, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, YEAR_MAX_LENGTH);
    setYear(v);
    const dn = parseNum(day);
    const yn = parseNum(v);
    const mn = parseNum(month);
    if (
      yn !== null &&
      dn !== null &&
      mn !== null &&
      v.length === YEAR_MAX_LENGTH
    ) {
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
            {(selected) =>
              selected != null && selected !== ""
                ? (MONTHS.find((m) => m.value === selected)?.label ??
                  String(selected))
                : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={day} onValueChange={handleDayChange}>
        <SelectTrigger className="w-20 shrink-0">
          <SelectValue placeholder="Day">
            {(selected) =>
              selected != null && selected !== "" ? String(selected) : null
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {days.map((d) => (
              <SelectItem key={d} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={year}
        onChange={handleYearChange}
        placeholder="Year"
        maxLength={YEAR_MAX_LENGTH}
        className="w-24 shrink-0 tabular-nums"
        autoComplete="bday-year"
      />
    </fieldset>
  );
}
