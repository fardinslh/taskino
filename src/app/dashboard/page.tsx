"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Plus,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { getId } from "@/lib/api";
import { AssigneeStack } from "../_components/shared";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";
import { COLUMNS, type TaskPeriod } from "../_lib/task-constants";
import {
  formatDate,
  isFixedTaskOverdue,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

export default function DashboardPage() {
  return <DashboardPageContent />;
}

function DashboardPageContent() {
  const {
    activeView,
    boardShowAll,
    selectedPeriodFilter,
    setActiveView,
    setBoardShowAll,
    setSelectedPeriodFilter,
    setSelectedTask,
    setTaskQuery,
    setSelectedSpecialistId,
    setSpecialistSearchQuery,
    taskQuery,
    specialistSearchQuery,
  } = useNavigationContext();
  const { currentUser, isManager, isSpecialist, isSupervisor } =
    useSessionContext();
  const {
    activeTasks,
    doneTasks,
    inProgressTasks,
    progress,
    projects,
    tasks,
    specialistFixedTaskCounts,
    specialistProgressStats,
    specialistTaskCounts,
    specialistWorkSummary,
  } = useTaskContext();
  const {
    handleLeaveAction,
    leaveRequests,
    managerStats,
    managerTaskStatus,
    overdueTasks,
    statsUsers,
    supervisorInProgressReports,
    supervisorOwnDoneReports,
    supervisorProjectDoneReports,
    supervisorStats,
    teamAssigneeCount,
    teamAssignees,
    teamPerformance,
    users,
  } = useManagementContext();
  const {
    filteredFixedTemplates,
    fixedDoneTasks,
    fixedOpenTasks,
    activeFixedTaskCount,
    fixedTasks,
    onDragEnd,
    openFixedTaskForm,
    deleteFixedTask,
  } = useFixedTaskContext();
  const specialistUsers = users.filter((u: any) => u.roles === "specialist");
  const specialistDoneCount =
    (specialistTaskCounts?.done ?? specialistTaskCounts?.completed ?? 0) +
    (specialistFixedTaskCounts?.done ??
      specialistFixedTaskCounts?.completed ??
      0);
  const specialistTotalCount =
    (specialistTaskCounts?.total ?? 0) +
    (specialistFixedTaskCounts?.total ?? 0);
  const specialistOpenCount =
    (specialistTaskCounts?.todo ?? 0) +
    (specialistTaskCounts?.inProgress ??
      specialistTaskCounts?.in_progress ??
      0) +
    (specialistFixedTaskCounts?.todo ?? 0) +
    (specialistFixedTaskCounts?.inProgress ??
      specialistFixedTaskCounts?.in_progress ??
      0);
  const specialistProgress =
    specialistProgressStats?.progressPercentage ??
    (specialistTotalCount
      ? Math.round((specialistDoneCount / specialistTotalCount) * 100)
      : 0);
  const specialistScore = specialistProgressStats?.score ?? 0;
  const specialistMatches = specialistSearchQuery.trim()
    ? specialistUsers.filter((u: any) =>
        userName(u)
          .trim()
          .toLowerCase()
          .includes(specialistSearchQuery.trim().toLowerCase()),
      )
    : [];
  const resolveSpecialistId = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return "";

    const exactMatch = specialistUsers.find(
      (u: any) => userName(u).trim().toLowerCase() === query,
    );
    if (exactMatch) return getId(exactMatch);

    const partialMatches = specialistUsers.filter((u: any) =>
      userName(u).trim().toLowerCase().includes(query),
    );

    return partialMatches.length === 1 ? getId(partialMatches[0]) : "";
  };

  return (
    <>
      {isSupervisor && activeView === "dashboard" && (
        <section className="space-y-4">
          {/* Welcome banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-700 via-violet-600 to-violet-500 px-6 py-5 text-white shadow-lg shadow-violet-500/15">
            <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-violet-200">
                  سلام، {userName(currentUser ?? undefined).split(" ")[0]}
                </p>
                <h1 className="mt-0.5 text-xl font-bold">داشبورد سرپرست</h1>
                <p className="mt-1 text-sm text-violet-200">
                  {overdueTasks.length > 0
                    ? `${overdueTasks.length} گزارش معوق نیاز به بررسی دارد`
                    : "همه گزارش‌ها در موعد هستند"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                {[
                  {
                    n:
                      (supervisorStats?.supervisedTasks ?? 0) +
                      (supervisorStats?.supervisedFixedTasks ?? 0),
                    l: "تحت نظر",
                  },
                  { n: supervisorInProgressReports, l: "در حال انجام" },
                  { n: supervisorOwnDoneReports, l: "تکمیل شده" },
                ].map((s: any, i: number) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-extrabold">{s.n}</p>
                    <p className="text-[11px] text-violet-200">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              {
                label: "گزارش‌های تحت نظر",
                value:
                  (supervisorStats?.supervisedTasks ?? 0) +
                  (supervisorStats?.supervisedFixedTasks ?? 0),
                sub: "عادی و ثابت",
                icon: FolderKanban,
                a: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900",
              },
              {
                label: "گزارش‌های جاری",
                value: supervisorInProgressReports,
                sub: "در حال انجام",
                icon: Activity,
                a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
              },
              {
                label: "تکمیل به‌موقع",
                value: supervisorProjectDoneReports,
                sub: "موفق",
                icon: CheckCircle2,
                a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
              },
              {
                label: "گزارش‌های معوق",
                value: overdueTasks.length,
                sub: "نیاز به بررسی",
                icon: AlertTriangle,
                a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
              },
            ].map((s: any) => (
              <div
                key={s.label}
                className="group rounded-xl border border-[--border] bg-[--surface] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[--text-2]">
                    {s.label}
                  </p>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${s.a}`}
                  >
                    <s.icon size={15} />
                  </span>
                </div>
                <p className="mt-2.5 text-3xl font-bold">{s.value}</p>
                <p className="mt-0.5 text-xs text-[--text-3]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900 bg-[--surface] shadow-sm">
              <div className="flex items-center gap-3 border-b border-amber-100 dark:border-amber-900/50 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950/30 dark:to-transparent px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-[--text]">گزارش‌های معوق</h2>
                  <p className="text-[11px] text-[--text-3]">
                    {overdueTasks.length} گزارش از موعد گذشته
                  </p>
                </div>
              </div>
              <div className="divide-y divide-[--border]">
                {overdueTasks.slice(0, 5).map((t: any) => (
                  <div
                    key={getId(t)}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-[--text-3]">
                        مهلت: {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {statusLabel(t.status)}
                    </span>
                  </div>
                ))}
              </div>
              {overdueTasks.length > 5 && (
                <button
                  className="flex w-full items-center justify-center py-3 text-xs font-semibold text-[#1f7a8c] hover:bg-[--surface-2]"
                  onClick={() => setActiveView("tasks")}
                  type="button"
                >
                  مشاهده همه ({overdueTasks.length})
                </button>
              )}
            </div>
          )}

          {/* Team performance summary */}
          {teamAssignees.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
              <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                    <UsersRound size={17} />
                  </div>
                  <div>
                    <h2 className="font-bold">عملکرد تیم</h2>
                    <p className="text-[11px] text-[--text-3]">
                      {teamAssigneeCount} عضو ·{" "}
                      {teamPerformance.completionRate ?? 0}% نرخ تکمیل
                    </p>
                  </div>
                </div>
                <button
                  className="text-xs font-semibold text-[#1f7a8c] hover:underline"
                  onClick={() => setActiveView("supervisor-team")}
                  type="button"
                >
                  مشاهده کامل
                </button>
              </div>
              <div className="divide-y divide-[--border]">
                {teamAssignees.slice(0, 5).map((m: any) => {
                  const total = m.totalTasks ?? 0;
                  const done = m.doneTasks ?? m.completedTasks ?? 0;
                  const rate = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div
                      key={m.userId ?? m._id}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white">
                        {(
                          m.firstName?.[0] ??
                          m.fullName?.[0] ??
                          "؟"
                        ).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {(m.fullName ??
                            `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()) ||
                            "نامشخص"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[--border]">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] text-[--text-3]">
                            {rate}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">
                          {done}/{total}
                        </p>
                        <p className="text-[10px] text-[--text-3]">گزارش</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Supervisor Projects ─────────────────────────────────────────────── */}

      {((!isSupervisor &&
        (activeView === "dashboard" || activeView === "tasks")) ||
        (isSupervisor && activeView === "tasks")) && (
        <>
          {/* Welcome banner */}
          <div
            className={`relative overflow-hidden rounded-2xl px-6 py-5 text-white shadow-lg ${isManager ? "bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-500 shadow-indigo-500/15" : "bg-gradient-to-l from-[#1a6b7c] via-[#1f7a8c] to-[#2491a5] shadow-[#1f7a8c]/15"}`}
          >
            <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 left-24 h-28 w-28 rounded-full bg-white/5" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">
                  سلام، {userName(currentUser ?? undefined).split(" ")[0]}
                </p>
                <h1 className="mt-0.5 text-xl font-bold">
                  {isManager ? "داشبورد مدیر" : "داشبورد پروژه‌ها"}
                </h1>
                <p className="mt-1 text-sm opacity-75">
                  {isManager
                    ? `${managerStats?.activeProjects ?? projects.length} پروژه فعال · ${managerStats?.activeUsers ?? users.length} کاربر`
                    : activeTasks === 0
                      ? "همه پروژه‌ها تکمیل شده‌اند"
                      : `${activeTasks} پروژه باز داری`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                {isManager
                  ? [
                      {
                        n: managerStats?.activeProjects ?? projects.length,
                        l: "پروژه فعال",
                      },
                      {
                        n: managerStats?.openTasks ?? tasks.length,
                        l: "گزارش باز",
                      },
                      {
                        n: managerStats?.activeUsers ?? users.length,
                        l: "کاربر فعال",
                      },
                    ].map((s: any, i: number) => (
                      <div key={i} className="text-center">
                        <p className="text-2xl font-extrabold">{s.n}</p>
                        <p className="text-[11px] opacity-75">{s.l}</p>
                      </div>
                    ))
                  : [
                      { n: specialistTotalCount, l: "کل پروژه" },
                      { n: specialistDoneCount, l: "تکمیل‌شده" },
                      { n: `${specialistProgress}%`, l: "پیشرفت" },
                    ].map((s: any, i: number) => (
                      <div key={i} className="text-center">
                        <p className="text-2xl font-extrabold">{s.n}</p>
                        <p className="text-[11px] opacity-75">{s.l}</p>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {(isManager
              ? [
                  {
                    label: "پروژه‌ها",
                    value: tasks.length,
                    sub: "پروژه",
                    icon: FolderKanban,
                    a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
                    onClick: () => setActiveView("tasks-admin"),
                  },
                  {
                    label: "گزارش‌های باز",
                    value: managerStats?.openTasks ?? activeTasks,
                    sub: `${inProgressTasks} جاری`,
                    icon: ClipboardList,
                    a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
                    onClick: () => setActiveView("tasks"),
                  },
                  {
                    label: "کاربران فعال",
                    value: managerStats?.activeUsers ?? statsUsers,
                    sub: "کاربر",
                    icon: UsersRound,
                    a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
                    onClick: () => setActiveView("team"),
                  },
                  {
                    label: "آنالیتیکس",
                    value:
                      managerTaskStatus?.doneTasks ??
                      managerTaskStatus?.done ??
                      doneTasks,
                    sub: "گزارش تکمیل",
                    icon: BarChart2,
                    a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
                    onClick: () => setActiveView("analytics"),
                  },
                ]
              : [
                  {
                    label: "پروژه‌ها",
                    value: specialistTotalCount,
                    sub: "واگذارشده",
                    icon: FolderKanban,
                    a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
                    onClick: () => setActiveView("tasks-admin"),
                  },
                  {
                    label: "پروژه‌های باز",
                    value: specialistOpenCount,
                    sub: `${specialistDoneCount} تکمیل شده`,
                    icon: ClipboardList,
                    a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
                    onClick: undefined,
                  },
                  {
                    label: "اعضای تیم",
                    value: specialistProgressStats?.totalTasks ?? statsUsers,
                    sub: "کاربر",
                    icon: UsersRound,
                    a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
                    onClick: undefined,
                  },
                  {
                    label: "تکمیل شده",
                    value: specialistDoneCount,
                    sub: `${specialistProgress}% پیشرفت`,
                    icon: TrendingUp,
                    a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
                    onClick: undefined,
                  },
                ]
            ).map((s: any) => (
              <div
                key={s.label}
                className={`group rounded-xl border border-[--border] bg-[--surface] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 ${s.onClick ? "cursor-pointer" : ""}`}
                onClick={s.onClick}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[--text-2]">
                    {s.label}
                  </p>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${s.a}`}
                  >
                    <s.icon size={15} />
                  </span>
                </div>
                <p className="mt-2.5 text-3xl font-bold">{s.value}</p>
                <p className="mt-0.5 text-xs text-[--text-3]">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Manager: Pending leave requests on dashboard */}

          {isManager &&
            activeView === "dashboard" &&
            leaveRequests.filter((lr: any) => lr.status === "pending").length >
              0 && (
              <div className="overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900 bg-[--surface]">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950/30 dark:to-transparent px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                      <CalendarDays size={17} />
                    </div>
                    <div>
                      <h2 className="font-bold">درخواست‌های مرخصی در انتظار</h2>
                      <p className="text-[11px] text-[--text-3]">
                        {
                          leaveRequests.filter(
                            (lr: any) => lr.status === "pending",
                          ).length
                        }{" "}
                        درخواست نیاز به بررسی دارد
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-xs font-semibold text-[#1f7a8c] hover:underline"
                    onClick={() => setActiveView("team")}
                    type="button"
                  >
                    مشاهده همه
                  </button>
                </div>
                <div className="divide-y divide-[--border]">
                  {leaveRequests
                    .filter((lr: any) => lr.status === "pending")
                    .slice(0, 5)
                    .map((lr: any) => (
                      <div
                        key={getId(lr)}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {userName(lr.user)}
                          </p>
                          <p className="text-xs text-[--text-3]">
                            {formatDate(lr.startDate)} تا{" "}
                            {formatDate(lr.endDate)}
                            {lr.reason ? ` · ${lr.reason}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition"
                            onClick={() =>
                              void handleLeaveAction(getId(lr), "approve")
                            }
                            type="button"
                          >
                            تأیید
                          </button>
                          <button
                            className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                            onClick={() =>
                              void handleLeaveAction(getId(lr), "reject")
                            }
                            type="button"
                          >
                            رد
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Specialist reminder/alert — above the board */}

          {isSpecialist &&
            activeView === "dashboard" &&
            (() => {
              const overdueReports = fixedTasks.filter(
                (f: any) =>
                  f.isActive !== false &&
                  isFixedTaskOverdue(f),
              ).length;
              const fixedOpenReports = fixedOpenTasks;
              const fixedCompletedReports = fixedDoneTasks;
              const openTasks = tasks.filter(
                (t: any) => t.status !== "done",
              ).length;
              const parts: string[] = [];
              if (overdueReports)
                parts.push(`${overdueReports} گزارش مهلت‌گذشته`);
              if (fixedOpenReports)
                parts.push(`${fixedOpenReports} گزارش ثابت در انتظار`);
              if (fixedCompletedReports)
                parts.push(`${fixedCompletedReports} گزارش ثابت تکمیل شده`);
              if (openTasks) parts.push(`${openTasks} پروژه باز`);
              if (parts.length === 0) return null;
              const urgent = overdueReports > 0;
              return (
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 ${urgent ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}
                >
                  <AlertTriangle
                    size={20}
                    className={
                      urgent
                        ? "shrink-0 text-red-500"
                        : "shrink-0 text-amber-500"
                    }
                  />
                  <div>
                    <p
                      className={`text-sm font-bold ${urgent ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}
                    >
                      {urgent
                        ? "حواست باشه! کارهای عقب‌افتاده داری"
                        : "یادآوری کارهای امروز"}
                    </p>
                    <p className="mt-0.5 text-xs text-[--text-2]">
                      {parts.join(" · ")}
                    </p>
                  </div>
                </div>
              );
            })()}

          {/* Fixed-task board (recurring reports) */}

          {(activeView === "dashboard" || activeView === "tasks") && (
            <div className="overflow-hidden rounded-2xl border border-[#b8dfe8] dark:border-[#1f5060] bg-[--surface] shadow-md shadow-[#1f7a8c]/8">
              <div className="flex flex-col gap-3 border-b border-[#cce8ef] dark:border-[#1f5060] bg-gradient-to-l from-[#e0f4f8] to-[#f0fafb] dark:from-[#0f2535] dark:to-[#0f172a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white shadow-sm shadow-[#1f7a8c]/20">
                    <ClipboardList size={17} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[--text]">
                      برد گزارشات ثابت
                    </h2>
                    <p className="text-[11px] text-[--text-3]">
                      گزارشات ثابت بر اساس دوره · {activeFixedTaskCount} مورد ·{" "}
                      {fixedOpenTasks} در انتظار · {fixedDoneTasks} تکمیل شده
                      {(() => {
                        const od = fixedTasks.filter(
                          (f: any) =>
                            f.isActive !== false &&
                            isFixedTaskOverdue(f),
                        ).length;
                        return od ? ` · ${od} مهلت‌گذشته` : "";
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-[--border] bg-[--surface] p-0.5 text-xs">
                    {(
                      [
                        ["", "همه"],
                        ["daily", "روزانه"],
                        ["weekly", "هفتگی"],
                        ["monthly", "ماهانه"],
                      ] as const
                    ).map(([val, lbl]) => (
                      <button
                        key={val}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${selectedPeriodFilter === val ? "bg-[#1f7a8c] text-white" : "text-[--text-2] hover:bg-[--surface-2]"}`}
                        onClick={() =>
                          setSelectedPeriodFilter(val as TaskPeriod | "")
                        }
                        type="button"
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input
                    className="h-8 w-44 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c]"
                    placeholder="جستجوی گزارش…"
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                  />
                  <div className="relative">
                    <input
                      className="h-8 w-56 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c]"
                      placeholder="جستجوی متخصص…"
                      value={specialistSearchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSpecialistSearchQuery(value);
                        setSelectedSpecialistId(resolveSpecialistId(value));
                      }}
                    />
                    {specialistSearchQuery.trim() &&
                      specialistMatches.length > 0 && (
                        <div className="absolute right-0 top-10 z-20 max-h-48 w-56 overflow-y-auto rounded-lg border border-[--border] bg-[--surface] p-1 shadow-lg">
                          {specialistMatches.slice(0, 8).map((u: any) => (
                            <button
                              key={getId(u)}
                              className="block w-full rounded-md px-3 py-2 text-right text-xs text-[--text] transition hover:bg-[--surface-2]"
                              onClick={() => {
                                setSpecialistSearchQuery(userName(u));
                                setSelectedSpecialistId(getId(u));
                              }}
                              type="button"
                            >
                              {userName(u)}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  {isManager && (
                    <button
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-3 text-xs font-semibold text-white transition hover:bg-[#196b7b]"
                      onClick={() => {
                        setActiveView("fixed-reports");
                        openFixedTaskForm();
                      }}
                      type="button"
                    >
                      <Plus size={13} />
                      گزارش ثابت جدید
                    </button>
                  )}
                </div>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid gap-4 bg-[--surface-2]/40 p-4 lg:grid-cols-3">
                  {COLUMNS.map((col: any) => {
                    const allItems = filteredFixedTemplates.filter(
                      (ft: any) => (ft.status ?? "todo") === col.status,
                    );
                    const items = boardShowAll
                      ? allItems
                      : allItems.slice(0, 8);
                    return (
                      <div
                        key={col.status}
                        className={`flex flex-col rounded-2xl border ${col.border} ${col.colBg}`}
                      >
                        <div
                          className={`flex items-center justify-between rounded-t-2xl bg-gradient-to-l ${col.headerGrad} px-4 py-3`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${col.dot}`}
                            />
                            <h3
                              className={`text-sm font-bold ${col.headerText}`}
                            >
                              {col.title}
                            </h3>
                          </div>
                          <div
                            className={`rounded-full max-w-2.5 max-h-2.5 p-2.5 flex items-center justify-center text-xs font-bold ${col.badge}`}
                          >
                            {allItems.length}
                          </div>
                        </div>
                        <Droppable
                          droppableId={col.status}
                          isDropDisabled={!isSpecialist}
                        >
                          {(dropProvided: any, dropSnapshot: any) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={`flex flex-col gap-2.5 p-2.5 min-h-[120px] transition-colors ${dropSnapshot.isDraggingOver ? "bg-[#1f7a8c]/5" : ""}`}
                            >
                              {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[--border] py-10">
                                  <CircleDashed
                                    size={26}
                                    className="text-[--text-3] opacity-30"
                                  />
                                  <p className="mt-2 text-xs text-[--text-3]">
                                    گزارشی نیست
                                  </p>
                                </div>
                              ) : (
                                items.map((ft: any, idx: number) => (
                                  <Draggable
                                    key={getId(ft)}
                                    draggableId={getId(ft)}
                                    index={idx}
                                    isDragDisabled={
                                      !isSpecialist || (ft.status ?? "todo") === "done"
                                    }
                                  >
                                    {(dragProvided: any, dragSnapshot: any) => (
                                      <article
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 shadow-sm transition-all ${isManager ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""} ${isSpecialist && (ft.status ?? "todo") !== "done" ? "cursor-grab active:cursor-grabbing" : ""} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
                                        onClick={
                                          isManager
                                            ? () => {
                                                setActiveView("fixed-reports");
                                                openFixedTaskForm(ft);
                                              }
                                            : undefined
                                        }
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="rounded-md border border-[#b8dfe8] bg-[#e8f4f7] px-1.5 py-0.5 text-[10px] font-bold text-[#1f7a8c] dark:border-[#1f5060] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
                                            ثابت ·{" "}
                                            {recurrenceLabel(ft.recurrence)}
                                          </span>
                                          {isFixedTaskOverdue(ft) ? (
                                            <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                              مهلت گذشته
                                            </span>
                                          ) : (
                                            <span
                                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ft.isActive !== false ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                                            >
                                              {ft.isActive !== false
                                                ? "فعال"
                                                : "غیرفعال"}
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-2.5 flex items-start gap-2">
                                          <ClipboardList
                                            size={15}
                                            className="mt-0.5 shrink-0 text-[#1f7a8c]"
                                          />
                                          <h4 className="text-sm font-semibold leading-snug">
                                            {ft.title}
                                          </h4>
                                        </div>
                                        {ft.description && (
                                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">
                                            {ft.description}
                                          </p>
                                        )}
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                          <AssigneeStack
                                            users={
                                              ft.assignedTo
                                                ? [ft.assignedTo]
                                                : []
                                            }
                                          />
                                          {ft.nextRunAt && (
                                            <div className="flex items-center gap-1 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] text-[--text-3]">
                                              <CalendarDays size={10} />
                                              {formatDate(ft.nextRunAt)}
                                            </div>
                                          )}
                                        </div>
                                        {isManager && ft.isActive !== false && (
                                          <button
                                            className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              if (
                                                window.confirm(
                                                  "این گزارش ثابت حذف شود؟",
                                                )
                                              ) {
                                                void deleteFixedTask(getId(ft));
                                              }
                                            }}
                                            type="button"
                                          >
                                            حذف
                                          </button>
                                        )}
                                      </article>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {dropProvided.placeholder}
                              {allItems.length > 8 && (
                                <button
                                  className="mt-1 w-full rounded-lg border border-[--border] bg-[--surface-2] py-2 text-xs font-semibold text-[#1f7a8c] transition hover:bg-[--surface]"
                                  onClick={() =>
                                    setBoardShowAll((v: boolean) => !v)
                                  }
                                  type="button"
                                >
                                  {boardShowAll
                                    ? "نمایش کمتر"
                                    : `نمایش بیشتر (${allItems.length - 8} مورد دیگر)`}
                                </button>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>
          )}

          {/* Specialist performance */}

          {isSpecialist &&
            activeView === "dashboard" &&
            (() => {
              const rate =
                specialistProgressStats?.progressPercentage ??
                specialistProgress;
              const summaryTotalProjects =
                specialistWorkSummary?.totalProjects ??
                specialistWorkSummary?.totalProject ??
                specialistWorkSummary?.projectsCount ??
                specialistWorkSummary?.totalTasks ??
                specialistTotalCount;
              const summaryCompleted =
                specialistWorkSummary?.completedProjects ??
                specialistWorkSummary?.completedProject ??
                specialistWorkSummary?.completedTasks ??
                specialistWorkSummary?.doneProjects ??
                specialistWorkSummary?.doneTasks ??
                specialistDoneCount;
              const summaryScore =
                specialistWorkSummary?.score ?? specialistScore;
              const ps = specialistProgressStats?.score
                ? specialistProgressStats.score > 80
                  ? "good"
                  : specialistProgressStats.score < 50
                    ? "weak"
                    : "normal"
                : currentUser?.performanceStatus;
              const psLabel =
                ps === "good"
                  ? "خوب"
                  : ps === "weak"
                    ? "ضعیف"
                    : ps === "normal"
                      ? "متوسط"
                      : "—";
              const psClass =
                ps === "good"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : ps === "weak"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
              return (
                <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={17} className="text-[#1f7a8c]" />
                      <h2 className="font-bold">عملکرد من</h2>
                    </div>
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${psClass}`}
                    >
                      {psLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[--border]">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-[#1f7a8c] to-[#2a9db2] transition-all duration-700"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#1f7a8c]">
                      {rate}%
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: "امتیاز", v: summaryScore, c: "text-amber-600" },
                      {
                        l: "تکمیل‌شده",
                        v: summaryCompleted,
                        c: "text-emerald-600",
                      },
                      {
                        l: "کل پروژه",
                        v: summaryTotalProjects,
                        c: "text-[--text]",
                      },
                    ].map((s: any) => (
                      <div
                        key={s.l}
                        className="rounded-xl bg-[--surface-2] py-3"
                      >
                        <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                        <p className="text-[11px] text-[--text-3]">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* Specialist projects under the board */}

          {!isManager && activeView === "dashboard" && (
            <div className="overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-[--surface] shadow-md shadow-indigo-500/8">
              <div className="flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-950/30 dark:to-transparent px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <FolderKanban size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-[--text]">پروژه‌ها</h2>
                  <p className="text-[11px] text-[--text-3]">
                    {tasks.length} پروژه واگذارشده · برای شروع و دانلود فایل
                    کلیک کن
                  </p>
                </div>
              </div>
              {tasks.length === 0 ? (
                <p className="py-10 text-center text-sm text-[--text-3]">
                  پروژه‌ای به شما واگذار نشده
                </p>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {tasks.map((t: any) => (
                    <button
                      key={getId(t)}
                      className="rounded-xl border border-[--border] border-t-[3px] border-t-indigo-500 bg-[--surface] p-3.5 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => setSelectedTask(t)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${COLUMNS.find((c: any) => c.status === t.status)?.badge ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                        {t.excelFile && (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <FileSpreadsheet size={10} />
                            اکسل
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 flex items-start gap-2">
                        <FolderKanban
                          size={15}
                          className="mt-0.5 shrink-0 text-indigo-500"
                        />
                        <h4 className="text-sm font-semibold leading-snug">
                          {t.title}
                        </h4>
                      </div>
                      {t.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">
                          {t.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
