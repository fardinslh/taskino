import {
  getId,
  type WorkField,
  type FixedTask,
  type IncompleteFixedTask,
  type Notification,
  type Task,
  type User,
} from "../../lib/api";
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
    specialist: "کارشناس",
    supervisor: "سرپرست",
    manager: "مدیر",
  };
  return m[role ?? ""] ?? role ?? "نامشخص";
}

export function workFieldLabel(field?: string) {
  return (
    WORK_FIELDS.find(([value]) => value === field)?.[1] ??
    field ??
    "بهبود عملیات و برنامه ریزی"
  );
}

export function appTitleForWorkField(field?: WorkField | string) {
  if (field === "it") return "مدیریت واحد منابع انسانی";
  return "مدیریت واحد بهبود عملیات و برنامه ریزی";
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

  const end = new Date(start);
  if (period === "daily") end.setDate(start.getDate() + 1);
  if (period === "weekly") {
    const daysFromSaturday = (start.getDay() + 1) % 7;
    end.setDate(end.getDate() + 7 - daysFromSaturday);
  }
  if (period === "monthly") end.setMonth(start.getMonth() + 1, 1);

  return date >= start && date < end;
}

export function isUnassignedTask(task: Task) {
  return (task.assignedTo ?? []).length === 0;
}

export function isTaskOverdue(
  task: Pick<Task, "dueDate" | "endDate" | "status">,
) {
  if (task.status === "done") return false;
  const rawDate = task.dueDate || task.endDate;
  if (!rawDate) return false;
  const date = new Date(rawDate);
  return !Number.isNaN(date.getTime()) && date < new Date();
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

export function isFixedTaskOverdue(
  item: Pick<FixedTask, "endDate" | "nextRunAt" | "status">,
) {
  if (item.status === "done") return false;
  const rawDate = item.endDate || item.nextRunAt;
  if (!rawDate) return false;
  const endDate = new Date(rawDate);
  return !Number.isNaN(endDate.getTime()) && endDate < new Date();
}

export function avatarUrl(user?: User | string) {
  if (!user || typeof user === "string" || !user.avatarKey) return "";
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(
    /\/+$/,
    "",
  );
  if (!backendUrl) return "";

  return `${backendUrl}/uploads/images/${encodeURIComponent(user.avatarKey.replace(/^\/+/, ""))}`;
}

export function isFixedTaskStartedTodayOrLater(
  item: Pick<FixedTask, "startDate">,
  now = new Date(),
) {
  if (!item.startDate) return true;
  const startDate = new Date(item.startDate);
  if (Number.isNaN(startDate.getTime())) return true;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return startDate >= today;
}

function hasEnglishText(value: string) {
  return /[A-Za-z]/.test(value);
}

function actorLabel(value?: string) {
  const actor = value?.trim();
  const actorMap: Record<string, string> = {
    manager: "مدیر",
    supervisor: "سرپرست",
    specialist: "کارشناس",
    "assigned user": "کاربر مسئول",
    "an assigned user": "یک کاربر مسئول",
    user: "کاربر",
  };

  return actor ? (actorMap[actor.toLowerCase()] ?? actor) : "";
}

function decisionLabel(value?: string) {
  const decision = value?.trim().toLowerCase();
  const decisionMap: Record<string, string> = {
    approved: "تأیید شد",
    rejected: "رد شد",
  };

  return decisionMap[decision ?? ""] ?? statusLabel(decision);
}

export function notificationText(notification: Notification) {
  const title = notification.title?.trim() ?? "";
  const message = notification.message?.trim() ?? "";
  const titleMap: Record<string, string> = {
    "Fixed Task Assigned": "گزارش ثابت جدید",
    "Task Assigned": "پروژه جدید",
    "Task Status Updated": "وضعیت گزارش تغییر کرد",
    "Fixed Task Status Updated": "وضعیت گزارش ثابت تغییر کرد",
    "Task Completed": "گزارش تکمیل شد",
    "Fixed Task Completed": "گزارش ثابت تکمیل شد",
    "Fixed Task Rated": "گزارش ثابت امتیازدهی شد",
    "Leave Request Created": "درخواست مرخصی جدید",
    "Leave Request Submitted": "درخواست مرخصی جدید",
    "Leave Request Approved": "درخواست مرخصی تأیید شد",
    "Leave Request Rejected": "درخواست مرخصی رد شد",
    "New User Registration": "ثبت‌نام کاربر جدید",
    "User Approved": "کاربر تأیید شد",
    "User Role Updated": "نقش کاربر تغییر کرد",
    "Extra Task Created": "پروژه مازاد جدید",
    "Extra Task Submitted": "پروژه مازاد جدید",
    "Extra Task Approved": "پروژه مازاد تأیید شد",
    "Extra Task Rejected": "پروژه مازاد رد شد",
    "Fixed Task Timing Approved": "زمان گزارش ثابت تأیید شد",
    "Fixed Task Timing Rejected": "زمان گزارش ثابت رد شد",
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
  const newUserRegistration = message.match(
    /^(.+?)\s+registered and is waiting for your approval\.?$/i,
  );
  const leaveRequestSubmitted = message.match(
    /^(.+?)\s+(?:submitted|created)\s+a leave request\.?$/i,
  );
  const myLeaveRequestDecision = message.match(
    /^Your leave request has been\s+(approved|rejected)\.?$/i,
  );
  const leaveRequestDecision = message.match(
    /^Leave request(?: from)?\s+(.+?)\s+has been\s+(approved|rejected)\.?$/i,
  );
  const extraTaskDecision = message.match(
    /^Your extra task\s*:?\s*["«]?(.*?)["»]?\s+has been\s+(approved|rejected)\.?$/i,
  );
  const fixedTaskTimingDecision = message.match(
    /^The fixed task\s*:?\s*["«]?(.*?)["»]?\s+timing approval (?:has been|was)\s+(approved|rejected)\.?$/i,
  );
  const fixedTaskRated = message.match(
    /^Manager added a rating of\s+(.+?)\s+for the fixed task\s+(.+?)\.?$/i,
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
      ? `پروژه «${taskAssignment[1]}» به شما اختصاص داده شد.`
      : "یک پروژه به شما اختصاص داده شد.";
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
    const actor = actorLabel(taskCompleted[2]);
    localizedMessage = taskName
      ? actor
        ? `گزارش «${taskName}» توسط ${actor} تکمیل شد.`
        : `گزارش «${taskName}» تکمیل شد.`
      : "یک گزارش تکمیل شد.";
  } else if (fixedTaskCompleted) {
    const taskName = fixedTaskCompleted[1]?.trim();
    const actor = actorLabel(fixedTaskCompleted[2]);
    localizedMessage = taskName
      ? actor
        ? `گزارش ثابت «${taskName}» توسط ${actor} تکمیل شد.`
        : `گزارش ثابت «${taskName}» تکمیل شد.`
      : "یک گزارش ثابت تکمیل شد.";
  } else if (fixedTaskRated) {
    const score = fixedTaskRated[1]?.trim();
    const taskName = fixedTaskRated[2]?.trim();
    localizedMessage = taskName
      ? `مدیر برای گزارش ثابت «${taskName}» امتیاز ${score} ثبت کرد.`
      : `مدیر برای یک گزارش ثابت امتیاز ${score} ثبت کرد.`;
  } else if (newUserRegistration) {
    const name = newUserRegistration[1]?.trim();
    localizedMessage = name
      ? `${name} ثبت‌نام کرده و منتظر تایید شماست.`
      : "یک کاربر جدید ثبت‌نام کرده و منتظر تایید شماست.";
  } else if (leaveRequestSubmitted) {
    const name = leaveRequestSubmitted[1]?.trim();
    localizedMessage = name
      ? `${name} درخواست مرخصی ثبت کرد.`
      : "یک درخواست مرخصی جدید ثبت شد.";
  } else if (myLeaveRequestDecision) {
    localizedMessage = `درخواست مرخصی شما ${decisionLabel(
      myLeaveRequestDecision[1],
    )}.`;
  } else if (leaveRequestDecision) {
    const name = leaveRequestDecision[1]?.trim();
    localizedMessage = name
      ? `درخواست مرخصی ${name} ${decisionLabel(leaveRequestDecision[2])}.`
      : `یک درخواست مرخصی ${decisionLabel(leaveRequestDecision[2])}.`;
  } else if (extraTaskDecision) {
    const taskName = extraTaskDecision[1]?.trim();
    localizedMessage = taskName
      ? `پروژه مازاد «${taskName}» ${decisionLabel(extraTaskDecision[2])}.`
      : `یک پروژه مازاد ${decisionLabel(extraTaskDecision[2])}.`;
  } else if (fixedTaskTimingDecision) {
    const taskName = fixedTaskTimingDecision[1]?.trim();
    localizedMessage = taskName
      ? `زمان گزارش ثابت «${taskName}» ${decisionLabel(
          fixedTaskTimingDecision[2],
        )}.`
      : `زمان یک گزارش ثابت ${decisionLabel(fixedTaskTimingDecision[2])}.`;
  }

  const localizedTitle =
    (titleMap[title] ?? (hasEnglishText(title) ? "اعلان جدید" : title)) ||
    "اعلان جدید";
  const safeMessage =
    localizedMessage === message && hasEnglishText(message)
      ? "برای مشاهده جزئیات این اعلان را باز کنید."
      : localizedMessage;

  return {
    title: localizedTitle,
    message: safeMessage,
  };
}

export type NotificationTarget =
  | { kind: "task"; id?: string; title?: string }
  | { kind: "fixedTask"; id?: string; title?: string };

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function notificationRecord(notification: Notification) {
  return notification as Notification & Record<string, unknown>;
}

function idFromLinkedObject(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return firstString(record._id, record.id);
}

function targetIdFromLink(link: string, kind: NotificationTarget["kind"]) {
  const prefix =
    kind === "fixedTask"
      ? /(?:^|\/)(?:fixed-tasks|fixed-reports)\/([^/?#]+)/i
      : /(?:^|\/)(?:tasks|projects|reports)\/([^/?#]+)/i;
  return decodeURIComponent(link.match(prefix)?.[1] ?? "");
}

export function notificationTarget(
  notification: Notification,
): NotificationTarget | null {
  const record = notificationRecord(notification);
  const title = notification.title?.trim() ?? "";
  const message = notification.message?.trim() ?? "";
  const link = notification.link?.trim() ?? "";
  const isFixedTask =
    /fixed task/i.test(`${title} ${message} ${notification.type ?? ""} ${link}`) ||
    /fixed-(?:tasks|reports)|fixed_tasks|fixedTask/i.test(link);
  const kind: NotificationTarget["kind"] = isFixedTask ? "fixedTask" : "task";
  const id =
    firstString(
      kind === "fixedTask" ? record.fixedTaskId : record.taskId,
      kind === "fixedTask" ? record.fixedTaskID : record.taskID,
      kind === "fixedTask" ? record.fixed_task_id : record.task_id,
      kind === "fixedTask" ? idFromLinkedObject(record.fixedTask) : idFromLinkedObject(record.task),
      record.relatedId,
      record.entityId,
      link ? targetIdFromLink(link, kind) : "",
    ) || undefined;

  const fixedTaskRated = message.match(
    /^Manager added a rating of\s+.+?\s+for the fixed task\s+(.+?)\.?$/i,
  );
  const fixedTaskAssignment = message.match(
    /^You have been assigned to the fixed task\s*:?\s*(.*)$/i,
  );
  const taskAssignment = message.match(
    /^You have been assigned to the task\s*:?\s*(.*)$/i,
  );
  const taskStatusChanged = message.match(
    /^The task\s*:?\s*["«]?(.*?)["»]?\s+status changed to\s+.+?\.?$/i,
  );
  const fixedTaskStatusChanged = message.match(
    /^The fixed task\s*:?\s*["«]?(.*?)["»]?\s+status changed to\s+.+?\.?$/i,
  );
  const taskCompleted =
    message.match(
      /^The task\s*:?\s*["«]?(.*?)["»]?\s+has been completed(?:\s+by\s+.+?)?\.?$/i,
    ) ??
    (title === "Task Completed"
      ? message.match(/^(.+?)\s+has been completed(?:\s+by\s+.+?)?\.?$/i)
      : null);
  const fixedTaskCompleted =
    message.match(
      /^The fixed task\s*:?\s*["«]?(.*?)["»]?\s+has been completed(?:\s+by\s+.+?)?\.?$/i,
    ) ??
    (title === "Fixed Task Completed"
      ? message.match(/^(.+?)\s+has been completed(?:\s+by\s+.+?)?\.?$/i)
      : null);
  const targetTitle = firstString(
    fixedTaskRated?.[1],
    fixedTaskAssignment?.[1],
    taskAssignment?.[1],
    taskStatusChanged?.[1],
    fixedTaskStatusChanged?.[1],
    taskCompleted?.[1],
    fixedTaskCompleted?.[1],
  );

  if (!id && !targetTitle) return null;
  return { kind, id, title: targetTitle };
}

export function recurrenceLabel(value?: FixedTask["recurrence"]) {
  return TASK_PERIODS.find(([period]) => period === value)?.[1] ?? "ثابت";
}
