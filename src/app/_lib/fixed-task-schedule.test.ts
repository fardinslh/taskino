import { describe, expect, it } from "vitest";

import {
  buildFixedTaskScheduleConfig,
  getFixedTaskScheduleValues,
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
    });
    expect(buildFixedTaskScheduleConfig("monthly", [6], [20, 2, 20])).toEqual({
      monthDays: [2, 20],
    });
  });
});
