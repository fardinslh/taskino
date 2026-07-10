"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BarChart2,
  CalendarDays,
  CircleDashed,
  ClipboardList,
  FolderKanban,
  Plus,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { getId } from "@/lib/api";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { AssigneeStack, Tooltip } from "../_components/shared";
import { TaskDeadlineCountdown } from "../_components/task-deadline-countdown";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";
import {
  fixedTaskDurationOverdueMinutes,
  formatDurationMinutes,
} from "../_lib/fixed-task-timing";
import { COLUMNS, type TaskPeriod } from "../_lib/task-constants";
import {
  formatDate,
  isFixedTaskOverdue,
  recurrenceLabel,
  userName,
} from "../_lib/task-helpers";

const durationOverdueTooltip =
  "زمان صرف‌شده از زمان تعیین‌شده توسط مدیر بیشتر شده است.";

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

export default function TasksPage() {
  return <TasksPageContent />;
}

function TasksPageContent() {
  const [fixedTaskTimerNow, setFixedTaskTimerNow] = useState(() => Date.now());
  const {
    activeView,
    boardShowAll,
    selectedPeriodFilter,
    selectedStatusFilter,
    setActiveView,
    setBoardShowAll,
    setSelectedFixedTask,
    setSelectedPeriodFilter,
    setSelectedStatusFilter,
    setTaskQuery,
    taskQuery,
  } = useNavigationContext();
  const { currentUser, isManager, isSpecialist, isSupervisor } =
    useSessionContext();
  const {
    activeTasks,
    doneTasks,
    progress,
    tasks,
    specialistWorkSummary,
  } = useTaskContext();
  const { managerStats, managerTaskStatus, statsUsers } = useManagementContext();
  const {
    filteredFixedTemplates,
    fixedDoneTasks,
    fixedOpenTasks,
    fixedInProgressTasks,
    fixedTodoCount,
    activeFixedTaskCount,
    fixedTasks,
    onDragEnd,
    openFixedTaskForm,
    deleteFixedTask,
  } = useFixedTaskContext();
  const canMoveOwnFixedTasks = isSpecialist || isSupervisor;
  const fixedStatusColumns = selectedStatusFilter
    ? COLUMNS.filter((col) => col.status === selectedStatusFilter)
    : COLUMNS;
  const fixedStatusFilterLabel =
    selectedStatusFilter === "todo"
      ? "در انتظار شروع"
      : selectedStatusFilter === "in_progress"
        ? "در حال انجام"
        : selectedStatusFilter === "done"
          ? "تکمیل شده"
          : "";
  const openFixedReportStatus = (status: "" | "todo" | "in_progress" | "done") => {
    setActiveView("tasks");
    setSelectedStatusFilter(status);
    setBoardShowAll(true);
  };

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setFixedTaskTimerNow(Date.now()),
      30000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      {((!isSupervisor &&
        (activeView === "dashboard" || activeView === "tasks")) ||
        (isSupervisor && activeView === "tasks")) && (
        <LandingPageEntrance className="space-y-4">
          {/* Welcome banner */}
          {!isManager && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#1a6b7c] via-[#1f7a8c] to-[#2491a5] px-6 py-5 text-white shadow-lg shadow-[#1f7a8c]/15">
              <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-8 left-24 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">
                    سلام، {userName(currentUser ?? undefined).split(" ")[0]}
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold">داشبورد گزارش ها</h1>
                  <p className="mt-1 text-sm opacity-75">
                    {activeTasks === 0
                      ? "همه گزارش ها تکمیل شده‌اند"
                      : `${activeTasks} پروژه باز داری`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  {[
                    { n: tasks.length, l: "کل پروژه" },
                    { n: activeFixedTaskCount, l: "گزارشات ثابت" },
                    { n: `${progress}%`, l: "پیشرفت" },
                  ].map((s: any, i: number) => (
                    <div key={i} className="text-center">
                      <p className="text-2xl font-extrabold">{s.n}</p>
                      <p className="text-[11px] opacity-75">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {(isManager
              ? [
                  {
                    label: "گزارش ها",
                    value: activeFixedTaskCount,
                    sub: "گزارش ثابت",
                    icon: FolderKanban,
                    a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
                    onClick: () => setActiveView("fixed-reports"),
                  },
                  {
                    label: "گزارش های باز",
                    value: fixedOpenTasks,
                    sub: `${fixedOpenTasks} باز`,
                    icon: ClipboardList,
                    a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
                  },
                  {
                    label: "کاربران فعال",
                    value: managerStats?.activeUsers ?? statsUsers,
                    sub: "کاربر",
                    icon: UsersRound,
                    a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
                    onClick: () => undefined,
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
                    onClick: () => undefined,
                  },
                ]
              : [
                  {
                    label: "همه گزارشات",
                    value:
                      specialistWorkSummary?.totalFixedTasks ??
                      activeFixedTaskCount,
                    sub: "واگذارشده",
                    icon: FolderKanban,
                    a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
                    onClick: () => openFixedReportStatus(""),
                  },
                  {
                    label: "گزارش در حال انجام",
                    value: fixedInProgressTasks,
                    sub: "در حال انجام",
                    icon: ClipboardList,
                    a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
                    onClick: () => openFixedReportStatus("in_progress"),
                  },
                  {
                    label: "گزارش در حال انتظار",
                    value: fixedTodoCount,
                    sub: "در انتظار شروع",
                    icon: ClipboardList,
                    a: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
                    onClick: () => openFixedReportStatus("todo"),
                  },
                  {
                    label: "تکمیل شده",
                    value:
                      specialistWorkSummary?.completedFixedTasks ??
                      fixedDoneTasks,
                    sub: `${progress}% پیشرفت`,
                    icon: TrendingUp,
                    a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
                    onClick: () => openFixedReportStatus("done"),
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
                            f.isActive !== false && isFixedTaskOverdue(f),
                        ).length;
                        return od ? ` · ${od} مهلت‌گذشته` : "";
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedStatusFilter && (
                    <button
                      className="h-8 rounded-lg border border-[#1f7a8c]/30 bg-[#e8f4f7] px-3 text-xs font-semibold text-[#1f7a8c] transition hover:bg-[#d7eef4] dark:border-[#1f7a8c]/40 dark:bg-[#0f3040] dark:text-[#4fc3d5]"
                      onClick={() => setSelectedStatusFilter("")}
                      type="button"
                    >
                      {fixedStatusFilterLabel} ×
                    </button>
                  )}
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
                  {fixedStatusColumns.map((col: any) => {
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
                          <span
                            className={`rounded-full max-w-2.5 text-xs max-h-2.5 p-2.5 flex items-center justify-center font-bold ${col.badge}`}
                          >
                            {allItems.length}
                          </span>
                        </div>
                        <Droppable
                          droppableId={col.status}
                          isDropDisabled={!canMoveOwnFixedTasks}
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
                                  const fixedTaskSpentOverLimitMinutes =
                                    fixedTaskDurationOverdueMinutes(
                                      ft,
                                      fixedTaskTimerNow,
                                    );
                                  const fixedTaskDurationOverdue =
                                    fixedTaskSpentOverLimitMinutes != null;
                                  const hasManagerRating =
                                    ft.ratingScore != null;
                                  return (
                                  <Draggable
                                    key={getId(ft)}
                                    draggableId={getId(ft)}
                                    index={idx}
                                    isDragDisabled={
                                      !canMoveOwnFixedTasks ||
                                      (ft.status ?? "todo") === "done" ||
                                      fixedTaskOverdue
                                    }
                                  >
                                    {(dragProvided: any, dragSnapshot: any) => (
                                      <DraggablePortal
                                        enabled={dragSnapshot.isDragging}
                                      >
                                        <article
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          {...dragProvided.dragHandleProps}
                                          className={`cursor-pointer rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 shadow-sm transition-[background-color,border-color,box-shadow] ${isManager ? "hover:shadow-md" : ""} ${canMoveOwnFixedTasks && (ft.status ?? "todo") !== "done" && !fixedTaskOverdue ? "cursor-grab touch-none active:cursor-grabbing" : ""} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
                                          onClick={() => setSelectedFixedTask(ft)}
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
                                          {fixedTaskDurationOverdue && (
                                            <Tooltip
                                              content={durationOverdueTooltip}
                                            >
                                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">
                                                زمان صرف‌شده
                                              </span>
                                            </Tooltip>
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
                                        {ft.approvedDurationMinutes != null && (
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
                                        {fixedTaskDurationOverdue && (
                                          <Tooltip
                                            className="mt-2 w-full"
                                            content={durationOverdueTooltip}
                                          >
                                            <span className="flex w-full items-center justify-between rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                              <span className="font-semibold">
                                                زمان صرف‌شده:
                                              </span>
                                              <span className="font-extrabold tabular-nums">
                                                {formatDurationMinutes(
                                                  fixedTaskSpentOverLimitMinutes,
                                                )}
                                              </span>
                                            </span>
                                          </Tooltip>
                                        )}
                                        <TaskDeadlineCountdown
                                          className="mt-3"
                                          dueDate={ft.endDate ?? ft.nextRunAt}
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
        </LandingPageEntrance>
      )}
    </>
  );
}
