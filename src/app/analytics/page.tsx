"use client";

/* eslint-disable @next/next/no-img-element */

import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import DateObject from "react-date-object";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Loader2,
  MessageSquareText,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";

import {
  fixedTaskApi,
  getId,
  managerApi,
  normalizeList,
  type DailyDurationBalance,
  type FixedTask,
  type MyDailyProgressStats,
  type Task,
  type WorkStatusCounts,
  type WorkStatusSummaryUser,
} from "@/lib/api";
import {
  useFeedbackContext,
  useFixedTaskContext,
  useManagementContext,
  useSessionContext,
} from "../_components/taskino-context";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { fixedTaskOccurrenceKey } from "../_lib/fixed-task-identity";
import {
  avatarUrl,
  formatDate,
  recurrenceLabel,
  userName,
} from "../_lib/task-helpers";

const emptyCounts: WorkStatusCounts = {
  done: 0,
  overdueUnfinished: 0,
  todo: 0,
  total: 0,
};

const statusRows = [
  { key: "done", label: "انجام‌شده", color: "#10b981" },
  { key: "todo", label: "در انتظار", color: "#f59e0b" },
  { key: "overdueUnfinished", label: "معوق", color: "#ef4444" },
] as const;

type WorkTypeFilter = "all" | "projects" | "reports";
type StatusFilter = "all" | (typeof statusRows)[number]["key"];
type WorkDetailLists<T> = {
  done: T[];
  overdue: T[];
  todo: T[];
};
type FixedTaskLists = WorkDetailLists<FixedTask>;
type TaskLists = WorkDetailLists<Task>;
type WorkDetailListKey<T> = keyof WorkDetailLists<T>;

function dateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function jalaliPickerDate(date: Date) {
  return new DateObject({ calendar: jalali, date, locale: persianFa });
}

function datePickerValue(value: string) {
  return value ? jalaliPickerDate(new Date(`${value}T00:00:00`)) : "";
}

function sameDayRangeEnd(from: string, to: string) {
  if (from !== to) return to;
  const nextDay = new Date(`${to}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.toISOString();
}

function todayRange() {
  const now = new Date();
  const today = dateParam(now);
  return {
    from: today,
    to: today,
  };
}

function completionRate(counts: WorkStatusCounts) {
  return counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
}

function parseDateBoundary(value: string, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return date;
}

function mergeFixedTasks(...lists: FixedTask[][]) {
  return [
    ...new Map(
      lists
        .flat()
        .map((task) => [fixedTaskOccurrenceKey(task) || getId(task), task]),
    ).values(),
  ];
}

function fixedTaskDetailDate(
  task: FixedTask,
  listKey: WorkDetailListKey<FixedTask>,
) {
  return listKey === "done"
    ? task.doneTime || task.updatedAt
    : task.endDate || task.nextRunAt;
}

function taskDetailDate(task: Task, listKey: WorkDetailListKey<Task>) {
  return listKey === "done"
    ? task.doneTime || task.updatedAt
    : task.endDate || task.dueDate;
}

export default function AnalyticsPage() {
  const { currentUser, isManager, token } = useSessionContext();
  const { loadingData } = useFeedbackContext();
  const { managerStats, users } = useManagementContext();
  const { fixedTasks, setFixedTasks } = useFixedTaskContext();
  const initialRange = todayRange();
  const selectableUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          getId(user) &&
          (user.roles === "supervisor" || user.roles === "specialist"),
      ),
    [users],
  );
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activeRange, setActiveRange] = useState(initialRange);
  const [summaries, setSummaries] = useState<WorkStatusSummaryUser[]>([]);
  const [dailyProgress, setDailyProgress] = useState<
    Record<string, MyDailyProgressStats>
  >({});
  const [ratingTask, setRatingTask] = useState<FixedTask | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [durationBalances, setDurationBalances] = useState<
    Record<string, DailyDurationBalance>
  >({});
  const [fixedTaskLists, setFixedTaskLists] = useState<
    Record<string, FixedTaskLists>
  >({});
  const [taskLists, setTaskLists] = useState<Record<string, TaskLists>>({});
  const [detailsLoadingUserId, setDetailsLoadingUserId] = useState<
    string | null
  >(null);
  const [taskDetailsLoadingUserId, setTaskDetailsLoadingUserId] = useState<
    string | null
  >(null);
  const [durationLoadingUserId, setDurationLoadingUserId] = useState<
    string | null
  >(null);
  const workTypeFilter: WorkTypeFilter = "all";
  const statusFilter: StatusFilter = "all";
  const [loading, setLoading] = useState(false);
  const [hasLoadedSummaries, setHasLoadedSummaries] = useState(false);
  const [error, setError] = useState("");
  const showInitialSkeleton =
    summaries.length === 0 &&
    !hasLoadedSummaries &&
    (loadingData || loading || selectableUsers.length > 0);
  const skeletonCount = selectableUsers.length
    ? Math.min(Math.max(selectableUsers.length, 1), 4)
    : 3;
  const completedReportsByUser = useMemo(() => {
    const rangeStart = parseDateBoundary(activeRange.from);
    const rangeEnd = parseDateBoundary(activeRange.to, true);
    const grouped = new Map<string, FixedTask[]>();
    if (!rangeStart || !rangeEnd) return grouped;

    for (const task of fixedTasks) {
      if (task.status !== "done" || !task.doneTime) continue;
      const doneAt = new Date(task.doneTime);
      if (
        Number.isNaN(doneAt.getTime()) ||
        doneAt < rangeStart ||
        doneAt > rangeEnd
      ) {
        continue;
      }

      const userId = getId(task.assignedTo);
      if (!userId) continue;
      grouped.set(userId, [...(grouped.get(userId) ?? []), task]);
    }

    return grouped;
  }, [activeRange, fixedTasks]);

  async function fetchSummaries() {
    if (!from || !to || selectableUsers.length === 0) return;
    if (from > to) {
      setError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      return;
    }

    setLoading(true);
    setError("");
    const rangeTo = sameDayRangeEnd(from, to);
    setActiveRange({ from, to });
    try {
      const results = await Promise.all(
        selectableUsers.map(async (user) => {
          const userId = getId(user);
          const [summary, progress] = await Promise.all([
            managerApi.workStatusSummary(token, { from, to: rangeTo, userId }),
            managerApi.userDailyProgress(token, userId, { from, to: rangeTo }),
          ]);
          return { progress, summary, userId };
        }),
      );
      const summariesByUserId = new Map(
        results
          .flatMap((result) => result.summary.users)
          .filter((summary) => summary.userId)
          .map((summary) => [summary.userId, summary]),
      );
      setSummaries(
        selectableUsers.flatMap((user) => {
          const userId = getId(user);
          if (!userId) return [];

          const summary = summariesByUserId.get(userId);

          return [
            {
              ...(summary ?? {
                email: user.email,
                firstName: user.firstName,
                fixedTasks: { ...emptyCounts },
                lastName: user.lastName,
                tasks: { ...emptyCounts },
                userId,
              }),
              avatarKey: user.avatarKey ?? summary?.avatarKey,
            },
          ];
        }),
      );
      setDailyProgress(
        Object.fromEntries(
          results.map((result) => [result.userId, result.progress]),
        ),
      );
      setExpandedUserId(null);
      setDurationBalances({});
      setFixedTaskLists({});
      setTaskLists({});
    } catch (err) {
      setSummaries([]);
      setDailyProgress({});
      setDurationBalances({});
      setError(
        err instanceof Error ? err.message : "دریافت گزارش عملکرد ناموفق بود.",
      );
    } finally {
      setHasLoadedSummaries(true);
      setLoading(false);
    }
  }

  async function loadSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchSummaries();
  }

  async function toggleUser(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    const needsDuration = !durationBalances[userId];
    const needsDetails = !fixedTaskLists[userId];
    const needsTaskDetails = !taskLists[userId];
    if (!needsDuration && !needsDetails && !needsTaskDetails) return;

    if (needsDuration) setDurationLoadingUserId(userId);
    if (needsDetails) setDetailsLoadingUserId(userId);
    if (needsTaskDetails) setTaskDetailsLoadingUserId(userId);

    const { from: activeFrom, to: activeTo } = activeRange;
    const rangeTo = sameDayRangeEnd(activeFrom, activeTo);

    const [durationResult, detailsResult, taskDetailsResult] =
      await Promise.allSettled([
        needsDuration
          ? managerApi.dailyDurationBalance(token, {
              from: activeFrom,
              to: rangeTo,
              userId,
            })
          : Promise.resolve(null),
        needsDetails
          ? Promise.all([
              managerApi.overdueFixedTasks(token, {
                from: activeFrom,
                to: rangeTo,
                userId,
              }),
              managerApi.doneFixedTasks(token, {
                from: activeFrom,
                to: rangeTo,
                userId,
              }),
              managerApi.todoFixedTasks(token, { userId }),
            ])
          : Promise.resolve(null),
        needsTaskDetails
          ? Promise.all([
              managerApi.overdueTasks(token, {
                from: activeFrom,
                to: rangeTo,
                userId,
              }),
              managerApi.doneTasks(token, {
                from: activeFrom,
                to: rangeTo,
                userId,
              }),
              managerApi.todoTasks(token, {
                from: activeFrom,
                to: rangeTo,
                userId,
              }),
            ])
          : Promise.resolve(null),
      ]);

    if (durationResult.status === "fulfilled" && durationResult.value) {
      const durationBalance = durationResult.value as DailyDurationBalance;
      setDurationBalances((current) => ({
        ...current,
        [userId]: durationBalance,
      }));
    }
    if (detailsResult.status === "fulfilled" && detailsResult.value) {
      const [overdue, done, todo] = detailsResult.value;
      setFixedTaskLists((current) => ({
        ...current,
        [userId]: {
          done: mergeFixedTasks(
            normalizeList(done),
            completedReportsByUser.get(userId) ?? [],
          ),
          overdue: normalizeList(overdue),
          todo: normalizeList(todo),
        },
      }));
    }
    if (taskDetailsResult.status === "fulfilled" && taskDetailsResult.value) {
      const [overdue, done, todo] = taskDetailsResult.value;
      setTaskLists((current) => ({
        ...current,
        [userId]: {
          done: done.data,
          overdue: overdue.data,
          todo: todo.data,
        },
      }));
    }

    const rejectedResult = [
      durationResult,
      detailsResult,
      taskDetailsResult,
    ].find((result) => result.status === "rejected");
    if (rejectedResult?.status === "rejected") {
      setError(
        rejectedResult.reason instanceof Error
          ? rejectedResult.reason.message
          : "دریافت جزئیات عملکرد کاربر ناموفق بود.",
      );
    }
    setDurationLoadingUserId(null);
    setDetailsLoadingUserId(null);
    setTaskDetailsLoadingUserId(null);
  }

  function handleRatedTask(ratedTask: FixedTask) {
    const ratedTaskId = getId(ratedTask);
    setFixedTasks((current) =>
      current.map((task) =>
        getId(task) === ratedTaskId ? { ...task, ...ratedTask } : task,
      ),
    );
    setFixedTaskLists((current) =>
      Object.fromEntries(
        Object.entries(current).map(([userId, lists]) => [
          userId,
          Object.fromEntries(
            Object.entries(lists).map(([key, tasks]) => [
              key,
              tasks.map((task) =>
                getId(task) === ratedTaskId ? { ...task, ...ratedTask } : task,
              ),
            ]),
          ) as FixedTaskLists,
        ]),
      ),
    );
    setRatingTask(null);
  }

  const loadLatestSummaries = useEffectEvent(fetchSummaries);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLatestSummaries(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectableUsers, token]);

  if (!isManager) return null;

  return (
    <>
      <LandingPageEntrance className="space-y-5 pb-8 [&>div:nth-child(2)]:relative [&>div:nth-child(2)]:z-30">
        <ManagerSummaryBanner
          activeUsers={managerStats?.activeUsers ?? users.length}
          firstName={userName(currentUser ?? undefined).split(" ")[0]}
        />

        <header className="rounded-2xl bg-[--surface] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-balance text-xl font-black sm:text-2xl">
                عملکرد تیم
              </h1>
            </div>

            <form
              className="grid gap-3 sm:grid-cols-[minmax(150px,.8fr)_minmax(150px,.8fr)_auto]"
              onSubmit={loadSummary}
            >
              <DateField label="از تاریخ" onChange={setFrom} value={from} />
              <DateField label="تا تاریخ" onChange={setTo} value={to} />
              <button
                className="flex h-11 min-w-28 items-center justify-center gap-2 self-end rounded-xl bg-[#1f7a8c] px-4 text-sm font-black text-white shadow-lg shadow-[#1f7a8c]/20 transition-transform duration-150 ease-out hover:bg-[#186777] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || selectableUsers.length === 0}
                type="submit"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Search size={17} />
                )}
                نمایش
              </button>
            </form>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}
        </header>

        <AnimatePresence initial={false} mode="wait">
          {showInitialSkeleton ? (
            <motion.div
              aria-label="در حال دریافت گزارش کاربران"
              className="space-y-4"
              exit={{
                filter: "blur(4px)",
                opacity: 0,
                transition: { duration: 0.15, ease: "easeIn" },
                y: -8,
              }}
              key="analytics-loading"
              role="status"
            >
              {Array.from({ length: skeletonCount }, (_, index) => (
                <AnalyticsCardSkeleton key={index} />
              ))}
            </motion.div>
          ) : summaries.length > 0 ? (
            <motion.div className="space-y-4" key="analytics-content">
              {summaries.map((summaryUser, index) => (
                <UserAnalyticsCard
                  completedReports={
                    completedReportsByUser.get(summaryUser.userId) ?? []
                  }
                  durationBalance={durationBalances[summaryUser.userId]}
                  durationLoading={durationLoadingUserId === summaryUser.userId}
                  entranceIndex={index}
                  expanded={expandedUserId === summaryUser.userId}
                  fixedTaskDetails={fixedTaskLists[summaryUser.userId]}
                  fixedTaskDetailsLoading={
                    detailsLoadingUserId === summaryUser.userId
                  }
                  key={summaryUser.userId}
                  onRateFixedTask={setRatingTask}
                  onToggle={() => void toggleUser(summaryUser.userId)}
                  progress={dailyProgress[summaryUser.userId]}
                  role={
                    selectableUsers.find(
                      (user) => getId(user) === summaryUser.userId,
                    )?.roles
                  }
                  statusFilter={statusFilter}
                  summary={summaryUser}
                  taskDetails={taskLists[summaryUser.userId]}
                  taskDetailsLoading={
                    taskDetailsLoadingUserId === summaryUser.userId
                  }
                  workTypeFilter={workTypeFilter}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className="rounded-2xl bg-[--surface] px-5 py-12 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              initial={{ filter: "blur(4px)", opacity: 0, y: 8 }}
              key="analytics-empty"
              transition={{ bounce: 0, duration: 0.3, type: "spring" }}
            >
              <UserRound className="mx-auto text-[--text-3]" size={30} />
              <p className="mt-3 text-sm font-bold text-[--text-2]">
                اطلاعاتی برای نمایش پیدا نشد.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </LandingPageEntrance>
      <AnimatePresence initial={false}>
        {ratingTask && (
          <FixedTaskRatingModal
            key={getId(ratingTask)}
            onClose={() => setRatingTask(null)}
            onRated={handleRatedTask}
            task={ratingTask}
            token={token}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AnalyticsCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-3xl bg-[--surface] p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:p-5"
    >
      <div className="flex animate-pulse flex-col gap-5 motion-reduce:animate-none xl:flex-row xl:items-center">
        <div className="flex items-center gap-3 xl:w-64">
          <span className="h-14 w-14 shrink-0 rounded-2xl bg-[--border]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-28 rounded-full bg-[--border]" />
            <span className="block h-3 w-40 max-w-full rounded-full bg-[--surface-2]" />
          </span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              className="h-[58px] rounded-xl bg-[--surface-2]"
              key={index}
            />
          ))}
        </div>
        <span className="h-11 w-full shrink-0 rounded-xl bg-[--surface-2] xl:w-32" />
      </div>
    </div>
  );
}

function AnalyticsUserAvatar({
  displayName,
  summary,
}: {
  displayName: string;
  summary: WorkStatusSummaryUser;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = avatarUrl(summary);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <span
      className="group/avatar relative shrink-0"
      tabIndex={showImage ? 0 : undefined}
    >
      <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
        <UserRound size={23} />
        {showImage && (
          <img
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            onError={() => setImageFailed(true)}
            src={imageUrl}
          />
        )}
      </span>

      {showImage && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-16 z-30 h-44 w-44 -translate-y-1/2 overflow-hidden rounded-3xl bg-[--surface] p-2 opacity-0 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_14px_32px_rgba(15,23,42,0.2)] transition-[opacity,filter] duration-150 ease-in [filter:blur(4px)] group-hover/avatar:opacity-100 group-hover/avatar:duration-300 group-hover/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-hover/avatar:[filter:blur(0px)] group-focus-visible/avatar:opacity-100 group-focus-visible/avatar:duration-300 group-focus-visible/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-focus-visible/avatar:[filter:blur(0px)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_14px_32px_rgba(0,0,0,0.35)]"
        >
          <img
            alt=""
            className="h-full w-full rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            src={imageUrl}
          />
        </span>
      )}
    </span>
  );
}

function UserAnalyticsCard({
  completedReports,
  durationBalance,
  durationLoading,
  entranceIndex,
  expanded,
  fixedTaskDetails,
  fixedTaskDetailsLoading,
  onRateFixedTask,
  onToggle,
  progress,
  role,
  statusFilter,
  summary,
  taskDetails,
  taskDetailsLoading,
  workTypeFilter,
}: {
  completedReports: FixedTask[];
  durationBalance?: DailyDurationBalance;
  durationLoading: boolean;
  entranceIndex: number;
  expanded: boolean;
  fixedTaskDetails?: FixedTaskLists;
  fixedTaskDetailsLoading: boolean;
  onRateFixedTask: (task: FixedTask) => void;
  onToggle: () => void;
  progress?: MyDailyProgressStats;
  role?: string;
  statusFilter: StatusFilter;
  summary: WorkStatusSummaryUser;
  taskDetails?: TaskLists;
  taskDetailsLoading: boolean;
  workTypeFilter: WorkTypeFilter;
}) {
  const projectCounts = summary.tasks ?? emptyCounts;
  const baseReportCounts = summary.fixedTasks ?? emptyCounts;
  const completedFromDailyProgress =
    progress?.data?.reduce(
      (sum, day) => sum + (day.completedFixedTasks ?? 0),
      0,
    ) ?? 0;
  const completedReportCount = Math.max(
    baseReportCounts.done,
    completedFromDailyProgress,
    completedReports.length,
  );
  const reportCounts = {
    ...baseReportCounts,
    done: completedReportCount,
    total: Math.max(
      baseReportCounts.total,
      completedReportCount +
        baseReportCounts.todo +
        baseReportCounts.overdueUnfinished,
    ),
  };
  const showProjects =
    workTypeFilter === "all" || workTypeFilter === "projects";
  const showReports = workTypeFilter === "all" || workTypeFilter === "reports";
  const total =
    (showProjects ? projectCounts.total : 0) +
    (showReports ? reportCounts.total : 0);
  const done =
    (showProjects ? projectCounts.done : 0) +
    (showReports ? reportCounts.done : 0);
  const open = Math.max(total - done, 0);
  const rate = total ? Math.round((done / total) * 100) : 0;
  const roleLabel =
    role === "supervisor"
      ? "سرپرست"
      : role === "specialist"
        ? "کارشناس"
        : "عضو تیم";
  const displayName =
    [summary.firstName, summary.lastName].filter(Boolean).join(" ") ||
    summary.email ||
    "کاربر";
  const visibleFixedTaskDetails = fixedTaskDetails
    ? {
        ...fixedTaskDetails,
        done: mergeFixedTasks(fixedTaskDetails.done, completedReports),
      }
    : fixedTaskDetails;

  return (
    <motion.article
      animate={{ filter: "blur(0px)", opacity: 1, scale: 1, y: 0 }}
      initial={{ filter: "blur(8px)", opacity: 0, scale: 0.985, y: 18 }}
      layout
      transition={{
        default: {
          bounce: 0,
          delay: Math.min(entranceIndex * 0.07, 0.35),
          duration: 0.45,
          type: "spring",
        },
        layout: { bounce: 0, duration: 0.3, type: "spring" },
      }}
      className="relative overflow-visible rounded-3xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.05)] transition-[box-shadow] duration-200 hover:z-20 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_14px_32px_rgba(15,23,42,0.08)] focus-within:z-20 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-3 xl:w-64">
            <AnalyticsUserAvatar displayName={displayName} summary={summary} />
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-[--text]">
                {displayName}
              </h2>
              <p className="mt-0.5 truncate text-xs text-[--text-3]">
                {roleLabel}
                {summary.email ? ` · ${summary.email}` : ""}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryMetric label="همه کارها" value={total} />
            <SummaryMetric label="تمام شده" tone="success" value={done} />
            <SummaryMetric label="باقی مانده" tone="warning" value={open} />
            <SummaryMetric label="پیشرفت" tone="accent" value={`${rate}٪`} />
          </div>

          <button
            aria-expanded={expanded}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1f7a8c]/10 pr-4 pl-3.5 text-sm font-black text-[#1f7a8c] transition-[background-color,transform] duration-150 hover:bg-[#1f7a8c]/15 active:scale-[0.96]"
            onClick={onToggle}
            type="button"
          >
            {expanded ? "بستن" : "جزئیات بیشتر"}
            <ChevronDown
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              size={17}
            />
          </button>
        </div>

      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <div className="rounded-b-3xl border-t border-[--border] bg-[--surface-2]/50 p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <TimeSummary
                  data={durationBalance}
                  loading={durationLoading}
                />
                {showProjects && (
                  <Panel
                    icon={FolderKanban}
                    title="گزارشات محول شده به کارشناس"
                  >
                    <StatusBreakdown
                      accent="#1f7a8c"
                      counts={projectCounts}
                      statusFilter={statusFilter}
                    />
                  </Panel>
                )}
                {showReports && (
                  <Panel icon={FileText} title="گزارش‌ها">
                    <StatusBreakdown
                      accent="#7c3aed"
                      counts={reportCounts}
                      statusFilter={statusFilter}
                    />
                  </Panel>
                )}
              </div>

              {showReports && (
                <div className="mt-4">
                  <FixedTaskDetailsPanel
                    data={visibleFixedTaskDetails}
                    loading={fixedTaskDetailsLoading}
                    onRate={onRateFixedTask}
                    statusFilter={statusFilter}
                  />
                </div>
              )}
              {showProjects && (
                <div className="mt-4">
                  <TaskDetailsPanel
                    data={taskDetails}
                    loading={taskDetailsLoading}
                    statusFilter={statusFilter}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function FixedTaskDetailsPanel({
  data,
  loading,
  onRate,
  statusFilter,
}: {
  data?: FixedTaskLists;
  loading: boolean;
  onRate: (task: FixedTask) => void;
  statusFilter: StatusFilter;
}) {
  return (
    <WorkDetailsPanel
      data={data}
      dateFilter={{
        getItemDate: fixedTaskDetailDate,
        title: "فیلتر بازه تاریخ گزارش‌ها",
      }}
      description="یک وضعیت را انتخاب کنید تا فهرست کامل گزارش‌های آن را ببینید."
      itemLabel="گزارش"
      loading={loading}
      renderItem={(task, listKey) => (
        <FixedTaskDetailRow listKey={listKey} onRate={onRate} task={task} />
      )}
      statusFilter={statusFilter}
      title="جزئیات گزارش‌ها"
      titleIcon={FileText}
      titleTone="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
    />
  );
}

function TaskDetailsPanel({
  data,
  loading,
  statusFilter,
}: {
  data?: TaskLists;
  loading: boolean;
  statusFilter: StatusFilter;
}) {
  return (
    <WorkDetailsPanel
      data={data}
      dateFilter={{
        getItemDate: taskDetailDate,
        title: "فیلتر بازه تاریخ گزارشات محول شده به کارشناس",
      }}
      description="یک وضعیت را انتخاب کنید تا گزارشات محول شده به کارشناس این کاربر را با جزئیات ببینید."
      itemLabel="گزارشات محول شده به کارشناس"
      loading={loading}
      renderItem={(task, listKey) => (
        <TaskDetailRow listKey={listKey} task={task} />
      )}
      statusFilter={statusFilter}
      title="جزئیات گزارشات محول شده به کارشناس"
      titleIcon={FolderKanban}
      titleTone="bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]"
    />
  );
}

function WorkDetailsPanel<T>({
  data,
  dateFilter,
  description,
  itemLabel,
  loading,
  renderItem,
  statusFilter,
  title,
  titleIcon: TitleIcon,
  titleTone,
}: {
  data?: WorkDetailLists<T>;
  dateFilter?: {
    getItemDate: (item: T, listKey: WorkDetailListKey<T>) => string | undefined;
    title: string;
  };
  description: string;
  itemLabel: string;
  loading: boolean;
  renderItem: (item: T, listKey: WorkDetailListKey<T>) => React.ReactNode;
  statusFilter: StatusFilter;
  title: string;
  titleIcon: typeof FileText;
  titleTone: string;
}) {
  const [selectedKey, setSelectedKey] =
    useState<WorkDetailListKey<T>>("overdue");
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailFrom, setDetailFrom] = useState("");
  const [detailTo, setDetailTo] = useState("");
  const sections = [
    {
      emptySuffix: "معوقی",
      key: "overdue" as const,
      label: "معوق",
      statusKey: "overdueUnfinished" as const,
      activeTone:
        "bg-red-50 text-red-800 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.18)] dark:bg-red-950/35 dark:text-red-200",
      dot: "bg-red-500",
    },
    {
      emptySuffix: "در انتظاری",
      key: "todo" as const,
      label: "در انتظار",
      statusKey: "todo" as const,
      activeTone:
        "bg-amber-50 text-amber-800 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)] dark:bg-amber-950/35 dark:text-amber-200",
      dot: "bg-amber-500",
    },
    {
      emptySuffix: "انجام‌شده‌ای",
      key: "done" as const,
      label: "انجام‌شده",
      statusKey: "done" as const,
      activeTone:
        "bg-emerald-50 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)] dark:bg-emerald-950/35 dark:text-emerald-200",
      dot: "bg-emerald-500",
    },
  ];
  const filteredSection = sections.find(
    (section) => section.statusKey === statusFilter,
  );
  const activeSection =
    statusFilter === "all"
      ? (sections.find((section) => section.key === selectedKey) ?? sections[0])
      : (filteredSection ?? sections[0]);
  const isDateFilterActive = Boolean(dateFilter && (detailFrom || detailTo));
  const dateFilterError =
    detailFrom && detailTo && detailFrom > detailTo
      ? "تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد."
      : "";
  const visibleData = useMemo(() => {
    if (!data || !dateFilter || !isDateFilterActive || dateFilterError) {
      return data;
    }

    const fromDate = parseDateBoundary(detailFrom);
    const toDate = parseDateBoundary(detailTo, true);
    const entries = (Object.keys(data) as WorkDetailListKey<T>[]).map((key) => [
      key,
      data[key].filter((item) => {
        const rawDate = dateFilter.getItemDate(item, key);
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (Number.isNaN(itemDate.getTime())) return false;
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
      }),
    ]);

    return Object.fromEntries(entries) as WorkDetailLists<T>;
  }, [
    data,
    dateFilter,
    dateFilterError,
    detailFrom,
    detailTo,
    isDateFilterActive,
  ]);
  const activeTasks = visibleData?.[activeSection.key] ?? [];

  return (
    <section className="overflow-hidden rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <button
        aria-expanded={detailsExpanded}
        className={`flex w-full items-start gap-3 p-5 text-right transition-[background-color] hover:bg-[--surface-2] ${
          detailsExpanded ? "border-b border-[--border]" : ""
        }`}
        onClick={() => setDetailsExpanded((expanded) => !expanded)}
        type="button"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${titleTone}`}
        >
          <TitleIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-[--text]">{title}</h3>
          <p className="mt-1 text-pretty text-sm leading-6 text-[--text-2]">
            {description}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[--surface-2] text-[--text-2]">
          <ChevronDown
            className={`transition-transform duration-150 ${
              detailsExpanded ? "rotate-180" : ""
            }`}
            size={18}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {detailsExpanded && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18 } }}
            initial={{ height: 0, opacity: 0 }}
            key="details-body"
            transition={{ bounce: 0, duration: 0.28, type: "spring" }}
          >
            {loading ? (
              <div
                aria-label="در حال دریافت جزئیات گزارش‌ها"
                className="space-y-4 p-5"
                role="status"
              >
                <div className="grid animate-pulse grid-cols-2 gap-3 motion-reduce:animate-none lg:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="h-14 rounded-xl bg-[--surface-2]"
                      key={index}
                    />
                  ))}
                </div>
                <div className="animate-pulse space-y-3 rounded-xl bg-[--surface-2] p-3 motion-reduce:animate-none">
                  <div className="h-24 rounded-xl bg-[--surface]" />
                  <div className="h-24 rounded-xl bg-[--surface]" />
                </div>
              </div>
            ) : data ? (
              <div className="p-5">
                {dateFilter && (
                  <div className="mb-4 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-black text-[--text]">
                      <CalendarDays size={17} className="text-violet-600" />
                      {dateFilter.title}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <DateField
                        label="از تاریخ"
                        onChange={setDetailFrom}
                        value={detailFrom}
                      />
                      <DateField
                        label="تا تاریخ"
                        onChange={setDetailTo}
                        value={detailTo}
                      />
                      <button
                        className="h-11 rounded-xl border border-[--border] bg-[--surface] px-4 text-sm font-black text-[--text-2] transition-[background-color,transform] hover:bg-[--border] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!isDateFilterActive}
                        onClick={() => {
                          setDetailFrom("");
                          setDetailTo("");
                        }}
                        type="button"
                      >
                        پاک کردن
                      </button>
                    </div>
                    {dateFilterError && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                        {dateFilterError}
                      </p>
                    )}
                  </div>
                )}

                {statusFilter === "all" && (
                  <div
                    aria-label="فیلتر وضعیت گزارش‌های ثابت"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                    role="group"
                  >
                    {sections.map((section) => {
                      const selected = activeSection.key === section.key;
                      return (
                        <button
                          aria-pressed={selected}
                          className={`flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 text-right transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.96] ${
                            selected
                              ? section.activeTone
                              : "bg-[--surface-2] text-[--text-2] hover:bg-[--border]"
                          }`}
                          key={section.key}
                          onClick={() => setSelectedKey(section.key)}
                          type="button"
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`h-3 w-3 shrink-0 rounded-full ${section.dot}`}
                            />
                            <span className="text-sm font-black">
                              {section.label}
                            </span>
                          </span>
                          <span className="text-base font-black tabular-nums">
                            {visibleData?.[section.key].length ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={statusFilter === "all" ? "mt-5" : ""}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-3 w-3 rounded-full ${activeSection.dot}`}
                      />
                      <h4 className="text-base font-black text-[--text]">
                        گزارش‌های {activeSection.label}
                      </h4>
                    </div>
                    <span className="rounded-lg bg-[--surface-2] px-3 py-1.5 text-sm font-black tabular-nums text-[--text-2]">
                      {activeTasks.length} مورد
                    </span>
                  </div>

                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                      className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl bg-[--surface-2] p-3"
                      exit={{
                        filter: "blur(4px)",
                        opacity: 0,
                        transition: { duration: 0.15, ease: "easeIn" },
                        y: -8,
                      }}
                      initial={{ filter: "blur(4px)", opacity: 0, y: 10 }}
                      key={`${activeSection.key}-${detailFrom}-${detailTo}`}
                      transition={{ bounce: 0, duration: 0.3, type: "spring" }}
                    >
                      {activeTasks.length > 0 ? (
                        activeTasks.map((task, index) => (
                          <div key={`${activeSection.key}-${index}`}>
                            {renderItem(task, activeSection.key)}
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-[--surface] px-4 py-12 text-center text-sm font-bold text-[--text-3]">
                          هیچ {itemLabel} {activeSection.emptySuffix} وجود
                          ندارد.
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <p className="px-5 py-12 text-center text-sm font-bold text-[--text-3]">
                جزئیات گزارش‌ها در دسترس نیست.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const ratingOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function ratingLabel(score: number) {
  if (score <= 3) return "ضعیف";
  if (score <= 6) return "متوسط";
  return "خوب";
}

function FixedTaskRatingModal({
  onClose,
  onRated,
  task,
  token,
}: {
  onClose: () => void;
  onRated: (task: FixedTask) => void;
  task: FixedTask;
  token: string;
}) {
  const [score, setScore] = useState<number | null>(task.ratingScore ?? null);
  const [comment, setComment] = useState(task.ratingComment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, submitting]);

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ratingComment = comment.trim();
    if (score == null) {
      setError("انتخاب امتیاز الزامی است.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const ratedTask = await fixedTaskApi.rate(token, getId(task), {
        ...(ratingComment ? { ratingComment } : {}),
        score,
      });
      onRated(ratedTask);
    } catch (ratingError) {
      setError(
        ratingError instanceof Error
          ? ratingError.message
          : "ثبت امتیاز گزارش ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-label="امتیازدهی گزارش"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      role="presentation"
      transition={{ duration: 0.18 }}
    >
      <motion.section
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="rating-modal-title"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-3xl bg-[--surface] shadow-[0_24px_80px_rgba(2,6,23,0.35),0_0_0_1px_rgba(255,255,255,0.08)]"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        role="dialog"
        transition={{ bounce: 0, duration: 0.3, type: "spring" }}
      >
        <header className="flex items-start gap-3 border-b border-[--border] p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
            <Star size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="text-balance text-lg font-black text-[--text]"
              id="rating-modal-title"
            >
              امتیازدهی گزارش
            </h2>
            <p className="mt-1 truncate text-sm text-[--text-2]">
              {task.title}
            </p>
          </div>
          <button
            aria-label="بستن"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[--surface-2] text-[--text-2] transition-[background-color,transform] hover:bg-[--border] active:scale-[0.96]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <form className="space-y-5 p-5" onSubmit={submitRating}>
          <fieldset>
            <legend className="text-sm font-black text-[--text]">
              امتیاز عملکرد
            </legend>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ratingOptions.map((value) => {
                const selected = score === value;
                const displayValue = value.toLocaleString("fa-IR");
                return (
                  <button
                    aria-label={`${displayValue}، ${ratingLabel(value)}`}
                    aria-pressed={selected}
                    className={`min-h-16 rounded-xl px-2 py-2 text-center transition-[background-color,box-shadow,transform] active:scale-[0.96] ${
                      selected
                        ? "bg-[#1f7a8c] text-white shadow-lg shadow-[#1f7a8c]/20"
                        : "bg-[--surface-2] text-[--text-2] shadow-[inset_0_0_0_1px_var(--border)] hover:bg-[--border]"
                    }`}
                    key={value}
                    onClick={() => {
                      setScore(value);
                      setError("");
                    }}
                    type="button"
                  >
                    <span className="block text-lg font-black tabular-nums">
                      {displayValue}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold opacity-80">
                      {ratingLabel(value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-black text-[--text]">
              <MessageSquareText size={16} className="text-[#1f7a8c]" />
              نظر مدیر
            </span>
            <textarea
              autoFocus
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[--border] bg-[--surface-2] px-3 py-3 text-sm leading-6 text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              maxLength={1000}
              onChange={(event) => {
                setComment(event.target.value);
                setError("");
              }}
              placeholder="نظر خود درباره کیفیت انجام این گزارش را بنویسید…"
              value={comment}
            />
          </label>

          {error && (
            <p
              aria-live="polite"
              className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-xl bg-[--surface-2] px-5 text-sm font-black text-[--text-2] transition-[background-color,transform] hover:bg-[--border] active:scale-[0.96]"
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              انصراف
            </button>
            <button
              className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] px-5 text-sm font-black text-white shadow-lg shadow-[#1f7a8c]/20 transition-[background-color,transform] hover:bg-[#186777] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting || score == null}
              type="submit"
            >
              {submitting && <Loader2 className="animate-spin" size={17} />}
              ثبت امتیاز
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function FixedTaskDetailRow({
  listKey,
  onRate,
  task,
}: {
  listKey: keyof FixedTaskLists;
  onRate: (task: FixedTask) => void;
  task: FixedTask;
}) {
  const date =
    listKey === "done"
      ? task.doneTime || task.updatedAt
      : task.endDate || task.nextRunAt;
  const duration = formatTaskDuration(
    task.actualDurationMinutes ??
      task.approvedDurationMinutes ??
      task.approvedDurationInMinutes,
  );
  const dateLabel = listKey === "done" ? "تاریخ تکمیل" : "مهلت انجام";
  const durationLabel =
    task.actualDurationMinutes != null ? "زمان ثبت‌شده" : "زمان مورد نیاز";
  const borderTone = {
    done: "border-r-emerald-500",
    overdue: "border-r-red-500",
    todo: "border-r-amber-500",
  }[listKey];

  const isDone = listKey === "done";
  const ratingPercentage =
    task.ratingScore == null ? null : Math.round(task.ratingScore);
  const canRate = isDone && ratingPercentage == null;

  function openRating() {
    if (canRate) onRate(task);
  }

  return (
    <article
      className={`rounded-xl border-r-4 bg-[--surface] p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07)] ${borderTone} ${
        canRate
          ? "cursor-pointer transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_10px_24px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          : ""
      }`}
      onClick={openRating}
      onKeyDown={(event) => {
        if (canRate && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openRating();
        }
      }}
      role={canRate ? "button" : undefined}
      tabIndex={canRate ? 0 : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="text-base font-black leading-7 text-[--text]">
            {task.title}
          </h5>
          {(task.description || task.taskComment) && (
            <p className="mt-1.5 line-clamp-3 text-pretty text-sm leading-6 text-[--text-2]">
              {task.description || task.taskComment}
            </p>
          )}
        </div>
        {listKey === "overdue" && (
          <span className="flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-black text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={14} />
            مهلت گذشته
          </span>
        )}
        {isDone && (
          <span
            className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-black ${
              canRate
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Star size={14} />
            {ratingPercentage == null
              ? "برای ثبت امتیاز کلیک کنید"
              : `امتیاز ${ratingPercentage.toLocaleString("fa-IR")}`}
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-[--text-3]">
            <CalendarDays size={14} />
            {dateLabel}
          </dt>
          <dd className="mt-1 text-sm font-black text-[--text]">
            {date ? formatDate(date) : "ثبت نشده"}
          </dd>
        </div>
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-[--text-3]">
            <Clock3 size={14} />
            {durationLabel}
          </dt>
          <dd className="mt-1 text-sm font-black tabular-nums text-[--text]">
            {duration || "تعیین نشده"}
          </dd>
        </div>
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="text-xs font-bold text-[--text-3]">دوره تکرار</dt>
          <dd className="mt-1 text-sm font-black text-[--text]">
            {recurrenceLabel(task.recurrence)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function TaskDetailRow({
  listKey,
  task,
}: {
  listKey: keyof TaskLists;
  task: Task;
}) {
  const date =
    listKey === "done"
      ? task.doneTime || task.updatedAt
      : task.endDate || task.dueDate;
  const dateLabel = listKey === "done" ? "تاریخ تکمیل" : "مهلت انجام";
  const assignees =
    task.assignedTo?.map((assignee) => userName(assignee)).join("، ") ||
    "تعیین نشده";
  const hasExcelFile = Boolean(task.excelFile || task.completionExcelFile);
  const borderTone = {
    done: "border-r-emerald-500",
    overdue: "border-r-red-500",
    todo: "border-r-amber-500",
  }[listKey];

  return (
    <article
      className={`rounded-xl border-r-4 bg-[--surface] p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07)] ${borderTone}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="text-base font-black leading-7 text-[--text]">
            {task.title}
          </h5>
          {(task.description || task.taskComment) && (
            <p className="mt-1.5 line-clamp-3 text-pretty text-sm leading-6 text-[--text-2]">
              {task.description || task.taskComment}
            </p>
          )}
        </div>
        {listKey === "overdue" && (
          <span className="flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-black text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertTriangle size={14} />
            مهلت گذشته
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-[--text-3]">
            <CalendarDays size={14} />
            {dateLabel}
          </dt>
          <dd className="mt-1 text-sm font-black text-[--text]">
            {date ? formatDate(date) : "ثبت نشده"}
          </dd>
        </div>
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-[--text-3]">
            <UserRound size={14} />
            مسئول گزارشات محول شده به کارشناس
          </dt>
          <dd className="mt-1 truncate text-sm font-black text-[--text]">
            {assignees}
          </dd>
        </div>
        <div className="rounded-lg bg-[--surface-2] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-bold text-[--text-3]">
            <FileSpreadsheet size={14} />
            فایل اکسل
          </dt>
          <dd className="mt-1 text-sm font-black text-[--text]">
            {hasExcelFile ? "پیوست شده" : "بدون فایل"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function formatTaskDuration(minutes?: number | null) {
  if (minutes == null) return "";
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;
  if (hours && remainingMinutes)
    return `${hours} ساعت و ${remainingMinutes} دقیقه`;
  if (hours) return `${hours} ساعت`;
  return `${remainingMinutes} دقیقه`;
}

function SummaryMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "accent";
  value: number | string;
}) {
  const tones = {
    accent: "text-[#1f7a8c]",
    default: "text-[--text]",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="rounded-xl bg-[--surface-2] px-3 py-2.5">
      <p className={`text-xl font-black tabular-nums ${tones[tone]}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-bold text-[--text-3]">{label}</p>
    </div>
  );
}

function ManagerSummaryBanner({
  activeUsers,
  firstName,
}: {
  activeUsers: number;
  firstName: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-500 px-6 py-5 text-white shadow-lg shadow-indigo-500/15">
      <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 left-24 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">سلام، {firstName}</p>
          <h1 className="mt-0.5 text-xl font-bold">داشبورد مدیر</h1>
          <p className="mt-1 text-sm opacity-75">{activeUsers} کاربر</p>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <div className="text-center">
            <p className="text-2xl font-extrabold tabular-nums">
              {activeUsers}
            </p>
            <p className="text-[11px] opacity-75">کاربر فعال</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-bold text-[--text-2]">
      {label}
      <DatePicker
        calendar={jalali}
        calendarPosition="bottom-right"
        containerClassName="w-full"
        fixMainPosition
        format="YYYY/MM/DD"
        inputClass="mt-1.5 h-11 w-full rounded-xl border border-[--border] bg-[--surface-2] px-3 text-sm font-bold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
        locale={persianFa}
        onChange={(date) => {
          if (!date || Array.isArray(date)) return onChange("");
          onChange(dateParam(date.toDate()));
        }}
        portal
        value={datePickerValue(value)}
        zIndex={10000}
      />
    </label>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  tone: "project" | "report" | "done" | "todo";
  value: number;
}) {
  const tones = {
    done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    project:
      "bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]",
    report:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    todo: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  };
  return (
    <div className="rounded-2xl bg-[--surface] p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.05)] transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_14px_28px_rgba(15,23,42,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={19} />
      </div>
      <p className="text-xs font-bold text-[--text-3]">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof FolderKanban;
  title: string;
}) {
  return (
    <section className="rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_10px_26px_rgba(15,23,42,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <header className="flex items-center gap-3 border-b border-[--border] p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
          <Icon size={19} />
        </span>
        <h2 className="text-base font-black">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DonutChart({
  color,
  label,
  total,
  value,
}: {
  color: string;
  label: string;
  total: number;
  value: number;
}) {
  const rate = completionRate({ ...emptyCounts, done: value, total });
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = (rate / 100) * circumference;

  return (
    <div className="rounded-xl bg-[--surface-2] p-4">
      <div className="flex items-center justify-between gap-4">
        <svg
          className="h-32 w-32 -rotate-90"
          viewBox="0 0 120 120"
          role="img"
          aria-label={`${label} ${rate}%`}
        >
          <circle
            cx="60"
            cy="60"
            fill="none"
            r={radius}
            stroke="rgba(148,163,184,.18)"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            fill="none"
            r={radius}
            stroke={color}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            strokeWidth="12"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[--text-3]">نرخ تکمیل {label}</p>
          <p
            className="mt-1 text-3xl font-black tabular-nums"
            style={{ color }}
          >
            {rate}%
          </p>
          <p className="mt-2 text-xs font-semibold text-[--text-2]">
            {value} از {total} مورد انجام شده
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBreakdown({
  accent,
  counts,
  statusFilter,
}: {
  accent: string;
  counts: WorkStatusCounts;
  statusFilter: StatusFilter;
}) {
  const rows =
    statusFilter === "all"
      ? statusRows
      : statusRows.filter((status) => status.key === statusFilter);

  return (
    <div className="space-y-3">
      {rows.map((status) => {
        const value = counts[status.key];
        const width = counts.total
          ? Math.round((value / counts.total) * 100)
          : 0;
        return (
          <div key={status.key} className="rounded-xl bg-[--surface-2] p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.label}
              </span>
              <span className="tabular-nums">{value} مورد</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[--surface]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  backgroundColor:
                    status.key === "done" ? accent : status.color,
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimeSummary({
  data,
  loading,
}: {
  data?: DailyDurationBalance;
  loading: boolean;
}) {
  const entries = data?.entries ?? [];
  const expected =
    data?.totalExpected ??
    data?.expectedDailyMinutes ??
    entries.reduce((sum, entry) => sum + (entry.expectedMinutes ?? 0), 0);
  const actual =
    data?.totalActual ??
    data?.totalActualDurationMinutes ??
    entries.reduce((sum, entry) => sum + (entry.actualMinutes ?? 0), 0);
  const remaining = data?.remainingMinutes ?? expected - actual;

  return (
    <Panel icon={Clock3} title="ساعت‌ها">
      {loading ? (
        <div className="flex min-h-24 items-center justify-center">
          <Loader2 className="animate-spin text-[#1f7a8c]" size={22} />
        </div>
      ) : !data ? (
        <p className="py-7 text-center text-sm text-[--text-3]">
          اطلاعات ساعت ثبت نشده است.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <TimeMetric label="زمان مورد انتظار" tone="expected" value={expected} />
          <TimeMetric label="زمان ثبت‌شده" tone="actual" value={actual} />
          <TimeMetric
            label="زمان باقی‌مانده"
            tone={remaining > 0 ? "remaining" : "complete"}
            value={remaining}
          />
        </div>
      )}
    </Panel>
  );
}

function TimeMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "expected" | "actual" | "remaining" | "complete";
  value: number;
}) {
  const tones = {
    actual: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    complete:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    expected:
      "bg-cyan-50 text-[#1f7a8c] dark:bg-cyan-950/30 dark:text-cyan-300",
    remaining: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  };

  return (
    <div className={`rounded-xl px-3 py-2.5 ${tones[tone]}`}>
      <p className="text-[11px] font-bold opacity-75">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums">
        {formatTaskDuration(Math.abs(value))}
      </p>
    </div>
  );
}

function DurationBalancePanel({ data }: { data: any }) {
  const entries = Array.isArray(data)
    ? data
    : Array.isArray(data?.entries)
      ? data.entries
      : [];
  const hasEntries = entries.length > 0;
  const maxMinutes = hasEntries
    ? Math.max(
        ...entries.map((e: any) =>
          Math.max(e.expectedMinutes || 0, e.actualMinutes || 0, 1),
        ),
      )
    : 1;

  function fmt(minutes: number) {
    if (minutes == null || isNaN(minutes)) return "0 دقیقه";
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? "-" : "";
    return h > 0 ? `${sign}${h} ساعت ${m} دقیقه` : `${sign}${m} دقیقه`;
  }

  // Normalize: support both old shape (totalExpected/totalActual/totalBalance)
  // and new API shape (expectedDailyMinutes/totalActualDurationMinutes/remainingMinutes)
  const totalExpected =
    data?.totalExpected ??
    data?.expectedDailyMinutes ??
    entries.reduce((sum: number, e: any) => sum + (e.expectedMinutes || 0), 0);
  const totalActual =
    data?.totalActual ??
    data?.totalActualDurationMinutes ??
    entries.reduce((sum: number, e: any) => sum + (e.actualMinutes || 0), 0);
  // remainingMinutes = expected - actual, so balance (actual - expected) = -remaining
  const remaining = data?.remainingMinutes ?? totalExpected - totalActual;

  return (
    <div className="space-y-5">
      {/* Summary totals */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[--surface-2] p-3 text-center">
          <p className="text-[10px] font-bold text-[--text-3]">
            زمان مورد انتظار
          </p>
          <p className="mt-1 text-xl font-black tabular-nums text-[#1f7a8c]">
            {fmt(totalExpected)}
          </p>
        </div>
        <div className="rounded-xl bg-[--surface-2] p-3 text-center">
          <p className="text-[10px] font-bold text-[--text-3]">زمان واقعی</p>
          <p className="mt-1 text-xl font-black tabular-nums text-violet-600 dark:text-violet-400">
            {fmt(totalActual)}
          </p>
        </div>
        <div
          className={`rounded-xl p-3 text-center ${
            remaining <= 0
              ? "bg-emerald-50 dark:bg-emerald-950/30"
              : "bg-red-50 dark:bg-red-950/30"
          }`}
        >
          <p className="text-[10px] font-bold text-[--text-3]">باقیمانده</p>
          <p
            className={`mt-1 text-xl font-black tabular-nums ${
              remaining <= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {fmt(remaining)}
          </p>
        </div>
      </div>

      {/* Per-day bar chart — only shown when entries exist */}
      {hasEntries && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-[--text-3]">جزئیات روزانه</p>
          <div className="space-y-1.5 overflow-x-auto">
            {entries.map((entry: any, index: number) => {
              const expectedPct = Math.round(
                ((entry.expectedMinutes || 0) / maxMinutes) * 100,
              );
              const actualPct = Math.round(
                ((entry.actualMinutes || 0) / maxMinutes) * 100,
              );
              const isPositive = (entry.balance || 0) >= 0;
              const dateLabel = entry.date ? entry.date.slice(5) : ""; // MM-DD
              return (
                <div
                  key={entry.date || index}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="w-12 shrink-0 text-left font-mono text-[--text-3]">
                    {dateLabel}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-[--surface]">
                      <div
                        className="h-full rounded-full bg-[#1f7a8c]/70 transition-[width] duration-500"
                        style={{ width: `${expectedPct}%` }}
                      />
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-[--surface]">
                      <div
                        className="h-full rounded-full bg-violet-500/70 transition-[width] duration-500"
                        style={{ width: `${actualPct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`w-14 shrink-0 text-left font-mono font-bold tabular-nums ${
                      isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {isPositive && (entry.balance || 0) > 0 ? "+" : ""}
                    {fmt(entry.balance || 0)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 pt-1 text-[10px] font-semibold text-[--text-3]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-[#1f7a8c]/70" />
              انتظار
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-violet-500/70" />
              واقعی
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-emerald-500/70" />
              تراز مثبت
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-red-500/70" />
              تراز منفی
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
