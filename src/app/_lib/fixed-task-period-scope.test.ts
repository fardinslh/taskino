import { describe, expect, it } from "vitest";

import type { FixedTask } from "@/lib/api";
import {
  filterFixedTasksByRecurrencePeriods,
  fixedTaskMatchesPeriodScope,
  mergeFixedTaskPeriodScopes,
  withFixedTaskPeriodScope,
} from "./fixed-task-period-scope";

const task: FixedTask = {
  _id: "fixed-task-1",
  recurrence: "daily",
  status: "done",
  title: "Completed report",
};

describe("fixed-task request period scopes", () => {
  it("keeps each recurrence inside its own period after one broad request", () => {
    const reports: FixedTask[] = [
      { ...task, startDate: "2026-07-17T08:00:00.000Z" },
      { ...task, _id: "fixed-task-2", startDate: "2026-07-16T08:00:00.000Z" },
      {
        ...task,
        _id: "fixed-task-3",
        recurrence: "weekly",
        startDate: "2026-07-13T08:00:00.000Z",
      },
      {
        ...task,
        _id: "fixed-task-4",
        recurrence: "monthly",
        startDate: "2026-07-02T08:00:00.000Z",
      },
    ];

    expect(
      filterFixedTasksByRecurrencePeriods(reports, {
        daily: {
          from: "2026-07-17T00:00:00.000Z",
          to: "2026-07-17T23:59:59.999Z",
        },
        weekly: {
          from: "2026-07-11T00:00:00.000Z",
          to: "2026-07-17T23:59:59.999Z",
        },
        monthly: {
          from: "2026-07-01T00:00:00.000Z",
          to: "2026-07-31T23:59:59.999Z",
        },
      }),
    ).toEqual([reports[0], reports[2], reports[3]]);
  });

  it("matches a completed task only to the request that returned it", () => {
    const weeklyResult = withFixedTaskPeriodScope(task, "weekly");

    expect(fixedTaskMatchesPeriodScope(weeklyResult, "weekly")).toBe(true);
    expect(fixedTaskMatchesPeriodScope(weeklyResult, "daily")).toBe(false);
  });

  it("merges scopes when overlapping requests return the same item", () => {
    const merged = mergeFixedTaskPeriodScopes(
      withFixedTaskPeriodScope(task, "weekly"),
      withFixedTaskPeriodScope(task, "monthly"),
    );

    expect(fixedTaskMatchesPeriodScope(merged, "weekly")).toBe(true);
    expect(fixedTaskMatchesPeriodScope(merged, "monthly")).toBe(true);
    expect(fixedTaskMatchesPeriodScope(merged, "daily")).toBe(false);
  });

  it("uses recurrence for active items without request metadata", () => {
    const activeTask: FixedTask = { ...task, status: "todo" };

    expect(fixedTaskMatchesPeriodScope(activeTask, "daily")).toBe(true);
    expect(fixedTaskMatchesPeriodScope(activeTask, "weekly")).toBe(false);
  });
});
