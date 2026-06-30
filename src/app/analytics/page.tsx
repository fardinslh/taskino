"use client";

import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
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
  Search,
  Target,
  Timer,
  UserRound,
} from "lucide-react";

import {
  getId,
  managerApi,
  normalizeList,
  type DailyDurationBalance,
  type FixedTask,
  type Task,
  type WorkStatusCounts,
  type WorkStatusSummaryUser,
} from "@/lib/api";
import {
  useFeedbackContext,
  useManagementContext,
  useSessionContext,
} from "../_components/taskino-context";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { ManagerScoreCard } from "../_components/manager-score-card";
import {
  formatDate,
  recurrenceLabel,
  userName,
} from "../_lib/task-helpers";

const emptyCounts: WorkStatusCounts = {
  done: 0,
  inProgress: 0,
  overdueUnfinished: 0,
  todo: 0,
  total: 0,
};

const statusRows = [
  { key: "done", label: "انجام‌شده", color: "#10b981" },
  { key: "inProgress", label: "در حال انجام", color: "#1f7a8c" },
  { key: "todo", label: "در انتظار", color: "#f59e0b" },
  { key: "overdueUnfinished", label: "معوق", color: "#ef4444" },
] as const;

type WorkTypeFilter = "all" | "projects" | "reports";
type StatusFilter = "all" | (typeof statusRows)[number]["key"];
type WorkDetailLists<T> = {
  done: T[];
  inProgress: T[];
  overdue: T[];
  todo: T[];
};
type FixedTaskLists = WorkDetailLists<FixedTask>;
type TaskLists = WorkDetailLists<Task>;

function dateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthRange() {
  const now = new Date();
  return {
    from: dateParam(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: dateParam(now),
  };
}

function completionRate(counts: WorkStatusCounts) {
  return counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
}

export default function AnalyticsPage() {
  const { currentUser, isManager, token } = useSessionContext();
  const { loadingData } = useFeedbackContext();
  const { managerStats, users } = useManagementContext();
  const initialRange = currentMonthRange();
  const selectableUsers = useMemo(
    () => users.filter((user) => getId(user) && user.roles !== "manager"),
    [users],
  );
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summaries, setSummaries] = useState<WorkStatusSummaryUser[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [durationBalances, setDurationBalances] = useState<
    Record<string, DailyDurationBalance>
  >({});
  const [fixedTaskLists, setFixedTaskLists] = useState<
    Record<string, FixedTaskLists>
  >({});
  const [taskLists, setTaskLists] = useState<Record<string, TaskLists>>({});
  const [durationLoadingUserId, setDurationLoadingUserId] = useState<string | null>(
    null,
  );
  const [detailsLoadingUserId, setDetailsLoadingUserId] = useState<string | null>(
    null,
  );
  const [taskDetailsLoadingUserId, setTaskDetailsLoadingUserId] = useState<
    string | null
  >(null);
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  async function fetchSummaries() {
    if (!from || !to || selectableUsers.length === 0) return;
    if (from > to) {
      setError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        selectableUsers.map((user) =>
          managerApi.workStatusSummary(token, {
            from,
            to,
            userId: getId(user),
          }),
        ),
      );
      setSummaries(
        results.flatMap((result) => result.users).filter((user) => user.userId),
      );
      setExpandedUserId(null);
      setDurationBalances({});
      setFixedTaskLists({});
      setTaskLists({});
    } catch (err) {
      setSummaries([]);
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

    const [durationResult, detailsResult, taskDetailsResult] =
      await Promise.allSettled([
      needsDuration
        ? managerApi.dailyDurationBalance(token, { from, to, userId })
        : Promise.resolve(null),
      needsDetails
        ? Promise.all([
            managerApi.overdueFixedTasks(token, { from, to, userId }),
            managerApi.doneFixedTasks(token, { from, to, userId }),
            managerApi.inProgressFixedTasks(token, { userId }),
            managerApi.todoFixedTasks(token, { userId }),
          ])
        : Promise.resolve(null),
      needsTaskDetails
        ? Promise.all([
            managerApi.overdueTasks(token, { from, to, userId }),
            managerApi.doneTasks(token, { from, to, userId }),
            managerApi.inProgressTasks(token, { from, to, userId }),
            managerApi.todoTasks(token, { from, to, userId }),
          ])
        : Promise.resolve(null),
      ]);

    if (durationResult.status === "fulfilled" && durationResult.value) {
      const durationBalance = durationResult.value;
      setDurationBalances((current) => ({
        ...current,
        [userId]: durationBalance,
      }));
    }
    if (detailsResult.status === "fulfilled" && detailsResult.value) {
      const [overdue, done, inProgress, todo] = detailsResult.value;
      setFixedTaskLists((current) => ({
        ...current,
        [userId]: {
          done: normalizeList(done),
          inProgress: normalizeList(inProgress),
          overdue: normalizeList(overdue),
          todo: normalizeList(todo),
        },
      }));
    }
    if (
      taskDetailsResult.status === "fulfilled" &&
      taskDetailsResult.value
    ) {
      const [overdue, done, inProgress, todo] = taskDetailsResult.value;
      setTaskLists((current) => ({
        ...current,
        [userId]: {
          done: done.data,
          inProgress: inProgress.data,
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

  const loadLatestSummaries = useEffectEvent(fetchSummaries);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLatestSummaries(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [selectableUsers, token]);

  if (!isManager) return null;

  return (
    <LandingPageEntrance className="space-y-5 pb-8 [&>div:nth-child(2)]:relative [&>div:nth-child(2)]:z-30">
      <ManagerSummaryBanner
        activeUsers={managerStats?.activeUsers ?? users.length}
        firstName={userName(currentUser ?? undefined).split(" ")[0]}
      />

      <ManagerScoreCard />

      <header className="rounded-2xl bg-[--surface] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black text-[#1f7a8c]">آنالیتیکس مدیر</p>
            <h1 className="mt-2 text-balance text-xl font-black sm:text-2xl">
              عملکرد کاربران
            </h1>
          </div>

          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(130px,.75fr)_minmax(150px,.8fr)_minmax(150px,.8fr)_minmax(150px,.8fr)_auto]"
            onSubmit={loadSummary}
          >
            <label className="text-xs font-bold text-[--text-2]">
              نوع
              <select
                className="mt-1.5 h-11 w-full rounded-xl border border-[--border] bg-[--surface-2] px-3 text-sm font-bold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                onChange={(event) =>
                  setWorkTypeFilter(event.target.value as WorkTypeFilter)
                }
                value={workTypeFilter}
              >
                <option value="all">همه</option>
                <option value="projects">پروژه</option>
                <option value="reports">گزارش</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[--text-2]">
              وضعیت
              <select
                className="mt-1.5 h-11 w-full rounded-xl border border-[--border] bg-[--surface-2] px-3 text-sm font-bold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                value={statusFilter}
              >
                <option value="all">همه وضعیت‌ها</option>
                {statusRows.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <DateField
              label="از تاریخ"
              maxDate={to ? new Date(`${to}T00:00:00`) : new Date()}
              onChange={setFrom}
              value={from}
            />
            <DateField
              label="تا تاریخ"
              maxDate={new Date()}
              minDate={from ? new Date(`${from}T00:00:00`) : undefined}
              onChange={setTo}
              value={to}
            />
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
                durationBalance={durationBalances[summaryUser.userId]}
                durationLoading={durationLoadingUserId === summaryUser.userId}
                entranceIndex={index}
                expanded={expandedUserId === summaryUser.userId}
                fixedTaskDetails={fixedTaskLists[summaryUser.userId]}
                fixedTaskDetailsLoading={
                  detailsLoadingUserId === summaryUser.userId
                }
                key={summaryUser.userId}
                onToggle={() => void toggleUser(summaryUser.userId)}
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
          <span className="h-12 w-12 shrink-0 rounded-2xl bg-[--border]" />
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

function UserAnalyticsCard({
  durationBalance,
  durationLoading,
  entranceIndex,
  expanded,
  fixedTaskDetails,
  fixedTaskDetailsLoading,
  onToggle,
  statusFilter,
  summary,
  taskDetails,
  taskDetailsLoading,
  workTypeFilter,
}: {
  durationBalance?: DailyDurationBalance;
  durationLoading: boolean;
  entranceIndex: number;
  expanded: boolean;
  fixedTaskDetails?: FixedTaskLists;
  fixedTaskDetailsLoading: boolean;
  onToggle: () => void;
  statusFilter: StatusFilter;
  summary: WorkStatusSummaryUser;
  taskDetails?: TaskLists;
  taskDetailsLoading: boolean;
  workTypeFilter: WorkTypeFilter;
}) {
  const projectCounts = summary.tasks ?? emptyCounts;
  const reportCounts = summary.fixedTasks ?? emptyCounts;
  const showProjects = workTypeFilter === "all" || workTypeFilter === "projects";
  const showReports = workTypeFilter === "all" || workTypeFilter === "reports";
  const total = (showProjects ? projectCounts.total : 0) +
    (showReports ? reportCounts.total : 0);
  const done = (showProjects ? projectCounts.done : 0) +
    (showReports ? reportCounts.done : 0);
  const open = Math.max(total - done, 0);
  const rate = total ? Math.round((done / total) * 100) : 0;
  const displayName =
    [summary.firstName, summary.lastName].filter(Boolean).join(" ") ||
    summary.email ||
    "کاربر";

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
      className="overflow-hidden rounded-3xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.05)] transition-[box-shadow] duration-200 hover:shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_14px_32px_rgba(15,23,42,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-center gap-3 xl:w-64">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
              <UserRound size={21} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-[--text]">
                {displayName}
              </h2>
              <p className="mt-0.5 truncate text-xs text-[--text-3]">
                {summary.email || "عضو تیم"}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryMetric label="کل موارد" value={total} />
            <SummaryMetric label="انجام‌شده" tone="success" value={done} />
            <SummaryMetric label="باز" tone="warning" value={open} />
            <SummaryMetric label="نرخ تکمیل" tone="accent" value={`${rate}٪`} />
          </div>

          <button
            aria-expanded={expanded}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1f7a8c]/10 pr-4 pl-3.5 text-sm font-black text-[#1f7a8c] transition-[background-color,transform] duration-150 hover:bg-[#1f7a8c]/15 active:scale-[0.96]"
            onClick={onToggle}
            type="button"
          >
            {expanded ? "بستن جزئیات" : "جزئیات بیشتر"}
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
            <div className="border-t border-[--border] bg-[--surface-2]/50 p-4 sm:p-5">
              {statusFilter === "all" && (
                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {showProjects && (
                    <>
                      <MetricCard
                        icon={FolderKanban}
                        label="کل پروژه‌ها"
                        tone="project"
                        value={projectCounts.total}
                      />
                      <MetricCard
                        icon={CheckCircle2}
                        label="پروژه‌های انجام‌شده"
                        tone="done"
                        value={projectCounts.done}
                      />
                    </>
                  )}
                  {showReports && (
                    <>
                      <MetricCard
                        icon={FileText}
                        label="کل گزارش‌ها"
                        tone="report"
                        value={reportCounts.total}
                      />
                      <MetricCard
                        icon={Clock3}
                        label="گزارش‌های در انتظار"
                        tone="todo"
                        value={reportCounts.todo}
                      />
                    </>
                  )}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                {showProjects && (
                  <Panel icon={FolderKanban} title="وضعیت پروژه‌ها">
                    <StatusBreakdown
                      accent="#1f7a8c"
                      counts={projectCounts}
                      statusFilter={statusFilter}
                    />
                  </Panel>
                )}
                {showReports && (
                  <Panel icon={FileText} title="وضعیت گزارش‌ها">
                    <StatusBreakdown
                      accent="#7c3aed"
                      counts={reportCounts}
                      statusFilter={statusFilter}
                    />
                  </Panel>
                )}
              </div>

              {statusFilter === "all" && (
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <Panel icon={Target} title="نرخ تکمیل">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {showProjects && (
                        <DonutChart
                          color="#1f7a8c"
                          label="پروژه"
                          total={projectCounts.total}
                          value={projectCounts.done}
                        />
                      )}
                      {showReports && (
                        <DonutChart
                          color="#7c3aed"
                          label="گزارش"
                          total={reportCounts.total}
                          value={reportCounts.done}
                        />
                      )}
                    </div>
                  </Panel>
                  {showReports && (
                    <Panel icon={Timer} title="تراز زمان گزارش‌های ثابت">
                      {durationLoading ? (
                        <div className="flex min-h-32 items-center justify-center">
                          <Loader2 className="animate-spin text-[#1f7a8c]" size={24} />
                        </div>
                      ) : durationBalance ? (
                        <DurationBalancePanel data={durationBalance} />
                      ) : (
                        <p className="py-10 text-center text-sm text-[--text-3]">
                          اطلاعات زمان در دسترس نیست.
                        </p>
                      )}
                    </Panel>
                  )}
                </div>
              )}

              {showReports && (
                <div className="mt-4">
                  <FixedTaskDetailsPanel
                    data={fixedTaskDetails}
                    loading={fixedTaskDetailsLoading}
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
  statusFilter,
}: {
  data?: FixedTaskLists;
  loading: boolean;
  statusFilter: StatusFilter;
}) {
  return (
    <WorkDetailsPanel
      data={data}
      description="یک وضعیت را انتخاب کنید تا فهرست کامل گزارش‌های آن را ببینید."
      itemLabel="گزارش"
      loading={loading}
      renderItem={(task, listKey) => (
        <FixedTaskDetailRow listKey={listKey} task={task} />
      )}
      statusFilter={statusFilter}
      title="جزئیات گزارش‌های ثابت"
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
      description="یک وضعیت را انتخاب کنید تا پروژه‌های این کاربر را با جزئیات ببینید."
      itemLabel="پروژه"
      loading={loading}
      renderItem={(task, listKey) => (
        <TaskDetailRow listKey={listKey} task={task} />
      )}
      statusFilter={statusFilter}
      title="جزئیات پروژه‌ها"
      titleIcon={FolderKanban}
      titleTone="bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]"
    />
  );
}

function WorkDetailsPanel<T,>({
  data,
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
  description: string;
  itemLabel: string;
  loading: boolean;
  renderItem: (item: T, listKey: keyof WorkDetailLists<T>) => React.ReactNode;
  statusFilter: StatusFilter;
  title: string;
  titleIcon: typeof FileText;
  titleTone: string;
}) {
  const [selectedKey, setSelectedKey] =
    useState<keyof WorkDetailLists<T>>("overdue");
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
      emptySuffix: "در حال انجامی",
      key: "inProgress" as const,
      label: "در حال انجام",
      statusKey: "inProgress" as const,
      activeTone:
        "bg-sky-50 text-sky-800 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.18)] dark:bg-sky-950/35 dark:text-sky-200",
      dot: "bg-sky-500",
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
  const activeTasks = data?.[activeSection.key] ?? [];

  return (
    <section className="overflow-hidden rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <header className="flex items-start gap-3 border-b border-[--border] p-5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${titleTone}`}
        >
          <TitleIcon size={20} />
        </span>
        <div>
          <h3 className="text-base font-black text-[--text]">
            {title}
          </h3>
          <p className="mt-1 text-pretty text-sm leading-6 text-[--text-2]">
            {description}
          </p>
        </div>
      </header>

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
                      <span className="text-sm font-black">{section.label}</span>
                    </span>
                    <span className="text-base font-black tabular-nums">
                      {data[section.key].length}
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
                key={activeSection.key}
                transition={{ bounce: 0, duration: 0.3, type: "spring" }}
              >
                {activeTasks.length > 0 ? (
                  activeTasks.map((task, index) => (
                    <div
                      key={`${activeSection.key}-${index}`}
                    >
                      {renderItem(task, activeSection.key)}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[--surface] px-4 py-12 text-center text-sm font-bold text-[--text-3]">
                    هیچ {itemLabel} {activeSection.emptySuffix} وجود ندارد.
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
    </section>
  );
}

function FixedTaskDetailRow({
  listKey,
  task,
}: {
  listKey: keyof FixedTaskLists;
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
    inProgress: "border-r-sky-500",
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
    inProgress: "border-r-sky-500",
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
            مسئول پروژه
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
  if (hours && remainingMinutes) return `${hours} ساعت و ${remainingMinutes} دقیقه`;
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
      <p className={`text-xl font-black tabular-nums ${tones[tone]}`}>{value}</p>
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
  maxDate,
  minDate,
  onChange,
  value,
}: {
  label: string;
  maxDate?: Date;
  minDate?: Date;
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
        format="YYYY/MM/DD"
        inputClass="mt-1.5 h-11 w-full rounded-xl border border-[--border] bg-[--surface-2] px-3 text-sm font-bold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
        locale={persianFa}
        maxDate={maxDate}
        minDate={minDate}
        onChange={(date) => {
          if (!date || Array.isArray(date)) return onChange("");
          onChange(dateParam(date.toDate()));
        }}
        value={value ? new Date(`${value}T00:00:00`) : ""}
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

function DurationBalancePanel({ data }: { data: any }) {
  const entries = Array.isArray(data) ? data : (Array.isArray(data?.entries) ? data.entries : []);
  const hasEntries = entries.length > 0;
  const maxMinutes = hasEntries ? Math.max(
    ...entries.map((e: any) => Math.max(e.expectedMinutes || 0, e.actualMinutes || 0, 1)),
  ) : 1;

  function fmt(minutes: number) {
    if (minutes == null || isNaN(minutes)) return "0 دقیقه";
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? "-" : "";
    return h > 0 ? `${sign}${h} ساعت ${m} دقیقه` : `${sign}${m} دقیقه`;
  }

  // Normalize: support both old shape (totalExpected/totalActual/totalBalance)
  // and new API shape (expectedDailyMinutes/totalActualDurationMinutes/remainingMinutes)
  const totalExpected = data?.totalExpected ?? data?.expectedDailyMinutes ?? entries.reduce((sum: number, e: any) => sum + (e.expectedMinutes || 0), 0);
  const totalActual = data?.totalActual ?? data?.totalActualDurationMinutes ?? entries.reduce((sum: number, e: any) => sum + (e.actualMinutes || 0), 0);
  const totalBalance = data?.totalBalance ?? (data?.remainingMinutes != null ? -data.remainingMinutes : null) ?? entries.reduce((sum: number, e: any) => sum + (e.balance || 0), 0);
  // remainingMinutes = expected - actual, so balance (actual - expected) = -remaining
  const remaining = data?.remainingMinutes ?? (totalExpected - totalActual);

  return (
    <div className="space-y-5">
      {/* Summary totals */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[--surface-2] p-3 text-center">
          <p className="text-[10px] font-bold text-[--text-3]">زمان مورد انتظار</p>
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
              const expectedPct = Math.round(((entry.expectedMinutes || 0) / maxMinutes) * 100);
              const actualPct = Math.round(((entry.actualMinutes || 0) / maxMinutes) * 100);
              const isPositive = (entry.balance || 0) >= 0;
              const dateLabel = entry.date ? entry.date.slice(5) : ""; // MM-DD
              return (
                <div key={entry.date || index} className="flex items-center gap-3 text-xs">
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
