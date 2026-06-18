import {
  getId,
  type FixedTask,
  type IncompleteFixedTask,
  type Notification,
  type Task,
  type User,
} from "@/lib/api";
import { TASK_PERIODS, WORK_FIELDS, type TaskPeriod } from "./task-constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function userName(user?: User | string) {
  if (!user) return "نامشخص";
  if (typeof user === "string") return user;
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.mobile || user.email || getId(user);
}

export function initials(user?: User | string) {
  const n = userName(user);
  if (!n || n === "نامشخص") return "؟";
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function statusLabel(s?: string) {
  const m: Record<string, string> = {
    todo: "در انتظار",
    in_progress: "در حال انجام",
    done: "تکمیل شده",
    pending: "در انتظار",
    approved: "تأیید شد",
    completed: "تکمیل شده",
    rejected: "رد شد",
  };
  return m[s ?? ""] ?? s ?? "نامشخص";
}

export function roleLabel(role?: string) {
  const m: Record<string, string> = {
    specialist: "متخصص",
    supervisor: "سرپرست",
    manager: "مدیر",
  };
  return m[role ?? ""] ?? role ?? "نامشخص";
}

export function workFieldLabel(field?: string) {
  return WORK_FIELDS.find(([value]) => value === field)?.[1] ?? field ?? "عملیات";
}

export function nextStatus(s?: string) {
  if (s === "todo") return "in_progress";
  if (s === "in_progress") return "done";
  return "todo";
}

export function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(d));
  } catch {
    return d;
  }
}

export function taskDate(task: Task) {
  const rawDate = task.dueDate || task.createdAt;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isTaskInPeriod(task: Task, period: TaskPeriod) {
  const date = taskDate(task);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = start.getDay();
    const daysFromSaturday = (day + 1) % 7;
    start.setDate(start.getDate() - daysFromSaturday);
  }

  if (period === "monthly") {
    start.setDate(1);
  }

  const end = new Date(start);
  if (period === "daily") end.setDate(start.getDate() + 1);
  if (period === "weekly") end.setDate(start.getDate() + 7);
  if (period === "monthly") end.setMonth(start.getMonth() + 1);

  return date >= start && date < end;
}

export function isUnassignedTask(task: Task) {
  return (task.assignedTo ?? []).length === 0;
}

export function fixedTaskDate(item: IncompleteFixedTask) {
  const rawDate = item.deadline || item.periodEnd || item.nextRunAt || item.createdAt;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFixedTaskInPeriod(item: IncompleteFixedTask, period: TaskPeriod) {
  const date = fixedTaskDate(item);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = start.getDay();
    const daysFromSaturday = (day + 1) % 7;
    start.setDate(start.getDate() - daysFromSaturday);
  }

  if (period === "monthly") {
    start.setDate(1);
  }

  const end = new Date(start);
  if (period === "daily") end.setDate(start.getDate() + 1);
  if (period === "weekly") end.setDate(start.getDate() + 7);
  if (period === "monthly") end.setMonth(start.getMonth() + 1);

  return date >= start && date < end;
}

export function isFixedTaskOverdue(item: Pick<FixedTask, "endDate">) {
  if (!item.endDate) return false;
  const endDate = new Date(item.endDate);
  return !Number.isNaN(endDate.getTime()) && endDate < new Date();
}

export function notificationText(notification: Notification) {
  const title = notification.title?.trim() ?? "";
  const message = notification.message?.trim() ?? "";
  const titleMap: Record<string, string> = {
    "Fixed Task Assigned": "گزارش ثابت جدید",
    "Task Assigned": "گزارش جدید",
    "Task Status Updated": "وضعیت گزارش تغییر کرد",
    "Fixed Task Status Updated": "وضعیت گزارش ثابت تغییر کرد",
    "Task Completed": "گزارش تکمیل شد",
    "Fixed Task Completed": "گزارش ثابت تکمیل شد",
  };

  let localizedMessage = message;
  const fixedTaskAssignment = message.match(
    /^You have been assigned to the fixed task\s*:?\s*(.*)$/i,
  );
  const taskAssignment = message.match(
    /^You have been assigned to the task\s*:?\s*(.*)$/i,
  );
  const taskStatusChanged = message.match(
    /^The task\s*:?\s*["«]?(.*?)["»]?\s+status changed to\s+(.+?)\.?$/i,
  );
  const fixedTaskStatusChanged = message.match(
    /^The fixed task\s*:?\s*["«]?(.*?)["»]?\s+status changed to\s+(.+?)\.?$/i,
  );
  const genericCompleted = message.match(
    /^(.+?)\s+has been completed(?:\s+by\s+(.+?))?\.?$/i,
  );
  const taskCompleted =
    message.match(
      /^The task\s*:?\s*["Â«]?(.*?)["Â»]?\s+has been completed(?:\s+by\s+(.+?))?\.?$/i,
    ) ?? (title === "Task Completed" ? genericCompleted : null);
  const fixedTaskCompleted =
    message.match(/^The fixed task\s*:?\s*["«]?(.*?)["»]?\s+has been completed(?:\s+by\s+(.+?))?\.?$/i) ??
    (title === "Fixed Task Completed" ? genericCompleted : null);

  if (fixedTaskAssignment) {
    localizedMessage = fixedTaskAssignment[1]
      ? `گزارش ثابت «${fixedTaskAssignment[1]}» به شما اختصاص داده شد.`
      : "یک گزارش ثابت به شما اختصاص داده شد.";
  } else if (taskAssignment) {
    localizedMessage = taskAssignment[1]
      ? `گزارش «${taskAssignment[1]}» به شما اختصاص داده شد.`
      : "یک گزارش به شما اختصاص داده شد.";
  } else if (fixedTaskStatusChanged) {
    const taskName = fixedTaskStatusChanged[1]?.trim();
    const status = statusLabel(fixedTaskStatusChanged[2]?.trim());
    localizedMessage = taskName
      ? `وضعیت گزارش ثابت «${taskName}» به «${status}» تغییر کرد.`
      : `وضعیت یک گزارش ثابت به «${status}» تغییر کرد.`;
  } else if (taskStatusChanged) {
    const taskName = taskStatusChanged[1]?.trim();
    const status = statusLabel(taskStatusChanged[2]?.trim());
    localizedMessage = taskName
      ? `وضعیت گزارش «${taskName}» به «${status}» تغییر کرد.`
      : `وضعیت یک گزارش به «${status}» تغییر کرد.`;
  } else if (taskCompleted) {
    const taskName = taskCompleted[1]?.trim();
    const actor = taskCompleted[2]?.trim();
    localizedMessage = taskName
      ? actor
        ? `گزارش «${taskName}» توسط ${actor} تکمیل شد.`
        : `گزارش «${taskName}» تکمیل شد.`
      : "یک گزارش تکمیل شد.";
  } else if (fixedTaskCompleted) {
    const taskName = fixedTaskCompleted[1]?.trim();
    const actor = fixedTaskCompleted[2]?.trim();
    localizedMessage = taskName
      ? actor
        ? `گزارش ثابت «${taskName}» توسط ${actor} تکمیل شد.`
        : `گزارش ثابت «${taskName}» تکمیل شد.`
      : "یک گزارش ثابت تکمیل شد.";
  }

  return {
    title: (titleMap[title] ?? title) || "اعلان جدید",
    message: localizedMessage,
  };
}

export function recurrenceLabel(value?: FixedTask["recurrence"]) {
  return TASK_PERIODS.find(([period]) => period === value)?.[1] ?? "ثابت";
}
