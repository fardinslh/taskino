import { describe, expect, it } from "vitest";

import {
  elapsedDurationMinutes,
  fixedTaskFirstOverdueActualDurationMinutes,
} from "./fixed-task-timing";

const startedAt = "2026-07-10T10:00:00.000Z";

function minutesAfterStart(minutes: number) {
  return new Date(Date.parse(startedAt) + minutes * 60000).getTime();
}

describe("fixed-task timing", () => {
  it("rounds elapsed duration up to the current minute", () => {
    expect(elapsedDurationMinutes(startedAt, minutesAfterStart(15))).toBe(15);
    expect(
      elapsedDurationMinutes(startedAt, minutesAfterStart(15) + 1000),
    ).toBe(16);
  });

  it("does not mark tasks overdue before the approved duration is passed", () => {
    expect(
      fixedTaskFirstOverdueActualDurationMinutes(
        {
          status: "in_progress",
          startedAt,
          approvedDurationMinutes: 15,
        },
        minutesAfterStart(15),
      ),
    ).toBeUndefined();
  });

  it("returns the first overdue actual duration", () => {
    expect(
      fixedTaskFirstOverdueActualDurationMinutes(
        {
          status: "in_progress",
          startedAt,
          approvedDurationMinutes: 15,
        },
        minutesAfterStart(16),
      ),
    ).toBe(16);
  });

  it("keeps returning the current elapsed duration until the first sync is saved", () => {
    expect(
      fixedTaskFirstOverdueActualDurationMinutes(
        {
          status: "in_progress",
          startedAt,
          approvedDurationMinutes: 15,
        },
        minutesAfterStart(18),
      ),
    ).toBe(18);
  });

  it("does not emit an overdue duration after actual duration is recorded", () => {
    expect(
      fixedTaskFirstOverdueActualDurationMinutes(
        {
          status: "in_progress",
          startedAt,
          approvedDurationMinutes: 15,
          actualDurationMinutes: 16,
        },
        minutesAfterStart(18),
      ),
    ).toBeUndefined();
  });

  it("requires an in-progress task with a valid timer and approved duration", () => {
    expect(
      fixedTaskFirstOverdueActualDurationMinutes({
        status: "todo",
        startedAt,
        approvedDurationMinutes: 15,
      }),
    ).toBeUndefined();
    expect(
      fixedTaskFirstOverdueActualDurationMinutes({
        status: "in_progress",
        approvedDurationMinutes: 15,
      }),
    ).toBeUndefined();
    expect(
      fixedTaskFirstOverdueActualDurationMinutes({
        status: "in_progress",
        startedAt,
      }),
    ).toBeUndefined();
  });
});
