"use client";

import { useTaskinoPageContext } from "../_components/taskino-context";

export default function AnalyticsPage() {
  return <AnalyticsPageContent />;
}

function AnalyticsPageContent() {
  const {
    Target, TrendingUp, UsersRound, getId, managerTaskStatus, managerUserCounts, managerMonthlyPerf,    managerUserProgress, activeView, isManager
  } = useTaskinoPageContext();

  return (
    <>
{isManager && activeView === "analytics" && (
            <section className="space-y-4">
              {/* Task status overview */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "در انتظار", value: managerTaskStatus?.todoTasks ?? managerTaskStatus?.todo ?? 0, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/40", ring: "ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
                  { label: "در حال انجام", value: managerTaskStatus?.inProgressTasks ?? managerTaskStatus?.inProgress ?? managerTaskStatus?.in_progress ?? 0, color: "text-[#1f7a8c]", bg: "bg-[#e8f4f7] dark:bg-[#0f3040]", ring: "ring-[#1f7a8c]/20", dot: "bg-[#1f7a8c]" },
                  { label: "تکمیل شده", value: managerTaskStatus?.doneTasks ?? managerTaskStatus?.done ?? 0, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", ring: "ring-emerald-200 dark:ring-emerald-900", dot: "bg-emerald-500" },
                ].map((s: any) => (
                  <div key={s.label} className={`rounded-xl border border-[--border] ${s.bg} p-5 text-center ring-2 ${s.ring}`}>
                    <div className={`mx-auto mb-2 h-3 w-3 rounded-full ${s.dot}`} />
                    <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="mt-1 text-sm font-medium text-[--text-2]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Projects progress */}
              {/* User task counts */}
              {managerUserCounts.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                      <UsersRound size={17} />
                    </div>
                    <h2 className="font-bold">گزارش‌ها به تفکیک کاربر</h2>
                  </div>
                  <div className="divide-y divide-[--border]">
                    {managerUserCounts.map((u: any) => {
                      const total = u.totalTasks ?? u.total ?? 0;
                      const done = u.doneTasks ?? u.done ?? 0;
                      const name = (u.fullName ?? u.userName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) || "نامشخص";
                      return (
                        <div key={u.userId ?? getId(u)} className="flex items-center gap-4 px-5 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
                            {name[0]?.toUpperCase() ?? "؟"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{name}</p>
                            <div className="mt-1 flex gap-2 text-[11px]">
                              <span className="text-slate-500">باز: {u.todoTasks ?? u.todo ?? 0}</span>
                              <span className="text-[#1f7a8c]">جاری: {u.inProgressTasks ?? u.inProgress ?? u.in_progress ?? 0}</span>
                              <span className="text-emerald-600">تمام: {done}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold">{total}</p>
                            <p className="text-[11px] text-[--text-3]">گزارش</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly performance */}
              {managerMonthlyPerf.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <TrendingUp size={17} />
                    </div>
                    <h2 className="font-bold">عملکرد ماهانه</h2>
                  </div>
                  <div className="divide-y divide-[--border]">
                    {managerMonthlyPerf
                      .sort((a: any, b: any) => (b.completedTasks ?? 0) - (a.completedTasks ?? 0))
                      .map((u: any, i: number) => {
                        const name = (u.fullName ?? u.userName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) || "نامشخص";
                        return (
                          <div key={u.userId ?? getId(u) ?? i} className="flex items-center gap-4 px-5 py-3">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-[--surface-2] text-[--text-3]"}`}>
                              {i + 1}
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white">
                              {name[0]?.toUpperCase() ?? "؟"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{name}</p>
                              <p className="text-xs text-[--text-3]">امتیاز: {u.score ?? 0}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xl font-bold text-emerald-600">{u.completedTasks ?? 0}</p>
                              <p className="text-[11px] text-[--text-3]">گزارش تکمیل</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* User progress evaluation */}
              {managerUserProgress.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
                      <Target size={17} />
                    </div>
                    <h2 className="font-bold">پیشرفت کاربران</h2>
                  </div>
                  <div className="divide-y divide-[--border]">
                    {managerUserProgress
                      .sort((a: any, b: any) => (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0))
                      .map((u: any, i: number) => {
                        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "نامشخص";
                        const rate = u.progressPercentage ?? 0;
                        const badge = u.performanceStatus === "good"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : u.performanceStatus === "weak"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
                        const badgeLabel = u.performanceStatus === "good" ? "خوب" : u.performanceStatus === "weak" ? "ضعیف" : "متوسط";
                        return (
                          <div key={u.userId ?? i} className="flex items-center gap-4 px-5 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white">
                              {name[0]?.toUpperCase() ?? "؟"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold">{name}</p>
                                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${badge}`}>{badgeLabel}</span>
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--border]">
                                  <div className="h-full rounded-full bg-gradient-to-l from-[#1f7a8c] to-[#2a9db2] transition-all duration-700" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="shrink-0 text-xs font-bold text-[#1f7a8c]">{rate}%</span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[--text-3]">
                                <span>کل: {u.totalTasks ?? 0}</span>
                                <span className="text-emerald-600">تمام: {u.completedTasks ?? 0}</span>
                                <span className="text-[#1f7a8c]">جاری: {u.inProgressTasks ?? 0}</span>
                                <span>ثابت: {u.completedFixedTasks ?? 0}/{u.totalFixedTasks ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>
          )}

          
    </>
  );
}
