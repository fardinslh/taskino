import type { FixedTask } from "@/lib/api";

export function elapsedDurationMinutes(
  startedAt?: string | null,
  now = Date.now(),
) {
  if (!startedAt) return undefined;
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return undefined;
  return Math.max(1, Math.ceil((now - start) / 60000));
}

export function fixedTaskFirstOverdueActualDurationMinutes(
  task: Pick<
    FixedTask,
    | "actualDurationMinutes"
    | "approvedDurationInMinutes"
    | "approvedDurationMinutes"
    | "startedAt"
    | "status"
  >,
  now = Date.now(),
) {
  if (task.status !== "in_progress") return undefined;
  if (task.actualDurationMinutes != null) return undefined;

  const approvedDurationMinutes =
    task.approvedDurationMinutes ?? task.approvedDurationInMinutes;
  if (approvedDurationMinutes == null || approvedDurationMinutes <= 0) {
    return undefined;
  }

  const elapsed = elapsedDurationMinutes(task.startedAt, now);
  if (elapsed == null || elapsed <= approvedDurationMinutes) return undefined;
  return elapsed;
}

export function isFixedTaskDurationOverdue(
  task: Pick<
    FixedTask,
    | "actualDurationMinutes"
    | "approvedDurationInMinutes"
    | "approvedDurationMinutes"
    | "startedAt"
    | "status"
  >,
  now = Date.now(),
) {
  return fixedTaskDurationOverdueMinutes(task, now) != null;
}

export function fixedTaskDurationOverdueMinutes(
  task: Pick<
    FixedTask,
    | "actualDurationMinutes"
    | "approvedDurationInMinutes"
    | "approvedDurationMinutes"
    | "startedAt"
    | "status"
  >,
  now = Date.now(),
) {
  const approvedDurationMinutes =
    task.approvedDurationMinutes ?? task.approvedDurationInMinutes;
  if (approvedDurationMinutes == null || approvedDurationMinutes <= 0) {
    return undefined;
  }

  const durationMinutes =
    task.actualDurationMinutes ??
    (task.status === "in_progress"
      ? elapsedDurationMinutes(task.startedAt, now)
      : undefined);

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
