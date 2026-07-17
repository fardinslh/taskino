import type {
  FixedTaskRecurrence,
  FixedTaskScheduleConfig,
} from "@/lib/api";
import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import jalali from "react-date-object/calendars/jalali";

const TEHRAN_TIME_ZONE = "Asia/Tehran";
const TEHRAN_UTC_OFFSET = "+03:30";

export const DEFAULT_DAILY_WEEKDAYS = [6, 0, 1, 2, 3, 4];
export const DEFAULT_WEEKLY_WEEKDAYS = [6];
export const DEFAULT_MONTH_DAYS = [1];

export function getFixedTaskScheduleValues(
  recurrence: FixedTaskRecurrence,
  scheduleConfig?: FixedTaskScheduleConfig,
) {
  return {
    weekdays:
      scheduleConfig?.weekdays?.length
        ? [...scheduleConfig.weekdays]
        : recurrence === "weekly"
          ? [...DEFAULT_WEEKLY_WEEKDAYS]
          : [...DEFAULT_DAILY_WEEKDAYS],
    monthDays: scheduleConfig?.monthDays?.length
      ? [...scheduleConfig.monthDays]
      : [...DEFAULT_MONTH_DAYS],
  };
}

export function isFixedTaskScheduleValid(
  recurrence: FixedTaskRecurrence,
  weekdays: number[],
  monthDays: number[],
) {
  return recurrence === "monthly"
    ? monthDays.length > 0 &&
        monthDays.every((day) => Number.isInteger(day) && day >= 1 && day <= 31)
    : weekdays.length > 0 &&
        weekdays.every(
          (day) => Number.isInteger(day) && day >= 0 && day <= 6,
        );
}

export function buildFixedTaskScheduleConfig(
  recurrence: FixedTaskRecurrence,
  weekdays: number[],
  monthDays: number[],
): FixedTaskScheduleConfig {
  const uniqueSorted = (values: number[]) =>
    [...new Set(values)].sort((a, b) => a - b);

  return recurrence === "monthly"
    ? { weekdays: [], monthDays: uniqueSorted(monthDays) }
    : { weekdays: uniqueSorted(weekdays), monthDays: [] };
}

export function initialFixedTaskDateRange(
  recurrence: FixedTaskRecurrence,
  scheduleConfig?: FixedTaskScheduleConfig,
  now = new Date(),
) {
  const schedule = getFixedTaskScheduleValues(recurrence, scheduleConfig);
  const startDate =
    recurrence === "monthly"
      ? nextMonthlyStart(now, schedule.monthDays)
      : nextWeekdayStart(now, schedule.weekdays);

  const endDate = new Date(startDate);
  const startParts = getTehranDateParts(startDate);
  const nextDay = addGregorianDays(startParts, 1);
  endDate.setTime(tehranMidnight(nextDay).getTime());

  return {
    startDate: formatTehranMidnight(startDate),
    endDate: formatTehranMidnight(endDate),
  };
}

function nextWeekdayStart(now: Date, weekdays: number[]) {
  const today = getTehranDateParts(now);
  const weekday = new Date(
    Date.UTC(today.year, today.month - 1, today.day),
  ).getUTCDay();
  const nextOffset = Math.min(
    ...weekdays.map((selectedDay) => (selectedDay - weekday + 7) % 7),
  );
  return tehranMidnight(addGregorianDays(today, nextOffset));
}

function nextMonthlyStart(now: Date, monthDays: number[]) {
  const todayParts = getTehranDateParts(now);
  const today = new DateObject({
    calendar: gregorian,
    date: `${todayParts.year}/${todayParts.month}/${todayParts.day}`,
    format: "YYYY/M/D",
  }).convert(jalali);
  const sortedDays = [...monthDays].sort((a, b) => a - b);

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const monthStart = new DateObject(today)
      .setDay(1)
      .setMonth(today.month.number + monthOffset);
    const expectedYear = monthStart.year;
    const expectedMonth = monthStart.month.number;

    for (const day of sortedDays) {
      const candidate = new DateObject(monthStart).setDay(day);
      if (
        candidate.year !== expectedYear ||
        candidate.month.number !== expectedMonth
      ) {
        continue;
      }

      if (monthOffset === 0 && day < today.day) continue;

      const gregorianCandidate = new DateObject(candidate).convert(gregorian);
      return tehranMidnight({
        year: gregorianCandidate.year,
        month: gregorianCandidate.month.number,
        day: gregorianCandidate.day,
      });
    }
  }

  throw new Error("No valid monthly report date found");
}

type DateParts = { year: number; month: number; day: number };

function getTehranDateParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: value("year"), month: value("month"), day: value("day") };
}

function addGregorianDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function tehranMidnight(parts: DateParts) {
  return new Date(
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T00:00:00${TEHRAN_UTC_OFFSET}`,
  );
}

function formatTehranMidnight(date: Date) {
  const parts = getTehranDateParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T00:00:00${TEHRAN_UTC_OFFSET}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
