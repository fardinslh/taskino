import type { FixedTaskRecurrence } from "@/lib/api";
import DateObject from "react-date-object";
import jalali from "react-date-object/calendars/jalali";

export function getCurrentFixedTaskPeriodRange(
  recurrence: FixedTaskRecurrence,
  now = new Date(),
) {
  if (recurrence === "monthly") {
    const jalaliDate = new DateObject({ calendar: jalali, date: now });
    const from = new DateObject(jalaliDate)
      .setDay(1)
      .setHour(0)
      .setMinute(0)
      .setSecond(0)
      .setMillisecond(0);
    const to = new DateObject(from)
      .setMonth(from.month.number + 1)
      .setDay(0)
      .setHour(23)
      .setMinute(59)
      .setSecond(59)
      .setMillisecond(999);

    return {
      from: from.toDate().toISOString(),
      to: to.toDate().toISOString(),
    };
  }

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (recurrence === "weekly") {
    const daysFromSaturday = (from.getDay() + 1) % 7;
    from.setDate(from.getDate() - daysFromSaturday);
  }

  const to = new Date(from);
  if (recurrence === "daily") {
    to.setHours(23, 59, 59, 999);
  } else if (recurrence === "weekly") {
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
