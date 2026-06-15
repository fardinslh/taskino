import type { WorkField } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Priority = "urgent" | "high" | "normal" | "low";
export type TaskPeriod = "daily" | "weekly" | "monthly";
export type View =
  | "dashboard"
  | "tasks"
  | "tasks-admin"
  | "team"
  | "leave"
  | "excel"
  | "settings"
  | "analytics"
  | "fixed-reports"
  | "supervisor-projects"
  | "supervisor-team";

export const VIEW_PATHS: Record<View, string> = {
  dashboard: "/dashboard",
  tasks: "/tasks",
  "tasks-admin": "/projects",
  team: "/team",
  leave: "/leave",
  excel: "/excel",
  settings: "/settings",
  analytics: "/analytics",
  "fixed-reports": "/fixed-reports",
  "supervisor-projects": "/supervisor/projects",
  "supervisor-team": "/supervisor/team",
};

export const TASK_PERIODS: Array<[TaskPeriod, string]> = [
  ["daily", "روزانه"],
  ["weekly", "هفتگی"],
  ["monthly", "ماهانه"],
];

export const WORK_FIELDS: Array<[WorkField, string]> = [
  ["operations", "عملیات"],
  ["it", "فناوری اطلاعات"],
  ["human_resources", "منابع انسانی"],
  ["finance", "مالی"],
  ["sales", "فروش"],
];

export const COLUMNS = [
  {
    status: "todo",
    title: "در انتظار",
    dot: "bg-slate-400",
    colBg:
      "dark:from-slate-800/60 dark:to-slate-900/40 bg-gradient-to-b from-slate-50 to-white",
    border: "border-slate-200 dark:border-slate-700",
    headerGrad:
      "from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/60",
    headerText: "text-slate-600 dark:text-slate-300",
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    emptyBorder: "border-slate-200 dark:border-slate-700",
    cardBorder: "border-t-slate-300 dark:border-t-slate-500",
    btnHover:
      "hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200",
  },
  {
    status: "in_progress",
    title: "در حال انجام",
    dot: "bg-[#1f7a8c]",
    colBg:
      "dark:from-[#0f3040] dark:to-slate-900/40 bg-gradient-to-b from-[#e8f6f9] to-[#f5fbfd]",
    border: "border-[#b8dfe8] dark:border-[#1f5060]",
    headerGrad:
      "from-[#d0eef5] to-[#e8f6f9] dark:from-[#0f3040] dark:to-[#0f3040]/60",
    headerText: "text-[#1f7a8c] dark:text-[#4fc3d5]",
    badge:
      "bg-[#1f7a8c]/15 text-[#1f7a8c] dark:bg-[#1f7a8c]/20 dark:text-[#4fc3d5]",
    emptyBorder: "border-[#9dd4dc] dark:border-[#1f5060]",
    cardBorder: "border-t-[#1f7a8c] dark:border-t-[#2a9db2]",
    btnHover:
      "hover:bg-[#e0f4f8] hover:text-[#1f7a8c] dark:hover:bg-[#0f3040] dark:hover:text-[#4fc3d5]",
  },
  {
    status: "done",
    title: "تکمیل شده",
    dot: "bg-emerald-500",
    colBg:
      "dark:from-emerald-950/40 dark:to-slate-900/40 bg-gradient-to-b from-emerald-50 to-white",
    border: "border-emerald-200 dark:border-emerald-900",
    headerGrad:
      "from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/30",
    headerText: "text-emerald-700 dark:text-emerald-400",
    badge:
      "bg-emerald-200/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    emptyBorder: "border-emerald-200 dark:border-emerald-900",
    cardBorder: "border-t-emerald-400 dark:border-t-emerald-600",
    btnHover:
      "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400",
  },
];

export const PRIORITY: Record<
  Priority,
  { label: string; color: string; icon: string }
> = {
  urgent: {
    label: "فوری",
    color:
      "text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900",
    icon: "🔴",
  },
  high: {
    label: "بالا",
    color:
      "text-orange-600 bg-orange-50 border border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-900",
    icon: "🟠",
  },
  normal: {
    label: "متوسط",
    color:
      "text-blue-600 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900",
    icon: "🔵",
  },
  low: {
    label: "پایین",
    color:
      "text-slate-500 bg-slate-50 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
    icon: "⚪",
  },
};

export const PROJECT_COVERS = [
  "from-[#1f7a8c] to-[#2aa3bd]",
  "from-violet-500 to-violet-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",
];
