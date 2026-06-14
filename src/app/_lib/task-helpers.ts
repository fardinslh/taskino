import { getId, type FixedTask, type IncompleteFixedTask, type Task, type User } from "@/lib/api";
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
  const m: Record<string, string> = { todo: "در انتظار", in_progress: "در حال انجام", done: "تکمیل شده", pending: "در انتظار", completed: "تکمیل شده" };
  return m[s ?? ""] ?? s ?? "نامشخص";
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

export function recurrenceLabel(value?: FixedTask["recurrence"]) {
  return TASK_PERIODS.find(([period]) => period === value)?.[1] ?? "ثابت";
}

