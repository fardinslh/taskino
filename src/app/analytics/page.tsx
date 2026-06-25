"use client";

import { type FormEvent, useMemo, useState } from "react";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import {
  CheckCircle2,
  Clock3,
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
  type DailyDurationBalance,
  type DailyDurationEntry,
  type WorkStatusCounts,
  type WorkStatusSummary,
  type WorkStatusSummaryUser,
} from "@/lib/api";
import {
  useManagementContext,
  useSessionContext,
} from "../_components/taskino-context";
import { userName } from "../_lib/task-helpers";

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
  const { managerStats, users } = useManagementContext();
  const initialRange = currentMonthRange();
  const selectableUsers = useMemo(
    () => users.filter((user) => getId(user) && user.roles !== "manager"),
    [users],
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summary, setSummary] = useState<WorkStatusSummary | null>(null);
  const [durationBalance, setDurationBalance] = useState<DailyDurationBalance | null>(null);
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveUserId = selectedUserId;
  const summaryUser =
    summary?.users.find((user) => user.userId === effectiveUserId) ??
    summary?.users[0];
  const projectCounts = summaryUser?.tasks ?? emptyCounts;
  const reportCounts = summaryUser?.fixedTasks ?? emptyCounts;
  const selectedStatus = statusRows.find((status) => status.key === statusFilter);
  const showProjects = workTypeFilter === "all" || workTypeFilter === "projects";
  const showReports = workTypeFilter === "all" || workTypeFilter === "reports";

  async function loadSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveUserId || !from || !to) return;
    if (from > to) {
      setError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [summaryData, balanceData] = await Promise.all([
        managerApi.workStatusSummary(token, { from, to, userId: effectiveUserId }),
        managerApi.dailyDurationBalance(token, { from, to, userId: effectiveUserId }),
      ]);
      setSummary(summaryData);
      setDurationBalance(balanceData);
    } catch (err) {
      setSummary(null);
      setDurationBalance(null);
      setError(
        err instanceof Error ? err.message : "دریافت گزارش عملکرد ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isManager) return null;

  return (
    <section dir="rtl" className="space-y-5 pb-8">
      <ManagerSummaryBanner
        activeUsers={managerStats?.activeUsers ?? users.length}
        firstName={userName(currentUser ?? undefined).split(" ")[0]}
      />

      <header className="rounded-2xl bg-[--surface] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black text-[#1f7a8c]">آنالیتیکس مدیر</p>
            <h1 className="mt-2 text-balance text-xl font-black sm:text-2xl">
              عملکرد کاربران
            </h1>
          </div>

          <form
            className="grid gap-3 lg:grid-cols-[minmax(200px,1.15fr)_minmax(130px,.75fr)_minmax(150px,.8fr)_minmax(150px,.8fr)_minmax(150px,.8fr)_auto]"
            onSubmit={loadSummary}
          >
            <label className="text-xs font-bold text-[--text-2]">
              کاربر
              <div className="relative mt-1.5">
                <UserRound
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--text-3]"
                  size={16}
                />
                <select
                  className="h-11 w-full rounded-xl border border-[--border] bg-[--surface-2] pr-10 pl-3 text-sm font-bold text-[--text] outline-none transition-[border-color,box-shadow] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  value={effectiveUserId}
                >
                  <option value="">انتخاب کاربر</option>
                  {selectableUsers.map((user) => (
                    <option key={getId(user)} value={getId(user)}>
                      {userName(user)}
                    </option>
                  ))}
                </select>
              </div>
            </label>
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
              disabled={loading || !effectiveUserId}
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

      {summary && effectiveUserId && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statusFilter === "all" ? (
              <>
                {showProjects && (
                  <>
                    <MetricCard
                      icon={FolderKanban}
                      label="کل پروژه‌ها"
                      value={projectCounts.total}
                      tone="project"
                    />
                    <MetricCard
                      icon={CheckCircle2}
                      label="پروژه‌های انجام‌شده"
                      value={projectCounts.done}
                      tone="done"
                    />
                  </>
                )}
                {showReports && (
                  <>
                    <MetricCard
                      icon={FileText}
                      label="کل گزارش‌ها"
                      value={reportCounts.total}
                      tone="report"
                    />
                    <MetricCard
                      icon={Clock3}
                      label="گزارش‌های در انتظار"
                      value={reportCounts.todo}
                      tone="todo"
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {showProjects && selectedStatus && (
                  <MetricCard
                    icon={FolderKanban}
                    label={`پروژه‌های ${selectedStatus.label}`}
                    value={projectCounts[selectedStatus.key]}
                    tone="project"
                  />
                )}
                {showReports && selectedStatus && (
                  <MetricCard
                    icon={FileText}
                    label={`گزارش‌های ${selectedStatus.label}`}
                    value={reportCounts[selectedStatus.key]}
                    tone="report"
                  />
                )}
              </>
            )}
          </div>

          {statusFilter === "all" && (
            <div className="grid gap-5">
              <Panel icon={Target} title="نرخ تکمیل">
                <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            {showProjects && (
              <Panel icon={FolderKanban} title="پروژه‌ها">
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

          {durationBalance && (
            <Panel icon={Timer} title="تراز مدت زمان روزانه گزارش‌های ثابت">
              <DurationBalancePanel data={durationBalance} />
            </Panel>
          )}
        </>
      )}
    </section>
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
            {entries.map((entry: any) => {
              const expectedPct = Math.round(((entry.expectedMinutes || 0) / maxMinutes) * 100);
              const actualPct = Math.round(((entry.actualMinutes || 0) / maxMinutes) * 100);
              const isPositive = (entry.balance || 0) >= 0;
              const dateLabel = entry.date ? entry.date.slice(5) : ""; // MM-DD
              return (
                <div key={entry.date || Math.random()} className="flex items-center gap-3 text-xs">
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
