import { describe, expect, it } from "vitest";

import type { FixedTask } from "@/lib/api";
import { fixedTaskOccurrenceKey } from "./fixed-task-identity";

function doneTask(doneTime: string): FixedTask {
  return {
    _id: "fixed-task-1",
    doneTime,
    recurrence: "daily",
    status: "done",
    title: "Daily report",
  };
}

describe("fixed-task occurrence identity", () => {
  it("keeps separate completions of the same recurring task", () => {
    expect(fixedTaskOccurrenceKey(doneTask("2026-06-29T10:00:00.000Z")))
      .not.toBe(
        fixedTaskOccurrenceKey(doneTask("2026-06-30T10:00:00.000Z")),
      );
  });

  it("matches the same completion returned by overlapping ranges", () => {
    const task = doneTask("2026-06-30T10:00:00.000Z");

    expect(fixedTaskOccurrenceKey(task)).toBe(
      fixedTaskOccurrenceKey({ ...task }),
    );
  });

  it("distinguishes an active occurrence from a completed occurrence", () => {
    expect(
      fixedTaskOccurrenceKey({
        _id: "fixed-task-1",
        recurrence: "daily",
        status: "todo",
        title: "Daily report",
      }),
    ).not.toBe(
      fixedTaskOccurrenceKey(doneTask("2026-06-30T10:00:00.000Z")),
    );
  });
});
