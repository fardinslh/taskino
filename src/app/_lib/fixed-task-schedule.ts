import type {
  FixedTaskRecurrence,
  FixedTaskScheduleConfig,
} from "@/lib/api";

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
    ? { monthDays: uniqueSorted(monthDays) }
    : { weekdays: uniqueSorted(weekdays) };
}
