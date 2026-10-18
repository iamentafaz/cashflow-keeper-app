import { endOfMonth, endOfYear, format, isValid, parseISO, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns";
import type { ReportPeriod, ReportRange } from "@/types/reporting";

function dateValue(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function customDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : fallback;
}

function previousPeriod(start: Date, end: Date) {
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const compareEnd = subDays(start, 1);
  return { compareStart: subDays(compareEnd, days - 1), compareEnd };
}

export function getReportPeriod(range: ReportRange, customStart?: string, customEnd?: string, today = new Date()): ReportPeriod {
  const end = today;

  if (range === "all") {
    return { start: null, end: dateValue(end), compareStart: null, compareEnd: null, label: "All time" };
  }

  if (range === "custom") {
    const fallbackStart = startOfMonth(end);
    const start = customDate(customStart, fallbackStart);
    const resolvedEnd = customDate(customEnd, end);
    const orderedStart = start <= resolvedEnd ? start : resolvedEnd;
    const orderedEnd = start <= resolvedEnd ? resolvedEnd : start;
    const previous = previousPeriod(orderedStart, orderedEnd);
    return {
      start: dateValue(orderedStart),
      end: dateValue(orderedEnd),
      compareStart: dateValue(previous.compareStart),
      compareEnd: dateValue(previous.compareEnd),
      label: `${format(orderedStart, "dd MMM yyyy")} – ${format(orderedEnd, "dd MMM yyyy")}`,
    };
  }

  if (range === "month") {
    const start = startOfMonth(end);
    const previous = previousPeriod(start, end);
    return { start: dateValue(start), end: dateValue(end), compareStart: dateValue(previous.compareStart), compareEnd: dateValue(previous.compareEnd), label: "This month" };
  }

  if (range === "quarter") {
    const start = startOfMonth(subMonths(end, 2));
    const previous = previousPeriod(start, end);
    return { start: dateValue(start), end: dateValue(end), compareStart: dateValue(previous.compareStart), compareEnd: dateValue(previous.compareEnd), label: "Last 3 months" };
  }

  const start = startOfYear(end);
  const previous = previousPeriod(start, end);
  return { start: dateValue(start), end: dateValue(end), compareStart: dateValue(previous.compareStart), compareEnd: dateValue(previous.compareEnd), label: "This year" };
}

export function reportMetricDelta(current: number, previous: number | undefined) {
  if (previous == null) return null;
  const absolute = current - previous;
  return { absolute, percentage: previous === 0 ? null : (absolute / Math.abs(previous)) * 100 };
}

export function formatReportDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : value;
}

export function formatReportMonth(value: string) {
  const parsed = parseISO(`${value}-01`);
  return isValid(parsed) ? format(parsed, "MMM yy") : value;
}

export function accountIsLiability(type: string) {
  return type === "credit_card";
}
