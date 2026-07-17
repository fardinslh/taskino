import type {
  FixedTaskRecurrence,
  FixedTaskScheduleConfig,
} from "@/lib/api";
import DateObject from "react-date-object";
import jalali from "react-date-object/calendars/jalali";

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
  endDate.setDate(endDate.getDate() + 1);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function nextWeekdayStart(now: Date, weekdays: number[]) {
  const startDate = startOfDay(now);
  const nextOffset = Math.min(
    ...weekdays.map((weekday) => (weekday - startDate.getDay() + 7) % 7),
  );
  startDate.setDate(startDate.getDate() + nextOffset);
  return startDate;
}

function nextMonthlyStart(now: Date, monthDays: number[]) {
  const todayStart = startOfDay(now);
  const today = new DateObject({ calendar: jalali, date: todayStart });
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

      const candidateDate = startOfDay(candidate.toDate());
      if (candidateDate >= todayStart) return candidateDate;
    }
  }

  throw new Error("No valid monthly report date found");
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
