import { describe, expect, it } from "vitest";

import {
  fixedTaskDurationOverdueMinutes,
  formatDurationMinutes,
  isFixedTaskDurationOverdue,
} from "./fixed-task-timing";

describe("fixed-task timing", () => {
  it("detects saved actual durations that exceeded the approved duration", () => {
    expect(
      isFixedTaskDurationOverdue({
        approvedDurationMinutes: 15,
        actualDurationMinutes: 16,
      }),
    ).toBe(true);
    expect(
      isFixedTaskDurationOverdue({
        approvedDurationMinutes: 15,
        actualDurationMinutes: 15,
      }),
    ).toBe(false);
  });

  it("returns the saved overdue duration", () => {
    expect(
      fixedTaskDurationOverdueMinutes({
        approvedDurationMinutes: 15,
        actualDurationMinutes: 16,
      }),
    ).toBe(16);
  });

  it("formats minute and hour durations", () => {
    expect(formatDurationMinutes(45)).toBe("45 دقیقه");
    expect(formatDurationMinutes(60)).toBe("1 ساعت");
    expect(formatDurationMinutes(75)).toBe("1 ساعت و 15 دقیقه");
  });
});
