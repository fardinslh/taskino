"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Gauge,
  Plus,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  getId,
  userApi,
  type MyDailyProgressStats,
  type MyProgressStats,
  type DailyProgressEntry,
  type ProgressBucket,
} from "@/lib/api";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { AssigneeStack } from "../_components/shared";
import { TaskDeadlineCountdown } from "../_components/task-deadline-countdown";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";
import { formatDurationMinutes } from "../_lib/fixed-task-timing";
import { fixedTaskOccurrenceKey } from "../_lib/fixed-task-identity";
import { COLUMNS, type TaskPeriod } from "../_lib/task-constants";
import {
  formatDate,
  isFixedTaskOverdue,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

function DraggablePortal({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  if (enabled && typeof document !== "undefined") {
    return createPortal(children, document.body);
  }

  return children;
}

function isSameLocalDay(value: string | undefined, date: Date) {
  if (!value) return false;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;

  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}

function DashboardPageContent() {
  const {
    activeView,
    boardShowAll,
    selectedAssigneeFilter,
    selectedPeriodFilter,
    setActiveView,
    setBoardShowAll,
    setSelectedAssigneeFilter,
    setSelectedPeriodFilter,
    setSelectedFixedTask,
    setSelectedTask,
    setTaskQuery,
    setSelectedSpecialistId,
    setSpecialistSearchQuery,
    taskQuery,
    specialistSearchQuery,
  } = useNavigationContext();
  const { currentUser, isManager, isSpecialist, isSupervisor, token } =
    useSessionContext();
  const {
    activeTasks,
    claimTask,
    doneTasks,
    projects,
    tasks,
    specialistFixedTaskCounts,
    specialistProgressStats,
    specialistTaskCounts,
  } = useTaskContext();
  const {
    handleLeaveAction,
    leaveRequests,
    managerStats,
    managerTaskStatus,
    overdueTasks,
    statsUsers,
    supervisorStats,
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
  const fixedTaskAssigneeUsers = fixedTasks.reduce((acc: any[], ft: any) => {
    const assigneeId = getId(ft.assignedTo);
    if (!assigneeId || acc.some((user) => getId(user) === assigneeId)) {
      return acc;
    }
    acc.push(
      users.find((user: any) => getId(user) === assigneeId) ?? ft.assignedTo,
    );
    return acc;
  }, []);
  const specialistDoneCount =
    (specialistTaskCounts?.done ?? specialistTaskCounts?.completed ?? 0) +
    (specialistFixedTaskCounts?.done ??
      specialistFixedTaskCounts?.completed ??
      0);
  const specialistTotalCount =
    (specialistTaskCounts?.total ?? 0) +
    (specialistFixedTaskCounts?.total ?? 0);
  const specialistProgress =
    specialistProgressStats?.progressPercentage ??
    (specialistTotalCount
      ? Math.round((specialistDoneCount / specialistTotalCount) * 100)
      : 0);
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

  const supervisedTasksCount = supervisorStats?.supervisedTasks ?? 0;
  const supervisedInProgressTasksCount =
    supervisorStats?.supervisedInProgressTasks ?? 0;
  const activeCompletedSupervisedTasksCount =
    supervisorStats?.activeCompletedSupervisedTasks ?? 0;
  const canMoveFixedTasksOnDashboard = isSpecialist || isSupervisor;
  const todaysProjects = isSpecialist
    ? tasks
        .filter((task: any) => {
          if ((task.status ?? "todo") === "done") return false;
          return isSameLocalDay(task.dueDate ?? task.endDate, new Date());
        })
        .sort((a: any, b: any) => {
          return (
            new Date(a.dueDate ?? a.endDate ?? 0).getTime() -
            new Date(b.dueDate ?? b.endDate ?? 0).getTime()
          );
        })
    : [];

  return (
    <>
      {isSupervisor && activeView === "dashboard" && (
        <LandingPageEntrance className="space-y-4">
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
                  { n: supervisedTasksCount, l: "تحت نظر" },
                  { n: supervisedInProgressTasksCount, l: "در حال انجام" },
                  { n: activeCompletedSupervisedTasksCount, l: "انجام شده" },
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "گزارش‌های تحت نظر",
                value: supervisedTasksCount,
                sub: "کل گزارش‌ها",
                icon: FolderKanban,
                a: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900",
              },
              {
                label: "گزارش‌های در حال انجام",
                value: supervisedInProgressTasksCount,
                sub: "در حال انجام",
                icon: Activity,
                a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
              },
              {
                label: "گزارش های انجام شده",
                value: activeCompletedSupervisedTasksCount,
                sub: "انجام‌شده",
                icon: CheckCircle2,
                a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
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

          <PersonalPerformanceCard
            stats={specialistProgressStats}
            fallbackProgress={specialistProgress}
            fallbackStatus={currentUser?.performanceStatus}
          />
        </LandingPageEntrance>
      )}

      {/* ─── Supervisor Projects ─────────────────────────────────────────────── */}

      {((!isSupervisor &&
        (activeView === "dashboard" || activeView === "tasks")) ||
        (isSupervisor && activeView === "tasks")) && (
        <LandingPageEntrance className="space-y-4">
          {/* Welcome banner */}
          <div
            className={`relative overflow-hidden rounded-2xl px-4 py-5 text-white shadow-lg sm:px-6 ${isManager ? "bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-500 shadow-indigo-500/15" : "bg-gradient-to-l from-[#1a6b7c] via-[#1f7a8c] to-[#2491a5] shadow-[#1f7a8c]/15"}`}
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
                        n: fixedOpenTasks,
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
          {isManager && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
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
                  value: fixedOpenTasks,
                  sub: `${fixedOpenTasks} در انتظار`,
                  icon: ClipboardList,
                  a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
                  onClick: () => setActiveView("fixed-reports"),
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
              ].map((s: any) => (
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
          )}

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
              const fallbackOverdueReports = fixedTasks.filter(
                (f: any) => f.isActive !== false && isFixedTaskOverdue(f),
              ).length;
              const scheduledOverdueReports =
                specialistFixedTaskCounts?.overdueUnfinished ??
                specialistFixedTaskCounts?.overdue;
              const overdueReports =
                scheduledOverdueReports ?? fallbackOverdueReports;
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

          {(activeView === "tasks" ||
            (activeView === "dashboard" && !isSpecialist)) && (
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
                            f.isActive !== false && isFixedTaskOverdue(f),
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
                        ["daily", "روزانه"],
                        ["weekly", "هفتگی"],
                        ["monthly", "ماهانه"],
                        ["", "همه"],
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
                  <select
                    className="h-8 w-44 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition focus:border-[#1f7a8c]"
                    value={selectedAssigneeFilter}
                    onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
                  >
                    <option value="">همه کاربران</option>
                    {fixedTaskAssigneeUsers.map((user: any) => (
                      <option key={getId(user)} value={getId(user)}>
                        {userName(user)}
                      </option>
                    ))}
                  </select>
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
                <div className="grid gap-4 bg-[--surface-2]/40 p-3 sm:p-4 lg:grid-cols-3">
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
                        className={`flex min-h-[420px] flex-col rounded-2xl border ${col.border} ${col.colBg}`}
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
                          isDropDisabled={!canMoveFixedTasksOnDashboard}
                        >
                          {(dropProvided: any, dropSnapshot: any) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={`flex h-full min-h-[120px] flex-1 flex-col gap-2.5 p-2.5 transition-colors ${dropSnapshot.isDraggingOver ? "bg-[#1f7a8c]/5" : ""}`}
                            >
                              {items.length === 0 ? (
                                <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[--border] py-10">
                                  <CircleDashed
                                    size={26}
                                    className="text-[--text-3] opacity-30"
                                  />
                                  <p className="mt-2 text-xs text-[--text-3]">
                                    گزارشی نیست
                                  </p>
                                </div>
                              ) : (
                                items.map((ft: any, idx: number) => {
                                  const fixedTaskOverdue =
                                    isFixedTaskOverdue(ft);
                                  const boardItemId =
                                    (ft.status === "done"
                                      ? fixedTaskOccurrenceKey(ft)
                                      : getId(ft)) || `${getId(ft)}:${idx}`;
                                  const hasManagerRating =
                                    ft.ratingScore != null;
                                  const managerRatingLabel =
                                    ft.ratingScore <= 3
                                      ? "ضعیف"
                                      : ft.ratingScore <= 6
                                        ? "متوسط"
                                        : "خوب";
                                  return (
                                    <Draggable
                                      key={boardItemId}
                                      draggableId={boardItemId}
                                      index={idx}
                                      isDragDisabled={
                                        !canMoveFixedTasksOnDashboard ||
                                        (ft.status ?? "todo") === "done" ||
                                        fixedTaskOverdue
                                      }
                                    >
                                      {(
                                        dragProvided: any,
                                        dragSnapshot: any,
                                      ) => (
                                        <DraggablePortal
                                          enabled={dragSnapshot.isDragging}
                                        >
                                          <article
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            {...dragProvided.dragHandleProps}
                                            className={`cursor-pointer rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 shadow-sm transition-[background-color,border-color,box-shadow] ${isManager ? "hover:shadow-md" : ""} ${canMoveFixedTasksOnDashboard && (ft.status ?? "todo") !== "done" && !fixedTaskOverdue ? "cursor-grab touch-none active:cursor-grabbing" : ""} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
                                            onClick={() =>
                                              setSelectedFixedTask(ft)
                                            }
                                          >
                                            <div className="flex flex-wrap items-center justify-start gap-1.5">
                                              <span className="rounded-md border border-[#b8dfe8] bg-[#e8f4f7] px-1.5 py-0.5 text-[10px] font-bold text-[#1f7a8c] dark:border-[#1f5060] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
                                                ثابت ·{" "}
                                                {recurrenceLabel(ft.recurrence)}
                                              </span>
                                              {fixedTaskOverdue ? (
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
                                              {hasManagerRating && (
                                                <span className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)] dark:bg-amber-950/35 dark:text-amber-300">
                                                  <Award size={11} />
                                                  {ft.ratingScore.toLocaleString(
                                                    "fa-IR",
                                                  )}
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
                                            {hasManagerRating && (
                                              <div className="mt-3 rounded-xl bg-amber-50 p-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)] dark:bg-amber-950/25">
                                                <div className="flex items-center justify-between gap-3">
                                                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                                                    <Award size={14} />
                                                    امتیاز مدیر
                                                  </span>
                                                  <strong className="text-sm font-black tabular-nums text-amber-700 dark:text-amber-300">
                                                    {ft.ratingScore.toLocaleString(
                                                      "fa-IR",
                                                    )}
                                                    · {managerRatingLabel}
                                                  </strong>
                                                </div>
                                                {ft.ratingComment?.trim() && (
                                                  <p className="mt-2 text-pretty text-xs leading-5 text-amber-900/75 dark:text-amber-100/75">
                                                    {ft.ratingComment}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                            {ft.approvedDurationMinutes !=
                                              null && (
                                              <div className="mt-3 flex items-center justify-between rounded-lg bg-sky-50 px-2.5 py-2 text-xs text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                                                <span className="font-semibold">
                                                  زمان در دسترس:
                                                </span>
                                                <span className="font-extrabold tabular-nums">
                                                  {formatDurationMinutes(
                                                    ft.approvedDurationMinutes,
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                            <TaskDeadlineCountdown
                                              className="mt-3"
                                              dueDate={
                                                ft.endDate ?? ft.nextRunAt
                                              }
                                              status={ft.status}
                                            />
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
                                            {isManager &&
                                              ft.isActive !== false && (
                                                <button
                                                  className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (
                                                      window.confirm(
                                                        "این گزارش ثابت حذف شود؟",
                                                      )
                                                    ) {
                                                      void deleteFixedTask(
                                                        getId(ft),
                                                      );
                                                    }
                                                  }}
                                                  type="button"
                                                >
                                                  حذف
                                                </button>
                                              )}
                                          </article>
                                        </DraggablePortal>
                                      )}
                                    </Draggable>
                                  );
                                })
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

          {isSpecialist && activeView === "dashboard" && (
            <SpecialistPerformanceCard
              fallbackProgress={specialistProgress}
              fallbackStatus={currentUser?.performanceStatus}
              stats={specialistProgressStats}
              token={token}
            />
          )}

          {isSpecialist &&
            activeView === "dashboard" &&
            todaysProjects.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#b8dfe8] bg-[--surface] shadow-md shadow-[#1f7a8c]/8 dark:border-[#1f5060]">
                <div className="flex items-center justify-between gap-3 border-b border-[#cce8ef] bg-gradient-to-l from-[#e0f4f8] to-[#f0fafb] px-5 py-4 dark:border-[#1f5060] dark:from-[#0f2535] dark:to-[#0f172a]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white shadow-sm shadow-[#1f7a8c]/20">
                      <CalendarDays size={17} />
                    </div>
                    <div>
                      <h2 className="font-bold text-[--text]">
                        پروژه‌های امروز
                      </h2>
                      <p className="text-[11px] text-[--text-3]">
                        {todaysProjects.length.toLocaleString("fa-IR")} پروژه
                        برای امروز داری
                      </p>
                    </div>
                  </div>
                  <button
                    className="h-9 rounded-xl bg-[#1f7a8c]/10 px-3 text-xs font-black text-[#1f7a8c] transition-[background-color,transform] hover:bg-[#1f7a8c]/15 active:scale-[0.96]"
                    onClick={() => setActiveView("tasks")}
                    type="button"
                  >
                    مشاهده همه
                  </button>
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {todaysProjects.slice(0, 6).map((task: any) => {
                    const deadline = task.dueDate ?? task.endDate;
                    const column =
                      COLUMNS.find((item: any) => item.status === task.status) ??
                      COLUMNS[0];

                    return (
                      <article
                        className="cursor-pointer rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 text-right shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
                        key={getId(task)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${column.badge}`}
                          >
                            {statusLabel(task.status)}
                          </span>
                          {deadline && (
                            <span className="flex items-center gap-1 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-bold text-[--text-3]">
                              <CalendarDays size={10} />
                              {formatDate(deadline)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-start gap-2">
                          <FolderKanban
                            size={15}
                            className="mt-0.5 shrink-0 text-[#1f7a8c]"
                          />
                          <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                            {task.title}
                          </h4>
                        </div>
                        {task.description && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">
                            {task.description}
                          </p>
                        )}
                        <TaskDeadlineCountdown
                          className="mt-3"
                          dueDate={deadline}
                          status={task.status}
                        />
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

          {isSpecialist && activeView === "dashboard" && tasks.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-[--surface] shadow-md shadow-indigo-500/8">
              <div className="flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-950/30 dark:to-transparent px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <FolderKanban size={17} />
                </div>
                <div>
                  <h2 className="font-bold text-[--text]">پروژه‌ها</h2>
                  <p className="text-[11px] text-[--text-3]">
                    {tasks.length} پروژه واگذارشده
                  </p>
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {tasks.map((t: any) => (
                  <article
                    key={getId(t)}
                    className="cursor-pointer rounded-xl border border-[--border] border-t-[3px] border-t-indigo-500 bg-[--surface] p-3.5 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => setSelectedTask(t)}
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
                    {!!t.isPublic && (t.status ?? "todo") !== "done" && (
                      <button
                        className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1f7a8c] px-3 text-xs font-bold text-white transition hover:bg-[#196b7b]"
                        onClick={(event) => {
                          event.stopPropagation();
                          void claimTask(getId(t));
                        }}
                        type="button"
                      >
                        <UserCheck size={13} />
                        انتخاب پروژه
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </LandingPageEntrance>
      )}
    </>
  );
}

function dateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayRange() {
  const now = new Date();
  const today = dateParam(now);
  return {
    from: today,
    to: today,
  };
}

function bucketRate(bucket?: ProgressBucket) {
  if (!bucket) return undefined;
  if (typeof bucket.progressPercentage === "number") {
    return bucket.progressPercentage;
  }

  const completed =
    bucket.completed ??
    bucket.completedTasks ??
    bucket.done ??
    bucket.doneTasks ??
    0;
  const total = bucket.total ?? bucket.totalTasks ?? 0;
  return total ? Math.round((completed / total) * 100) : undefined;
}

function boundedPercent(value?: number) {
  return Math.min(100, Math.max(0, Math.round(value ?? 0)));
}

function averageDailyProgress(
  entries: DailyProgressEntry[] | undefined,
  field:
    | "progressPercentage"
    | "taskProgressPercentage"
    | "fixedTaskProgressPercentage",
) {
  if (!entries?.length) return undefined;
  return Math.round(
    entries.reduce((sum, entry) => sum + (entry[field] ?? 0), 0) /
      entries.length,
  );
}

function SpecialistPerformanceCard({
  stats,
  fallbackProgress,
  fallbackStatus,
  token,
}: {
  stats: MyProgressStats | null;
  fallbackProgress: number;
  fallbackStatus?: string;
  token: string;
}) {
  const reduceMotion = useReducedMotion();
  const initialRange = todayRange();
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [dailyStats, setDailyStats] = useState<MyDailyProgressStats | null>(
    null,
  );
  const [loadingDailyStats, setLoadingDailyStats] = useState(false);
  const [dailyStatsError, setDailyStatsError] = useState("");
  const rate = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        dailyStats?.averageProgressPercentage ??
          averageDailyProgress(dailyStats?.data, "progressPercentage") ??
          dailyStats?.progressPercentage ??
          stats?.progressPercentage ??
          fallbackProgress,
      ),
    ),
  );
  const latestDailyEntry = dailyStats?.data?.at(-1);
  const status =
    latestDailyEntry?.performanceStatus ??
    dailyStats?.performanceStatus ??
    stats?.performanceStatus ??
    fallbackStatus;
  const projectProgress = boundedPercent(
    dailyStats?.averageTaskProgressPercentage ??
      averageDailyProgress(dailyStats?.data, "taskProgressPercentage") ??
      dailyStats?.taskProgressPercentage ??
      bucketRate(dailyStats?.tasks ?? dailyStats?.projects) ??
      stats?.taskProgressPercentage,
  );
  const reportProgress = boundedPercent(
    dailyStats?.averageFixedTaskProgressPercentage ??
      averageDailyProgress(dailyStats?.data, "fixedTaskProgressPercentage") ??
      dailyStats?.fixedTaskProgressPercentage ??
      bucketRate(dailyStats?.fixedTasks ?? dailyStats?.reports) ??
      stats?.fixedTaskProgressPercentage,
  );

  async function loadDailyProgress() {
    if (!token || !from || !to) return;
    if (from > to) {
      setDailyStatsError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      return;
    }

    setLoadingDailyStats(true);
    setDailyStatsError("");
    try {
      const response = await userApi.meDailyProgress(token, { from, to });
      setDailyStats(response);
    } catch (error) {
      setDailyStats(null);
      setDailyStatsError(
        error instanceof Error
          ? error.message
          : "دریافت عملکرد روزانه ناموفق بود.",
      );
    } finally {
      setLoadingDailyStats(false);
    }
  }

  function submitDailyProgressFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadDailyProgress();
  }

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const range = todayRange();
    userApi
      .meDailyProgress(token, range)
      .then((response) => {
        if (!cancelled) setDailyStats(response);
      })
      .catch((error) => {
        if (cancelled) return;
        setDailyStatsError(
          error instanceof Error
            ? error.message
            : "دریافت عملکرد روزانه ناموفق بود.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const statusDetails =
    status === "good"
      ? {
          dot: "bg-emerald-500",
          label: "خوب",
          styles:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/15",
        }
      : status === "weak" || status === "bad"
        ? {
            dot: "bg-red-500",
            label: "ضعیف",
            styles:
              "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-400/15",
          }
        : status === "normal"
          ? {
              dot: "bg-amber-500",
              label: "متوسط",
              styles:
                "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/15",
            }
          : {
              dot: "bg-slate-400",
              label: "—",
              styles:
                "bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10",
            };
  const metrics = [
    {
      Icon: Award,
      iconStyles:
        "bg-amber-50 text-amber-600 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/15",
      label: "امتیاز",
      value: dailyStats?.score ?? stats?.score ?? 0,
      valueStyles: "text-amber-600 dark:text-amber-400",
    },
    {
      Icon: ClipboardList,
      iconStyles:
        "bg-indigo-50 text-indigo-600 ring-indigo-600/10 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-400/15",
      label: "پیشرفت پروژه‌ها",
      value: `${projectProgress}%`,
      valueStyles: "text-indigo-600 dark:text-indigo-400",
    },
    {
      Icon: CalendarDays,
      iconStyles:
        "bg-cyan-50 text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-400/15",
      label: "پیشرفت گزارش‌ها",
      value: `${reportProgress}%`,
      valueStyles: "text-[#1f7a8c] dark:text-cyan-400",
    },
    {
      Icon: Gauge,
      iconStyles:
        "bg-emerald-50 text-emerald-600 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/15",
      label: "پیشرفت کلی",
      value: `${rate}%`,
      valueStyles: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.06),0_12px_32px_-20px_rgba(31,122,140,0.45)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#1f7a8c] via-cyan-400 to-emerald-400" />

      <div className="px-4 pb-5 pt-6 sm:px-5">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4f7] text-[#1f7a8c] ring-1 ring-inset ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-cyan-400 dark:ring-cyan-400/15">
              <TrendingUp size={19} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-balance font-bold text-[--text]">
                عملکرد من
              </h2>
              <p className="mt-0.5 text-xs text-[--text-3]">
                نمای کلی پیشرفت فعالیت‌ها
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusDetails.styles}`}
          >
            <span className={`size-1.5 rounded-full ${statusDetails.dot}`} />
            {statusDetails.label}
          </span>
        </motion.div>

        <form
          className="mt-4 grid items-end gap-2 rounded-xl bg-[--surface-2]/70 p-2.5 shadow-[inset_0_0_0_1px_var(--border)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          onSubmit={submitDailyProgressFilter}
        >
          <label className="block text-[11px] font-semibold text-[--text-2]">
            از تاریخ
            <DatePicker
              calendar={jalali}
              calendarPosition="bottom-right"
              containerClassName="mt-1 w-full"
              fixMainPosition
              format="YYYY/MM/DD"
              inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm font-semibold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              locale={persianFa}
              maxDate={to ? new Date(`${to}T00:00:00`) : undefined}
              onChange={(date) => {
                if (!date || Array.isArray(date)) return setFrom("");
                setFrom(dateParam(date.toDate()));
              }}
              portal
              value={from ? new Date(`${from}T00:00:00`) : ""}
              zIndex={10000}
            />
          </label>
          <label className="block text-[11px] font-semibold text-[--text-2]">
            تا تاریخ
            <DatePicker
              calendar={jalali}
              calendarPosition="bottom-right"
              containerClassName="mt-1 w-full"
              fixMainPosition
              format="YYYY/MM/DD"
              inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm font-semibold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              locale={persianFa}
              minDate={from ? new Date(`${from}T00:00:00`) : undefined}
              onChange={(date) => {
                if (!date || Array.isArray(date)) return setTo("");
                setTo(dateParam(date.toDate()));
              }}
              portal
              value={to ? new Date(`${to}T00:00:00`) : ""}
              zIndex={10000}
            />
          </label>
          <button
            className="flex h-10 min-w-24 items-center justify-center rounded-lg bg-[#1f7a8c] px-4 text-xs font-bold text-white shadow-sm transition-[background-color,transform] hover:bg-[#196b7b] active:scale-[0.96] disabled:cursor-wait disabled:opacity-60"
            disabled={loadingDailyStats || !from || !to}
            type="submit"
          >
            {loadingDailyStats ? "در حال دریافت…" : "اعمال بازه"}
          </button>
          {dailyStatsError && (
            <p
              aria-live="polite"
              className="text-[11px] font-medium text-red-600 sm:col-span-3 dark:text-red-400"
            >
              {dailyStatsError}
            </p>
          )}
        </form>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-5"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          transition={{
            delay: reduceMotion ? 0 : 0.08,
            duration: 0.35,
            ease: [0.2, 0, 0, 1],
          }}
        >
          <div className="mb-2.5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[--text-2]">
                روند پیشرفت
              </p>
              <p className="mt-0.5 text-[11px] text-[--text-3]">
                مجموع پروژه‌ها و گزارش‌ها
              </p>
            </div>
            <div
              className="flex items-baseline gap-1 text-[#1f7a8c] dark:text-cyan-400"
              dir="ltr"
            >
              <strong className="text-2xl font-extrabold tabular-nums">
                {rate}
              </strong>
              <span className="text-sm font-bold">%</span>
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 p-[3px] shadow-inner dark:bg-slate-800">
            <div className="relative h-full overflow-hidden rounded-full">
              <motion.div
                animate={{ scaleX: rate / 100 }}
                className="absolute inset-0 origin-right rounded-full bg-gradient-to-l from-[#176979] via-[#2493a8] to-cyan-400"
                initial={reduceMotion ? false : { scaleX: 0 }}
                transition={{
                  bounce: 0,
                  delay: reduceMotion ? 0 : 0.18,
                  duration: 0.8,
                  type: "spring",
                }}
              >
                {!reduceMotion && rate > 0 && (
                  <motion.span
                    animate={{ x: "450%" }}
                    className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                    initial={{ x: "-150%" }}
                    transition={{
                      delay: 0.75,
                      duration: 1.1,
                      ease: [0.2, 0, 0, 1],
                    }}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 bg-[--surface-2]/65 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`flex min-w-0 items-center gap-3 px-4 py-4 ${
              index >= 2 ? "border-t border-[--border]" : ""
            } ${
              index % 2 === 1 ? "border-s border-[--border]" : ""
            } ${index > 0 ? "xl:border-s xl:border-[--border]" : "xl:border-s-0"} xl:border-t-0`}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            key={metric.label}
            transition={{
              delay: reduceMotion ? 0 : 0.18 + index * 0.07,
              duration: 0.32,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${metric.iconStyles}`}
            >
              <metric.Icon size={18} strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <p
                className={`text-lg font-extrabold tabular-nums ${metric.valueStyles}`}
              >
                {metric.value}
              </p>
              <p className="truncate text-[11px] font-medium text-[--text-3]">
                {metric.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PersonalPerformanceCard({
  stats,
  fallbackProgress,
  fallbackStatus,
}: {
  stats: MyProgressStats | null;
  fallbackProgress: number;
  fallbackStatus?: string;
}) {
  const rate = stats?.progressPercentage ?? fallbackProgress;
  const status = stats?.performanceStatus ?? fallbackStatus;
  const statusLabel =
    status === "good"
      ? "خوب"
      : status === "weak" || status === "bad"
        ? "بد"
        : status === "normal"
          ? "متوسط"
          : "—";
  const statusClass =
    status === "good"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
      : status === "weak" || status === "bad"
        ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
  const metrics = [
    { label: "امتیاز", value: stats?.score ?? 0, color: "text-amber-600" },
    {
      label: "پیشرفت پروژه‌ها",
      value: `${stats?.taskProgressPercentage ?? 0}%`,
      color: "text-indigo-600",
    },
    {
      label: "پیشرفت گزارش‌ها",
      value: `${stats?.fixedTaskProgressPercentage ?? 0}%`,
      color: "text-[#1f7a8c]",
    },
    { label: "پیشرفت کلی", value: `${rate}%`, color: "text-emerald-600" },
  ];

  return (
    <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={17} className="text-violet-600" />
          <h2 className="font-bold">عملکرد من</h2>
        </div>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[--border]">
          <div
            className="h-full rounded-full bg-gradient-to-l from-violet-600 to-violet-400"
            style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
          />
        </div>
        <span className="text-sm font-bold text-violet-600">{rate}%</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-[--surface-2] py-3">
            <p className={`text-xl font-bold ${metric.color}`}>
              {metric.value}
            </p>
            <p className="text-[11px] text-[--text-3]">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
