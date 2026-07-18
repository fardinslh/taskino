"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import {
  BarChart2,
  CalendarDays,
  CircleDashed,
  ClipboardList,
  FolderKanban,
  Plus,
  Search,
  Star,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

import {
  fixedTaskApi,
  getId,
  managerApi,
  normalizeList,
  type FixedTask,
  type ListResponse,
} from "@/lib/api";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { AssigneeStack, Tooltip } from "../_components/shared";
import { TaskDeadlineCountdown } from "../_components/task-deadline-countdown";
import {
  useFixedTaskContext,
  useFeedbackContext,
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

function dateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function datePickerValue(value: string) {
  return value ? new Date(`${value}T00:00:00`) : "";
}

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
  const { currentUser, isManager, isSpecialist, isSupervisor, token } =
    useSessionContext();
  const { setError, setMessage } = useFeedbackContext();
  const {
    activeTasks,
    doneTasks,
    progress,
    tasks,
    specialistWorkSummary,
  } = useTaskContext();
  const { managerStats, managerTaskStatus, statsUsers, users } =
    useManagementContext();
  const {
    filteredFixedTemplates,
    fixedDoneTasks,
    fixedOpenTasks,
    fixedTodoCount,
    activeFixedTaskCount,
    fixedTasks,
    setFixedTasks,
    selectedFixedTask,
    onDragEnd,
    openFixedTaskForm,
    deleteFixedTask,
  } = useFixedTaskContext();
  const [ratingTaskId, setRatingTaskId] = useState<string | null>(null);
  const [draftFixedTaskFrom, setDraftFixedTaskFrom] = useState("");
  const [draftFixedTaskTo, setDraftFixedTaskTo] = useState("");
  const [appliedFixedTaskFrom, setAppliedFixedTaskFrom] = useState("");
  const [appliedFixedTaskTo, setAppliedFixedTaskTo] = useState("");
  const [fixedTaskDateLoading, setFixedTaskDateLoading] = useState(false);
  const [selectedFixedTaskUserId, setSelectedFixedTaskUserId] = useState("");
  const unfilteredFixedTasksRef = useRef<FixedTask[] | null>(null);
  const canMoveOwnFixedTasks = isSpecialist || isSupervisor;
  const fixedTaskDateFilterChanged =
    draftFixedTaskFrom !== appliedFixedTaskFrom ||
    draftFixedTaskTo !== appliedFixedTaskTo;
  const hasFixedTaskDateFilter =
    !!appliedFixedTaskFrom || !!appliedFixedTaskTo;
  const fixedTaskUsers = useMemo(
    () =>
      users
        .filter((user) => {
          const role = user.roles;
          return (
            (role === "specialist" || role === "supervisor") &&
            (!currentUser?.workField ||
              !user.workField ||
              user.workField === currentUser.workField)
          );
        })
        .toSorted((first, second) =>
          userName(first).localeCompare(userName(second), "fa"),
        ),
    [currentUser, users],
  );
  const boardFixedTemplates = useMemo(() => {
    let list = hasFixedTaskDateFilter ? fixedTasks : filteredFixedTemplates;

    if (hasFixedTaskDateFilter) {
      if (selectedPeriodFilter) {
        list = list.filter(
          (task) => (task.recurrence ?? "daily") === selectedPeriodFilter,
        );
      }
      if (selectedStatusFilter) {
        list = list.filter(
          (task) => (task.status ?? "todo") === selectedStatusFilter,
        );
      }

      const query = taskQuery.trim().toLowerCase();
      if (query) {
        list = list.filter((task) =>
          `${task.title} ${userName(task.assignedTo)} ${recurrenceLabel(task.recurrence)}`
            .toLowerCase()
            .includes(query),
        );
      }
    }

    if (selectedFixedTaskUserId) {
      list = list.filter(
        (task) => getId(task.assignedTo) === selectedFixedTaskUserId,
      );
    }

    return list;
  }, [
    filteredFixedTemplates,
    fixedTasks,
    hasFixedTaskDateFilter,
    selectedPeriodFilter,
    selectedStatusFilter,
    selectedFixedTaskUserId,
    taskQuery,
  ]);
  const filteredBoardSummary =
    hasFixedTaskDateFilter || selectedFixedTaskUserId
      ? boardFixedTemplates
    : null;
  const boardActiveFixedTaskCount =
    filteredBoardSummary?.length ?? activeFixedTaskCount;
  const boardFixedDoneTasks =
    filteredBoardSummary?.filter((task) => task.status === "done").length ??
    fixedDoneTasks;
  const boardFixedOpenTasks =
    filteredBoardSummary?.filter(
      (task) => (task.status ?? "todo") !== "done",
    )
      .length ?? fixedOpenTasks;

  async function loadFixedTasksForRange(from: string, to: string) {
    if (!isManager || !token) return false;

    setFixedTaskDateLoading(true);
    try {
      const response = await managerApi.fixedTasks(token, { from, to });
      const filteredTasks =
        !Array.isArray(response) &&
        "fixedTasks" in response &&
        Array.isArray(response.fixedTasks)
          ? response.fixedTasks
          : normalizeList(response as ListResponse<FixedTask>);
      setFixedTasks(filteredTasks);
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "دریافت گزارش‌های ثابت ناموفق بود.",
      );
      return false;
    } finally {
      setFixedTaskDateLoading(false);
    }
  }

  async function applyFixedTaskDateFilter() {
    if (!hasFixedTaskDateFilter) {
      unfilteredFixedTasksRef.current = fixedTasks;
    }
    const loaded = await loadFixedTasksForRange(
      draftFixedTaskFrom,
      draftFixedTaskTo,
    );
    if (!loaded) return;

    setSelectedPeriodFilter("");
    setAppliedFixedTaskFrom(draftFixedTaskFrom);
    setAppliedFixedTaskTo(draftFixedTaskTo);
  }

  function clearFixedTaskDateFilter() {
    setDraftFixedTaskFrom("");
    setDraftFixedTaskTo("");
    setAppliedFixedTaskFrom("");
    setAppliedFixedTaskTo("");
    if (unfilteredFixedTasksRef.current) {
      setFixedTasks(unfilteredFixedTasksRef.current);
      unfilteredFixedTasksRef.current = null;
    }
  }

  async function rateFixedTask(task: any, score: number) {
    const taskId = getId(task);
    if (!taskId || ratingTaskId) return;

    setRatingTaskId(taskId);
    try {
      const ratedTask = await fixedTaskApi.rate(token, taskId, { score });
      setFixedTasks((current) =>
        current.map((item) => (getId(item) === taskId ? ratedTask : item)),
      );
      setSelectedFixedTask((current) =>
        current && getId(current) === taskId ? ratedTask : current,
      );
      setMessage("امتیاز گزارش ثبت شد.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ثبت امتیاز گزارش ناموفق بود.",
      );
    } finally {
      setRatingTaskId(null);
    }
  }
  const fixedStatusColumns = selectedStatusFilter
    ? COLUMNS.filter((col) => col.status === selectedStatusFilter)
    : COLUMNS;
  const fixedStatusFilterLabel =
    selectedStatusFilter === "todo"
      ? "در انتظار شروع"
      : selectedStatusFilter === "done"
        ? "تکمیل شده"
        : "";
  const openFixedReportStatus = (status: "" | "todo" | "done") => {
    setActiveView("tasks");
    setSelectedStatusFilter(status);
    setBoardShowAll(true);
  };

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
          <div
            className={`grid grid-cols-2 gap-3 ${isManager ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
          >
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
                      گزارشات ثابت بر اساس دوره · {boardActiveFixedTaskCount} مورد ·{" "}
                      {boardFixedOpenTasks} در انتظار · {boardFixedDoneTasks} تکمیل شده
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
                  <select
                    aria-label="فیلتر گزارش‌های ثابت بر اساس کاربر"
                    className="h-8 w-44 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs font-semibold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                    onChange={(event) =>
                      setSelectedFixedTaskUserId(event.target.value)
                    }
                    value={selectedFixedTaskUserId}
                  >
                    <option value="">همه کاربران</option>
                    {fixedTaskUsers.map((user) => (
                      <option key={getId(user)} value={getId(user)}>
                        {userName(user)}
                      </option>
                    ))}
                  </select>
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

              {isManager && (
                <div className="flex flex-col gap-3 border-b border-[#cce8ef] bg-[#f7fcfd] px-5 py-3 dark:border-[#1f5060] dark:bg-[#0d1f2d] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#dff3f7] text-[#1f7a8c] shadow-[inset_0_0_0_1px_rgba(31,122,140,0.08)] dark:bg-[#123747] dark:text-[#55c4d5]">
                      <CalendarDays size={17} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[--text]">
                        فیلتر بازه تاریخ
                      </p>
                      <p className="mt-0.5 text-[10px] text-[--text-3]">
                        {hasFixedTaskDateFilter
                          ? "نتایج بازه انتخاب‌شده نمایش داده می‌شود"
                          : "تاریخ شروع و پایان را انتخاب کنید"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <DatePicker
                      calendar={jalali}
                      calendarPosition="bottom-right"
                      containerClassName="w-32"
                      format="YYYY/MM/DD"
                      inputClass="h-10 w-32 rounded-xl border border-[--border] bg-[--surface] px-3 text-center text-xs font-semibold tabular-nums text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                      locale={persianFa}
                      onChange={(date) => {
                        if (!date || Array.isArray(date)) {
                          setDraftFixedTaskFrom("");
                          return;
                        }
                        setDraftFixedTaskFrom(dateParam(date.toDate()));
                      }}
                      placeholder="از تاریخ"
                      portal
                      value={datePickerValue(draftFixedTaskFrom)}
                      zIndex={10000}
                    />
                    <span className="text-[11px] font-semibold text-[--text-3]">
                      تا
                    </span>
                    <DatePicker
                      calendar={jalali}
                      calendarPosition="bottom-right"
                      containerClassName="w-32"
                      format="YYYY/MM/DD"
                      inputClass="h-10 w-32 rounded-xl border border-[--border] bg-[--surface] px-3 text-center text-xs font-semibold tabular-nums text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                      locale={persianFa}
                      minDate={
                        datePickerValue(draftFixedTaskFrom) || undefined
                      }
                      onChange={(date) => {
                        if (!date || Array.isArray(date)) {
                          setDraftFixedTaskTo("");
                          return;
                        }
                        setDraftFixedTaskTo(dateParam(date.toDate()));
                      }}
                      placeholder="تا تاریخ"
                      portal
                      value={datePickerValue(draftFixedTaskTo)}
                      zIndex={10000}
                    />
                    <button
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1f7a8c] px-4 text-xs font-bold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-[#196b7b] hover:shadow-md active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:scale-100"
                      disabled={
                        !draftFixedTaskFrom ||
                        !draftFixedTaskTo ||
                        !fixedTaskDateFilterChanged ||
                        fixedTaskDateLoading
                      }
                      onClick={() => void applyFixedTaskDateFilter()}
                      type="button"
                    >
                      <Search size={14} />
                      {fixedTaskDateLoading ? "در حال اعمال…" : "اعمال فیلتر"}
                    </button>
                    {(draftFixedTaskFrom ||
                      draftFixedTaskTo ||
                      hasFixedTaskDateFilter) && (
                      <button
                        aria-label="حذف فیلتر بازه تاریخ"
                        className="flex size-10 items-center justify-center rounded-xl text-[--text-3] transition-[background-color,color,transform] hover:bg-[--surface] hover:text-[--text] active:scale-[0.96]"
                        disabled={fixedTaskDateLoading}
                        onClick={clearFixedTaskDateFilter}
                        type="button"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid gap-4 bg-[--surface-2]/40 p-4 lg:grid-cols-3">
                  {fixedStatusColumns.map((col: any) => {
                    const allItems = boardFixedTemplates.filter(
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
                                    fixedTaskDurationOverdueMinutes(ft);
                                  const fixedTaskDurationOverdue =
                                    fixedTaskSpentOverLimitMinutes != null;
                                  const hasManagerRating =
                                    ft.ratingScore != null;
                                  const displayedRating = Math.min(
                                    5,
                                    Math.max(0, Math.round(ft.ratingScore ?? 0)),
                                  );
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
                                          className={`cursor-pointer rounded-xl border border-[--border] border-t-[3px] border-t-[#1f7a8c] bg-[--surface] p-3.5 shadow-sm transition-[background-color,border-color,box-shadow] ${isManager ? "hover:shadow-md" : ""} ${canMoveOwnFixedTasks && (ft.status ?? "todo") !== "done" && !fixedTaskOverdue ? "cursor-grab touch-none active:cursor-grabbing" : ""} ${selectedFixedTask && getId(selectedFixedTask) === getId(ft) ? "ring-2 ring-[#1f7a8c]/45" : ""} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
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
                                            <span
                                              aria-label={`امتیاز مدیر: ${displayedRating} از ۵`}
                                              className="flex items-center gap-px text-amber-500"
                                              title={`امتیاز مدیر: ${displayedRating} از ۵`}
                                            >
                                              {[1, 2, 3, 4, 5].map((score) => (
                                                <Star
                                                  fill={
                                                    score <= displayedRating
                                                      ? "currentColor"
                                                      : "none"
                                                  }
                                                  key={score}
                                                  size={12}
                                                />
                                              ))}
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
                                        {isManager && col.status === "done" && (
                                          <div
                                            className="mt-3 flex items-center justify-between gap-3 border-t border-amber-500/15 pt-2.5"
                                            onClick={(event) =>
                                              event.stopPropagation()
                                            }
                                          >
                                            <span className="text-[11px] font-bold text-[--text-3]">
                                              امتیاز مدیر
                                            </span>
                                            <div
                                              aria-label="امتیازدهی گزارش"
                                              className="flex items-center gap-0.5"
                                              role="group"
                                            >
                                              {[1, 2, 3, 4, 5].map((score) => (
                                                <button
                                                  aria-label={`${score} ستاره`}
                                                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-[background-color,color,transform] hover:bg-amber-500/10 active:scale-[0.96] disabled:cursor-wait disabled:opacity-50 ${score <= displayedRating ? "text-amber-500" : "text-amber-500/35 dark:text-amber-400/35"}`}
                                                  disabled={ratingTaskId === getId(ft)}
                                                  key={score}
                                                  onClick={() =>
                                                    void rateFixedTask(ft, score)
                                                  }
                                                  type="button"
                                                >
                                                  <Star
                                                    fill={
                                                      score <= displayedRating
                                                        ? "currentColor"
                                                        : "none"
                                                    }
                                                    size={17}
                                                  />
                                                </button>
                                              ))}
                                            </div>
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
                  <div
                    className="min-h-[420px] lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]"
                    id="fixed-task-inline-detail"
                  >
                    {!selectedFixedTask && (
                      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl bg-[--surface]/55 px-6 text-center shadow-[inset_0_0_0_1px_var(--border)]">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
                          <ClipboardList size={22} />
                        </div>
                        <h3 className="mt-4 text-balance text-sm font-bold text-[--text]">
                          جزئیات گزارش
                        </h3>
                        <p className="mt-1 max-w-52 text-pretty text-xs leading-5 text-[--text-3]">
                          برای مشاهده جزئیات، یک گزارش را انتخاب کنید.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DragDropContext>
            </div>
          )}
        </LandingPageEntrance>
      )}
    </>
  );
}
