import type { FixedTask } from "@/lib/api";

export function fixedTaskOccurrenceKey(task: FixedTask) {
  const id = task._id ?? task.id ?? "";
  if (!id) return "";

  if (task.status !== "done") {
    return `${id}:${task.status ?? "todo"}`;
  }

  const occurrenceDate =
    task.doneTime ??
    task.updatedAt ??
    task.endDate ??
    task.nextRunAt ??
    "";

  return `${id}:done:${occurrenceDate}`;
}
