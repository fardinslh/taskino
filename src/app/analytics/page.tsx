"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { getId, type UserProgress, type UserTaskCount } from "@/lib/api";
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

export default function AnalyticsPage() {
  const { isManager } = useSessionContext();
  const { tasks } = useTaskContext();
  const {
    users,
    managerStats,
    managerTaskStatus,
    managerUserCounts,
    managerMonthlyPerf,
    managerUserProgress,
    leaveRequests,
  } = useManagementContext();

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
          <p className="mt-1 text-sm text-[--text-3]">وضعیت کارشناسان، سرپرستان و جریان انجام کارها در یک نگاه</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-3 py-2 text-xs text-[--text-2]">
          <Activity size={15} className="text-emerald-500" />
          اطلاعات بر اساس آخرین داده ثبت‌شده
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="نیروی فعال" value={managerStats?.activeUsers ?? users.length} note={`${specialists} کارشناس · ${supervisors} سرپرست`} tone="blue" />
        <Metric icon={BarChart3} label="کل کارها" value={total} note={`${inProgress} کار در حال انجام`} tone="violet" />
        <Metric icon={CheckCircle2} label="نرخ تکمیل" value={`${completionRate}%`} note={`${done} کار تکمیل‌شده`} tone="green" />
        <Metric icon={AlertTriangle} label="نیازمند رسیدگی" value={attentionUsers.length + pendingLeaves} note={`${attentionUsers.length} عملکرد ضعیف · ${pendingLeaves} مرخصی`} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Panel title="وضعیت جریان کار" subtitle="توزیع تمام کارهای ثبت‌شده" icon={Target}>
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

        <Panel title="حجم کار به تفکیک نفر" subtitle="مقایسه کارهای باز، جاری و تمام‌شده" icon={UsersRound}>
          {taskRows.length ? (
            <div className="divide-y divide-[--border]">
              {taskRows.map((user, index) => <TaskRow key={user.userId ?? getId(user) ?? index} user={user} />)}
            </div>
          ) : <EmptyState text="داده‌ای برای توزیع کارها وجود ندارد." />}
        </Panel>
      </div>

      <Panel title="عملکرد ماه جاری" subtitle="رتبه‌بندی بر اساس تعداد کار تکمیل‌شده" icon={Clock3}>
        {managerMonthlyPerf.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...managerMonthlyPerf].sort((a, b) => (b.completedTasks ?? 0) - (a.completedTasks ?? 0)).map((user, index) => (
              <div key={user.userId ?? getId(user) ?? index} className="flex items-center gap-3 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold ${index < 3 ? "bg-amber-100 text-amber-700" : "bg-[--surface] text-[--text-3]"}`}>{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{personName(user)}</p><p className="text-xs text-[--text-3]">{user.totalTasks ?? 0} کار در ماه</p></div>
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
  return <div className="py-3 first:pt-0 last:pb-0"><div className="mb-2 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f7a8c] text-xs font-bold text-white">{personName(user)[0]}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{personName(user)}</p><span className="text-[10px] text-[--text-3]">{roleLabel[user.role ?? ""] ?? "عضو تیم"}</span></div><p className="text-[11px] text-[--text-3]">{user.completedTasks ?? 0} از {user.totalTasks ?? 0} کار · {user.completedFixedTasks ?? 0} از {user.totalFixedTasks ?? 0} کار ثابت</p></div><span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span></div><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[--surface-2]"><div className="h-full rounded-full bg-[#1f7a8c]" style={{ width: `${rate}%` }} /></div><span className="w-9 text-left text-xs font-black text-[#1f7a8c]">{rate}٪</span></div></div>;
}

function TaskRow({ user }: { user: UserTaskCount }) {
  const total = user.totalTasks ?? user.total ?? 0;
  const done = user.doneTasks ?? user.done ?? 0;
  const current = user.inProgressTasks ?? user.inProgress ?? user.in_progress ?? 0;
  const open = user.todoTasks ?? user.todo ?? 0;
  return <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{personName(user)[0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{personName(user)}</p><div className="mt-1 flex flex-wrap gap-3 text-[11px]"><span className="text-slate-500">باز: {open}</span><span className="text-[#1f7a8c]">جاری: {current}</span><span className="text-emerald-600">تمام: {done}</span></div></div><div className="text-left"><p className="text-xl font-black">{total}</p><p className="text-[10px] text-[--text-3]">کل کار</p></div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[--border] bg-[--surface-2] px-4 py-8 text-center text-sm text-[--text-3]">{text}</div>;
}
