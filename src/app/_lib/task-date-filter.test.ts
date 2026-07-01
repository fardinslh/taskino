import { describe, expect, it } from "vitest";

import type { Task } from "@/lib/api";
import { isTaskVisibleOnDate } from "./task-date-filter";

const baseTask: Task = {
  _id: "task-1",
  title: "Project",
};

describe("project date filtering", () => {
  it("hides an open project after its deadline", () => {
    const task = {
      ...baseTask,
      dueDate: "2026-06-30T17:00:00",
      status: "in_progress",
    };

    expect(isTaskVisibleOnDate(task, new Date(2026, 6, 1, 12))).toBe(false);
  });

  it("finds an old project by selecting its date", () => {
    const task = {
      ...baseTask,
      dueDate: "2026-06-30T17:00:00",
      status: "todo",
    };

    expect(isTaskVisibleOnDate(task, new Date(2026, 5, 30, 12))).toBe(true);
  });

  it("shows a project on every day within its date range", () => {
    const task = {
      ...baseTask,
      dueDate: "2026-07-03T17:00:00",
      startDate: "2026-06-29T08:00:00",
    };

    expect(isTaskVisibleOnDate(task, new Date(2026, 6, 1, 12))).toBe(true);
  });

  it("keeps undated projects visible", () => {
    expect(isTaskVisibleOnDate(baseTask, new Date(2026, 6, 1, 12))).toBe(true);
  });
});
