"use client";

import { type FormEvent, useState } from "react";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  CalendarDays,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { getId, managerApi, type ManagerTaskStatusRange, type UserProgress, type UserTaskCount } from "@/lib/api";
import {
  useManagementContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";

const roleLabel: Record<string, string> = {
  manager: "مدیر",
  supervisor: "سرپرست",
  specialist: "کارشناس",
};

function personName(person: { firstName?: string; lastName?: string; fullName?: string; userName?: string; email?: string }) {
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return person.fullName || person.userName || fullName || person.email || "کاربر بدون نام";
}

function statusStyle(status?: string) {
  if (status === "good") return { label: "خوب", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" };
  if (status === "weak") return { label: "بد", className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" };
  return { label: "متوسط", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" };
}

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

export default function AnalyticsPage() {
  const { isManager, token } = useSessionContext();
  const { tasks } = useTaskContext();
  const {
    users,
    managerStats,
    managerTaskStatus,
    managerTaskStatusRange,
    managerUserCounts,
    managerMonthlyPerf,
    managerUserProgress,
    leaveRequests,
  } = useManagementContext();
  const initialRange = currentMonthRange();
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [rangeData, setRangeData] = useState<ManagerTaskStatusRange | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState("");

  async function applyRangeFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to) return;
    if (from > to) {
      setRangeError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      return;
    }
    if (to > dateParam(new Date())) {
      setRangeError("انتخاب تاریخ آینده امکان‌پذیر نیست.");
      return;
    }
    setRangeLoading(true);
    setRangeError("");
    try {
      setRangeData(await managerApi.taskStatusRange(token, from, to));
    } catch (error) {
      setRangeError(error instanceof Error ? error.message : "دریافت اطلاعات بازه ناموفق بود.");
    } finally {
      setRangeLoading(false);
    }
  }

  if (!isManager) return null;

  const todo = managerTaskStatus?.todoTasks ?? managerTaskStatus?.todo ?? 0;
  const inProgress = managerTaskStatus?.inProgressTasks ?? managerTaskStatus?.inProgress ?? managerTaskStatus?.in_progress ?? 0;
  const done = managerTaskStatus?.doneTasks ?? managerTaskStatus?.done ?? 0;
  const total = todo + inProgress + done || tasks.length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const specialists = users.filter((user) => user.roles === "specialist").length;
  const supervisors = users.filter((user) => user.roles === "supervisor").length;
  const pendingLeaves = leaveRequests.filter((leave) => leave.status === "pending").length;
  const attentionUsers = managerUserProgress.filter((user) => user.performanceStatus === "weak");
  const rankedUsers = [...managerUserProgress].sort((a, b) => (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0));
  const taskRows = [...managerUserCounts].sort((a, b) => (b.totalTasks ?? b.total ?? 0) - (a.totalTasks ?? a.total ?? 0));

  return (
    <section dir="rtl" className="space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold text-[#1f7a8c]">مرکز کنترل مدیریت</p>
          <h1 className="mt-1 text-2xl font-extrabold">نمای جامع عملکرد سازمان</h1>
          <p className="mt-1 text-sm text-[--text-3]">وضعیت کارشناسان، سرپرستان، پروژه‌ها و گزارش‌ها در یک نگاه</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-3 py-2 text-xs text-[--text-2]">
          <Activity size={15} className="text-emerald-500" />
          اطلاعات بر اساس آخرین داده ثبت‌شده
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="نیروی فعال" value={managerStats?.activeUsers ?? users.length} note={`${specialists} کارشناس · ${supervisors} سرپرست`} tone="blue" />
        <Metric icon={BarChart3} label="کل پروژه‌ها" value={total} note={`${inProgress} پروژه در حال انجام`} tone="violet" />
        <Metric icon={CheckCircle2} label="نرخ تکمیل پروژه‌ها" value={`${completionRate}%`} note={`${done} پروژه تکمیل‌شده`} tone="green" />
        <Metric icon={AlertTriangle} label="نیازمند رسیدگی" value={attentionUsers.length + pendingLeaves} note={`${attentionUsers.length} عملکرد ضعیف · ${pendingLeaves} مرخصی`} tone="amber" />
      </div>

      <Panel title="نمودار وضعیت پروژه‌ها و گزارش‌ها" subtitle="مقایسه پروژه‌ها و گزارش‌ها در بازه انتخابی" icon={BarChart3}>
        <form className="mb-6 flex flex-col gap-3 rounded-xl border border-[--border] bg-[--surface-2] p-3 sm:flex-row sm:items-end" onSubmit={applyRangeFilter}>
          <label className="flex-1 text-xs font-semibold text-[--text-2]">
            از تاریخ
            <DatePicker
              value={from ? new Date(`${from}T00:00:00`) : ""}
              onChange={(value) => {
                if (!value || Array.isArray(value)) return setFrom("");
                setFrom(dateParam(value.toDate()));
              }}
              calendar={jalali}
              locale={persianFa}
              maxDate={
                to && to < dateParam(new Date())
                  ? new Date(`${to}T00:00:00`)
                  : new Date()
              }
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              inputClass="mt-1.5 h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              containerClassName="w-full"
              placeholder="انتخاب تاریخ شروع"
            />
          </label>
          <label className="flex-1 text-xs font-semibold text-[--text-2]">
            تا تاریخ
            <DatePicker
              value={to ? new Date(`${to}T00:00:00`) : ""}
              onChange={(value) => {
                if (!value || Array.isArray(value)) return setTo("");
                setTo(dateParam(value.toDate()));
              }}
              calendar={jalali}
              locale={persianFa}
              minDate={from ? new Date(`${from}T00:00:00`) : undefined}
              maxDate={new Date()}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              inputClass="mt-1.5 h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              containerClassName="w-full"
              placeholder="انتخاب تاریخ پایان"
            />
          </label>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-[#1f7a8c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#186777] disabled:cursor-not-allowed disabled:opacity-60" disabled={rangeLoading} type="submit">
            <CalendarDays size={16} />
            {rangeLoading ? "در حال دریافت..." : "اعمال فیلتر"}
          </button>
        </form>
        {rangeError && <p className="mb-4 text-xs font-semibold text-red-600">{rangeError}</p>}
        {(rangeData ?? managerTaskStatusRange) ? (
          <StatusRangeChart data={(rangeData ?? managerTaskStatusRange)!} />
        ) : (
          <EmptyState text="داده نمودار این بازه در دسترس نیست." />
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Panel title="وضعیت پروژه‌ها" subtitle="توزیع تمام پروژه‌های ثبت‌شده" icon={Target}>
          <div className="grid grid-cols-3 gap-3">
            <StatusCard label="در انتظار" value={todo} total={total} color="bg-slate-400" />
            <StatusCard label="در حال انجام" value={inProgress} total={total} color="bg-[#1f7a8c]" />
            <StatusCard label="تکمیل‌شده" value={done} total={total} color="bg-emerald-500" />
          </div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[--surface-2]">
            <div className="bg-slate-400" style={{ width: `${total ? todo / total * 100 : 0}%` }} />
            <div className="bg-[#1f7a8c]" style={{ width: `${total ? inProgress / total * 100 : 0}%` }} />
            <div className="bg-emerald-500" style={{ width: `${total ? done / total * 100 : 0}%` }} />
          </div>
        </Panel>

        <Panel title="ترکیب تیم" subtitle="تفکیک نقش‌های سازمانی" icon={ShieldCheck}>
          <div className="space-y-4">
            <RoleRow label="کارشناس" value={specialists} total={users.length} color="bg-[#1f7a8c]" />
            <RoleRow label="سرپرست" value={supervisors} total={users.length} color="bg-violet-500" />
            <RoleRow label="مدیر" value={users.filter((u) => u.roles === "manager").length} total={users.length} color="bg-amber-500" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="عملکرد اعضای تیم" subtitle="پیشرفت کارشناسان و سرپرستان" icon={TrendingUp}>
          {rankedUsers.length ? (
            <div className="divide-y divide-[--border]">
              {rankedUsers.map((user, index) => <ProgressRow key={user.userId ?? index} user={user} />)}
            </div>
          ) : <EmptyState text="هنوز داده ارزیابی عملکرد ثبت نشده است." />}
        </Panel>

        <Panel title="پروژه‌ها به تفکیک نفر" subtitle="مقایسه پروژه‌های باز، جاری و تمام‌شده" icon={UsersRound}>
          {taskRows.length ? (
            <div className="divide-y divide-[--border]">
              {taskRows.map((user, index) => <TaskRow key={user.userId ?? getId(user) ?? index} user={user} />)}
            </div>
          ) : <EmptyState text="داده‌ای برای توزیع پروژه‌ها وجود ندارد." />}
        </Panel>
      </div>

      <Panel title="عملکرد ماه جاری" subtitle="رتبه‌بندی بر اساس تعداد پروژه تکمیل‌شده" icon={Clock3}>
        {managerMonthlyPerf.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...managerMonthlyPerf].sort((a, b) => (b.completedTasks ?? 0) - (a.completedTasks ?? 0)).map((user, index) => (
              <div key={user.userId ?? getId(user) ?? index} className="flex items-center gap-3 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold ${index < 3 ? "bg-amber-100 text-amber-700" : "bg-[--surface] text-[--text-3]"}`}>{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{personName(user)}</p><p className="text-xs text-[--text-3]">{user.totalTasks ?? 0} پروژه در ماه</p></div>
                <div className="text-left"><p className="text-lg font-extrabold text-emerald-600">{user.completedTasks ?? 0}</p><p className="text-[10px] text-[--text-3]">تکمیل</p></div>
              </div>
            ))}
          </div>
        ) : <EmptyState text="هنوز گزارش عملکرد ماهانه‌ای در دسترس نیست." />}
      </Panel>
    </section>
  );
}

function Panel({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof Target; children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-sm"><div className="flex items-center gap-3 border-b border-[--border] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f7a8c]/10 text-[#1f7a8c]"><Icon size={19} /></span><div><h2 className="font-extrabold">{title}</h2><p className="text-xs text-[--text-3]">{subtitle}</p></div></div><div className="p-4">{children}</div></div>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Target; label: string; value: number | string; note: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const tones = { blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/30", violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/30", green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30", amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30" };
  return <div className="rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={19} /></div><p className="text-xs font-semibold text-[--text-3]">{label}</p><p className="mt-1 text-3xl font-black">{value}</p><p className="mt-2 text-xs text-[--text-2]">{note}</p></div>;
}

function StatusCard({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return <div className="rounded-xl bg-[--surface-2] p-3"><div className="mb-2 flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="text-xs text-[--text-2]">{label}</span></div><p className="text-2xl font-black">{value}</p><p className="text-[10px] text-[--text-3]">{total ? Math.round(value / total * 100) : 0}٪ از کل</p></div>;
}

function RoleRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total ? Math.round(value / total * 100) : 0;
  return <div><div className="mb-1.5 flex justify-between text-sm"><span>{label}</span><span className="font-bold">{value} نفر</span></div><div className="h-2 overflow-hidden rounded-full bg-[--surface-2]"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
}

function ProgressRow({ user }: { user: UserProgress }) {
  const rate = Math.min(100, Math.max(0, user.progressPercentage ?? 0));
  const status = statusStyle(user.performanceStatus);
  return <div className="py-3 first:pt-0 last:pb-0"><div className="mb-2 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f7a8c] text-xs font-bold text-white">{personName(user)[0]}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{personName(user)}</p><span className="text-[10px] text-[--text-3]">{roleLabel[user.role ?? ""] ?? "عضو تیم"}</span></div><p className="text-[11px] text-[--text-3]">{user.completedTasks ?? 0} از {user.totalTasks ?? 0} پروژه · {user.completedFixedTasks ?? 0} از {user.totalFixedTasks ?? 0} گزارش</p></div><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[--surface-2]"><div className="h-full rounded-full bg-[#1f7a8c]" style={{ width: `${rate}%` }} /></div><span className="w-9 text-left text-xs font-black text-[#1f7a8c]">{rate}٪</span></div></div>;
}

function TaskRow({ user }: { user: UserTaskCount }) {
  const total = user.totalTasks ?? user.total ?? 0;
  const done = user.doneTasks ?? user.done ?? 0;
  const current = user.inProgressTasks ?? user.inProgress ?? user.in_progress ?? 0;
  const open = user.todoTasks ?? user.todo ?? 0;
  return <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{personName(user)[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{personName(user)}</p><div className="mt-1 flex flex-wrap gap-3 text-[11px]"><span className="text-slate-500">باز: {open}</span><span className="text-[#1f7a8c]">جاری: {current}</span><span className="text-emerald-600">تمام: {done}</span></div></div><div className="text-left"><p className="text-xl font-black">{total}</p><p className="text-[10px] text-[--text-3]">کل پروژه</p></div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[--border] bg-[--surface-2] px-4 py-8 text-center text-sm text-[--text-3]">{text}</div>;
}

function StatusRangeChart({ data }: { data: ManagerTaskStatusRange }) {
  const groups = [
    { label: "مجموع پروژه و گزارش", values: data },
    { label: "پروژه‌ها", values: data.tasks },
    { label: "گزارش‌ها", values: data.fixedTasks },
  ];
  const statuses = [
    { key: "done" as const, label: "انجام‌شده", color: "bg-emerald-500", text: "text-emerald-600" },
    { key: "inProgress" as const, label: "در حال انجام", color: "bg-[#1f7a8c]", text: "text-[#1f7a8c]" },
    { key: "todo" as const, label: "در انتظار", color: "bg-slate-400", text: "text-slate-600" },
    { key: "overdueUnfinished" as const, label: "معوق", color: "bg-red-500", text: "text-red-600" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-4">
        {statuses.map((status) => (
          <div key={status.key} className="flex items-center gap-2 text-xs text-[--text-2]">
            <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
            {status.label}
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="rounded-xl border border-[--border] bg-[--surface-2] p-4">
            <div className="mb-5 flex items-end justify-between">
              <div><p className="text-sm font-bold">{group.label}</p><p className="text-[11px] text-[--text-3]">تعداد کل در بازه</p></div>
              <p className="text-3xl font-black">{group.values.total}</p>
            </div>
            <div className="flex h-40 items-end justify-around gap-3 border-b border-[--border] px-1">
              {statuses.map((status) => {
                const value = group.values[status.key];
                const height = group.values.total ? Math.max(6, value / group.values.total * 100) : 0;
                return (
                  <div key={status.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className={`text-xs font-extrabold ${status.text}`}>{value}</span>
                    <div className={`w-full max-w-10 rounded-t-md ${status.color} transition-all duration-500`} style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[9px] text-[--text-3]">
              {statuses.map((status) => <span key={status.key}>{status.label}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
