import { describe, expect, it } from "vitest";

import type { FixedTask } from "@/lib/api";
import {
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
