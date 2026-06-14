"use client";

import { useTaskinoPageContext } from "../../_store/hooks";

export default function SupervisorProjectsPage() {
  return <SupervisorProjectsPageContent />;
}

function SupervisorProjectsPageContent() {
  const {
    FolderKanban, Loader2, UsersRound, PROJECT_COVERS, getId, statusLabel, supervisorProjects, selectedSupervisorProjectId, supervisorProjectReport, supervisorProjectMembersPerf, loadingSupervisorProject, activeView, setSelectedSupervisorProjectId, isSupervisor, loadSupervisorProject
  } = useTaskinoPageContext();

  return (
    <>
{isSupervisor && activeView === "supervisor-projects" && (
            <section className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-900 bg-[--surface]">
                <div className="flex items-center gap-3 border-b border-violet-100 dark:border-violet-900/50 bg-gradient-to-l from-violet-50 to-white dark:from-violet-950/30 dark:to-transparent px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                    <FolderKanban size={17} />
                  </div>
                  <div>
                    <h2 className="font-bold">پروژه‌های تحت نظر</h2>
                    <p className="text-[11px] text-[--text-3]">{supervisorProjects.length} پروژه</p>
                  </div>
                </div>

                {supervisorProjects.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <FolderKanban size={32} className="text-[--text-3]" />
                    <p className="mt-3 font-semibold text-[--text]">پروژه‌ای یافت نشد</p>
                  </div>
                ) : (
                  <div className="grid gap-4 p-4 md:grid-cols-2">
                    {supervisorProjects.map((proj: any, i: number) => {
                      const pid = proj.projectId ?? getId(proj);
                      const total = proj.totalTasks ?? 0;
                      const done = proj.doneTasks ?? 0;
                      const rate = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <article key={pid} className="overflow-hidden rounded-xl border border-[--border] bg-[--surface] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                          <div className={`relative h-16 bg-gradient-to-l ${PROJECT_COVERS[i % PROJECT_COVERS.length]} px-4 pt-3`}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                            <div className="relative flex items-start justify-between">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white border border-white/30 backdrop-blur-sm"><FolderKanban size={17} /></div>
                              <div className="flex gap-1.5">
                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm">{rate}%</span>
                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm">{statusLabel(proj.status)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold">{proj.title}</h3>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[--border]">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${rate}%` }} />
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                              {[{ l: "کل", v: total, c: "text-[--text]" }, { l: "جاری", v: proj.inProgressTasks ?? 0, c: "text-[#1f7a8c]" }, { l: "تمام", v: done, c: "text-emerald-500" }].map((s: any) => (
                                <div key={s.l} className="rounded-lg bg-[--surface-2] py-2">
                                  <p className={`text-base font-bold ${s.c}`}>{s.v}</p>
                                  <p className="text-[10px] text-[--text-3]">{s.l}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-[--border] pt-3">
                              <span className="text-xs text-[--text-3]">👥 {proj.membersCount ?? 0} عضو</span>
                              <button
                                className="flex items-center gap-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 transition hover:bg-violet-100"
                                onClick={async () => {
                                  setSelectedSupervisorProjectId(pid);
                                  await loadSupervisorProject(pid);
                                }}
                                type="button"
                              >
                                <UsersRound size={12} />عملکرد اعضا
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected project detail */}
              {selectedSupervisorProjectId && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                    <h3 className="font-bold">عملکرد اعضای پروژه</h3>
                    {supervisorProjectReport && (
                      <div className="flex gap-3 text-xs text-[--text-2]">
                        <span>کل: <strong>{supervisorProjectReport.totalTasks ?? 0}</strong></span>
                        <span>تکمیل: <strong className="text-emerald-600">{supervisorProjectReport.doneTasks ?? 0}</strong></span>
                        <span>معوق: <strong className="text-amber-600">{(supervisorProjectReport as any).overdueTasks ?? (supervisorProjectReport as any).overdueCount ?? 0}</strong></span>
                        <span>نرخ: <strong>{supervisorProjectReport.completionRate ?? 0}%</strong></span>
                      </div>
                    )}
                  </div>
                  {loadingSupervisorProject ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-violet-500" size={24} /></div>
                  ) : supervisorProjectMembersPerf.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[--text-3]">داده‌ای یافت نشد</p>
                  ) : (
                    <div className="divide-y divide-[--border]">
                      {supervisorProjectMembersPerf.map((m: any) => {
                        const total = m.totalTasks ?? 0;
                        const done = m.completedTasks ?? m.completedCount ?? 0;
                        const rate = m.completionRate ?? (total ? Math.round((done / total) * 100) : 0);
                        return (
                          <div key={m.userId ?? getId(m)} className="flex items-center gap-4 px-5 py-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-sm font-bold text-white">
                              {(m.firstName?.[0] ?? "؟").toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{(m.fullName ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()) || "نامشخص"}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[--border]">
                                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="shrink-0 text-xs text-[--text-3]">{rate}%</span>
                              </div>
                            </div>
                            <div className="flex gap-3 shrink-0 text-xs text-center">
                              <div><p className="font-bold">{total}</p><p className="text-[--text-3]">کل</p></div>
                              <div><p className="font-bold text-emerald-600">{done}</p><p className="text-[--text-3]">تمام</p></div>
                              <div><p className="font-bold text-amber-600">{m.score ?? 0}</p><p className="text-[--text-3]">امتیاز</p></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ─── Supervisor Team Performance ────────────────────────────────────── */}
          
    </>
  );
}
