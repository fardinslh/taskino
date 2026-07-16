import type { FixedTask } from "@/lib/api";

export function isFixedTaskDurationOverdue(
  task: Pick<
    FixedTask,
    | "actualDurationMinutes"
    | "approvedDurationInMinutes"
    | "approvedDurationMinutes"
  >,
) {
  return fixedTaskDurationOverdueMinutes(task) != null;
}

export function fixedTaskDurationOverdueMinutes(
  task: Pick<
    FixedTask,
    | "actualDurationMinutes"
    | "approvedDurationInMinutes"
    | "approvedDurationMinutes"
  >,
) {
  const approvedDurationMinutes =
    task.approvedDurationMinutes ?? task.approvedDurationInMinutes;
  if (approvedDurationMinutes == null || approvedDurationMinutes <= 0) {
    return undefined;
  }

  const durationMinutes = task.actualDurationMinutes;

  if (durationMinutes == null || durationMinutes <= approvedDurationMinutes) {
    return undefined;
  }

  return durationMinutes;
}

export function formatDurationMinutes(minutes?: number | null) {
  if (minutes == null) return "";
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (hours && remainingMinutes) {
    return `${hours} ساعت و ${remainingMinutes} دقیقه`;
  }
  if (hours) return `${hours} ساعت`;
  return `${remainingMinutes} دقیقه`;
}
