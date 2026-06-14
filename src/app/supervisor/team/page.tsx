"use client";

import { useTaskinoPageContext } from "../../_components/taskino-context";

export default function SupervisorTeamPage() {
  return <SupervisorTeamPageContent />;
}

function SupervisorTeamPageContent() {
  const {
    Award, RefreshCw, UsersRound, managerUserProgress, activeView, isSupervisor, loadSupervisorData
  } = useTaskinoPageContext();

  return (
    <>
{isSupervisor && activeView === "supervisor-team" && (
            <section className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-900 bg-[--surface]">
                <div className="flex items-center justify-between gap-3 border-b border-violet-100 dark:border-violet-900/50 bg-gradient-to-l from-violet-50 to-white dark:from-violet-950/30 dark:to-transparent px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white"><Award size={17} /></div>
                    <div>
                      <h2 className="font-bold">عملکرد تیم</h2>
                      <p className="text-[11px] text-[--text-3]">{managerUserProgress.length} عضو · ارزیابی بر اساس Task و گزارش‌های ثابت</p>
                    </div>
                  </div>
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]" onClick={() => void loadSupervisorData()} type="button">
                    <RefreshCw size={15} />ارزیابی مجدد
                  </button>
                </div>

                {managerUserProgress.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <UsersRound size={32} className="text-[--text-3]" />
                    <p className="mt-3 font-semibold">داده‌ای یافت نشد</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[--border]">
                    {managerUserProgress
                      .slice()
                      .sort((a: any, b: any) => (b.progressPercentage ?? 0) - (a.progressPercentage ?? 0))
                      .map((m: any, i: number) => {
                        const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || m.email || "نامشخص";
                        const rate = m.progressPercentage ?? 0;
                        const badge = m.performanceStatus === "good" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : m.performanceStatus === "weak" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
                        const badgeLabel = m.performanceStatus === "good" ? "خوب" : m.performanceStatus === "weak" ? "ضعیف" : "متوسط";
                        return (
                          <div key={m.userId ?? i} className="flex items-center gap-4 px-5 py-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white">
                              {name[0]?.toUpperCase() ?? "؟"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold">{name}</p>
                                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${badge}`}>{badgeLabel}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[--border]">
                                  <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-[--text-2]">{rate}%</span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[--text-3]">
                                <span>کل: {m.totalTasks ?? 0}</span>
                                <span className="text-emerald-600">تمام: {m.completedTasks ?? 0}</span>
                                <span className="text-[#1f7a8c]">جاری: {m.inProgressTasks ?? 0}</span>
                                <span>ثابت: {m.completedFixedTasks ?? 0}/{m.totalFixedTasks ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── Manager Analytics ──────────────────────────────────────────────── */}
          
    </>
  );
}
