import { describe, expect, it } from "vitest";

import {
  buildFixedTaskScheduleConfig,
  getFixedTaskScheduleValues,
  initialFixedTaskDateRange,
  isFixedTaskScheduleValid,
} from "./fixed-task-schedule";

describe("fixed-task scheduling", () => {
  it("uses the documented recurrence defaults", () => {
    expect(getFixedTaskScheduleValues("daily")).toEqual({
      weekdays: [6, 0, 1, 2, 3, 4],
      monthDays: [1],
    });
    expect(getFixedTaskScheduleValues("weekly").weekdays).toEqual([6]);
    expect(getFixedTaskScheduleValues("monthly").monthDays).toEqual([1]);
  });

  it("hydrates an existing schedule for editing", () => {
    expect(
      getFixedTaskScheduleValues("weekly", { weekdays: [6, 1, 3] }),
    ).toEqual({
      weekdays: [6, 1, 3],
      monthDays: [1],
    });
    expect(
      getFixedTaskScheduleValues("monthly", { monthDays: [2, 20] }).monthDays,
    ).toEqual([2, 20]);
  });

  it("validates only the schedule used by the recurrence", () => {
    expect(isFixedTaskScheduleValid("daily", [6, 0], [])).toBe(true);
    expect(isFixedTaskScheduleValid("weekly", [], [1])).toBe(false);
    expect(isFixedTaskScheduleValid("monthly", [], [2, 20])).toBe(true);
    expect(isFixedTaskScheduleValid("monthly", [6], [0, 32])).toBe(false);
  });

  it("builds a numeric, recurrence-specific payload", () => {
    expect(buildFixedTaskScheduleConfig("weekly", [6, 1, 3, 1], [2])).toEqual({
      weekdays: [1, 3, 6],
      monthDays: [],
    });
    expect(buildFixedTaskScheduleConfig("monthly", [6], [20, 2, 20])).toEqual({
      weekdays: [],
      monthDays: [2, 20],
    });
  });

  it("starts daily reports today when today is selected", () => {
    const saturday = new Date(2026, 6, 18, 14, 30);

    expect(
      initialFixedTaskDateRange("daily", { weekdays: [6, 0, 1, 2, 3, 4] }, saturday),
    ).toEqual({
      startDate: new Date(2026, 6, 18).toISOString(),
      endDate: new Date(2026, 6, 19).toISOString(),
    });
  });

  it("moves weekly reports to the next selected weekday", () => {
    const saturday = new Date(2026, 6, 18, 14, 30);

    expect(
      initialFixedTaskDateRange("weekly", { weekdays: [1, 3] }, saturday),
    ).toEqual({
      startDate: new Date(2026, 6, 20).toISOString(),
      endDate: new Date(2026, 6, 21).toISOString(),
    });
  });

  it("moves passed Jalali month days to the next valid month", () => {
    const twentySixthOfTir = new Date(2026, 6, 17, 14, 30);

    expect(
      initialFixedTaskDateRange(
        "monthly",
        { monthDays: [17, 21] },
        twentySixthOfTir,
      ),
    ).toEqual({
      startDate: new Date(2026, 7, 8).toISOString(),
      endDate: new Date(2026, 7, 9).toISOString(),
    });
  });
});
