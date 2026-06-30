import { describe, expect, it } from "vitest";

import { getCurrentFixedTaskPeriodRange } from "./fixed-task-period-range";

function parseRange(recurrence: "daily" | "weekly" | "monthly") {
  const range = getCurrentFixedTaskPeriodRange(
    recurrence,
    new Date(2024, 4, 15, 12, 30, 45, 123),
  );
  return {
    from: new Date(range.from),
    to: new Date(range.to),
  };
}

function expectStartOfDay(date: Date) {
  expect([
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ]).toEqual([0, 0, 0, 0]);
}

function expectEndOfDay(date: Date) {
  expect([
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  ]).toEqual([23, 59, 59, 999]);
}

describe("current fixed-task period range", () => {
  it("covers the complete current day", () => {
    const { from, to } = parseRange("daily");

    expect([from.getFullYear(), from.getMonth(), from.getDate()]).toEqual([
      2024, 4, 15,
    ]);
    expect([to.getFullYear(), to.getMonth(), to.getDate()]).toEqual([
      2024, 4, 15,
    ]);
    expectStartOfDay(from);
    expectEndOfDay(to);
  });

  it("covers Saturday through Friday for the current week", () => {
    const { from, to } = parseRange("weekly");

    expect([
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      from.getDay(),
    ]).toEqual([2024, 4, 11, 6]);
    expect([
      to.getFullYear(),
      to.getMonth(),
      to.getDate(),
      to.getDay(),
    ]).toEqual([2024, 4, 17, 5]);
    expectStartOfDay(from);
    expectEndOfDay(to);
  });

  it("covers the complete current Jalali month", () => {
    const { from, to } = parseRange("monthly");

    expect([from.getFullYear(), from.getMonth(), from.getDate()]).toEqual([
      2024, 3, 20,
    ]);
    expect([to.getFullYear(), to.getMonth(), to.getDate()]).toEqual([
      2024, 4, 20,
    ]);
    expectStartOfDay(from);
    expectEndOfDay(to);
  });
});
