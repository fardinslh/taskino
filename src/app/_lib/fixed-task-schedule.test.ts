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
      startDate: "2026-07-18T00:00:00+03:30",
      endDate: "2026-07-19T00:00:00+03:30",
    });
  });

  it("moves weekly reports to the next selected weekday", () => {
    const saturday = new Date(2026, 6, 18, 14, 30);

    expect(
      initialFixedTaskDateRange("weekly", { weekdays: [1, 3] }, saturday),
    ).toEqual({
      startDate: "2026-07-20T00:00:00+03:30",
      endDate: "2026-07-21T00:00:00+03:30",
    });
  });

  it("uses the first selected day of next month when all selected days passed", () => {
    const twentyFifthOfTir = new Date("2026-07-16T10:30:00.000Z");

    expect(
      initialFixedTaskDateRange(
        "monthly",
        { monthDays: [1, 5, 14] },
        twentyFifthOfTir,
      ),
    ).toEqual({
      startDate: "2026-07-23T00:00:00+03:30",
      endDate: "2026-07-24T00:00:00+03:30",
    });
  });

  it("uses today when today and an earlier monthly day are selected", () => {
    const twentySixthOfTir = new Date("2026-07-17T10:30:00.000Z");

    expect(
      initialFixedTaskDateRange(
        "monthly",
        { monthDays: [1, 26] },
        twentySixthOfTir,
      ),
    ).toEqual({
      startDate: "2026-07-17T00:00:00+03:30",
      endDate: "2026-07-18T00:00:00+03:30",
    });
  });
});
