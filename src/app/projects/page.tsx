"use client";

import { useTaskinoPageContext } from "../_store/hooks";

export default function ProjectsPage() {
  return <ProjectsPageContent />;
}

function ProjectsPageContent() {
  const {
    ClipboardList, FileSpreadsheet, FolderKanban, Plus, Trash2, X, Field, Select,    COLUMNS, getId, statusLabel, userName, users, tasks, taskTitle, taskAssignee,    taskFile, showNewProjectForm, taLookupFirst, taLookupLast, taLookupResult, taCompletionExpert, taCompletionResult, taCountUser,    taCountStart, taCountEnd, taCountResult, activeView, setTaskTitle, setTaskAssignee, setTaskFile, setShowNewProjectForm,    setTaLookupFirst, setTaLookupLast, setTaCompletionExpert, setTaCountUser, setTaCountStart, setTaCountEnd, setSelectedTask, isManager,    createTask, deleteTask, taLookupTasks, taRunCompletionStats, taRunDateCount
  } = useTaskinoPageContext();

  return (
    <>
{!isManager && activeView === "tasks-admin" && (
            <section className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"><FolderKanban size={17} /></div>
                  <div>
                    <h2 className="font-bold">پروژه‌های من</h2>
                    <p className="text-[11px] text-[--text-3]">{tasks.length} پروژه واگذارشده · برای دانلود فایل اکسل کلیک کن</p>
                  </div>
                </div>
                <div className="divide-y divide-[--border]">
                  {tasks.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[--text-3]">پروژه‌ای به شما واگذار نشده</p>
                  ) : tasks.map((t: any) => (
                    <button key={getId(t)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right transition hover:bg-[--surface-2]" onClick={() => setSelectedTask(t)} type="button">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{t.title}</p>
                          {t.excelFile && (
                            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><FileSpreadsheet size={10} />اکسل</span>
                          )}
                        </div>
                        {t.description && <p className="mt-0.5 truncate text-xs text-[--text-3]">{t.description}</p>}
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${COLUMNS.find((c: any) => c.status === t.status)?.badge ?? "bg-slate-100 text-slate-600"}`}>{statusLabel(t.status)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {isManager && activeView === "tasks-admin" && (
            <section className="space-y-4">
              {/* New project */}
              <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"><FolderKanban size={17} /></div>
                    <div>
                      <h2 className="font-bold">پروژه جدید</h2>
                      <p className="text-[11px] text-[--text-3]">یک پروژه با فایل اکسل برای کارشناس تعریف کن</p>
                    </div>
                  </div>
                  <button
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]"
                    onClick={() => setShowNewProjectForm((v: boolean) => { if (v) setTaskFile(null); return !v; })} type="button"
                  >
                    {showNewProjectForm ? <X size={15} /> : <Plus size={15} />}
                    {showNewProjectForm ? "بستن" : "پروژه جدید"}
                  </button>
                </div>
                {showNewProjectForm && (
                  <form className="grid gap-3 border-t border-[--border] bg-[--surface-2]/60 p-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={createTask}>
                    <Field label="عنوان پروژه *" name="projTitle" value={taskTitle} onChange={setTaskTitle} required placeholder="مثلاً: تکمیل اکسل فروش" />
                    <Select label="مسئول (کارشناس)" value={taskAssignee} onChange={setTaskAssignee} options={users.map((u: any) => [getId(u), userName(u)])} placeholder="بدون مسئول (خودم)" />
                    <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[--border] bg-[--surface] px-3 text-sm font-medium text-[--text-2] transition hover:bg-[--surface-2] sm:col-span-2">
                      <FileSpreadsheet size={15} className="text-[#1f7a8c]" />
                      <span className="truncate">{taskFile ? taskFile.name : "ضمیمه فایل اکسل (اختیاری)"}</span>
                      <input accept=".xlsx,.xls" className="hidden" onChange={(e) => setTaskFile(e.target.files?.[0] ?? null)} type="file" />
                    </label>
                    <div className="flex items-center gap-2">
                      <button className="h-10 flex-1 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={!taskTitle.trim()} type="submit">ایجاد پروژه</button>
                      {taskFile && <button className="h-10 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs font-medium text-red-500" onClick={() => setTaskFile(null)} type="button">حذف فایل</button>}
                    </div>
                  </form>
                )}
              </div>

              {/* All tasks */}
              <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white"><ClipboardList size={17} /></div>
                  <div>
                    <h2 className="font-bold">همه گزارش‌ها</h2>
                    <p className="text-[11px] text-[--text-3]">{tasks.length} پروژه</p>
                  </div>
                </div>
                <div className="divide-y divide-[--border] max-h-[360px] overflow-y-auto">
                  {tasks.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[--text-3]">پروژه‌ای یافت نشد</p>
                  ) : tasks.map((t: any) => (
                    <div key={getId(t)} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{t.title}</p>
                        <p className="text-xs text-[--text-3]">{(t.assignedTo ?? []).map(userName).join("، ") || "بدون مسئول"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${COLUMNS.find((c: any) => c.status === t.status)?.badge ?? "bg-slate-100 text-slate-600"}`}>{statusLabel(t.status)}</span>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => void deleteTask(getId(t))} type="button"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks by user name */}
              <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                <h2 className="font-bold">پروژه‌های یک کاربر (بر اساس نام)</h2>
                <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={taLookupTasks}>
                  <Field label="نام" name="taLookupFirst" value={taLookupFirst} onChange={setTaLookupFirst} />
                  <Field label="نام خانوادگی" name="taLookupLast" value={taLookupLast} onChange={setTaLookupLast} />
                  <button className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={!taLookupFirst.trim() || !taLookupLast.trim()} type="submit">جستجو</button>
                </form>
                {taLookupResult !== null && (
                  <div className="mt-4 space-y-2">
                    {taLookupResult.length === 0 ? (
                      <p className="text-sm text-[--text-3]">پروژه‌ای برای این کاربر یافت نشد</p>
                    ) : taLookupResult.map((t: any) => (
                      <div key={getId(t)} className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface-2] px-4 py-2.5">
                        <p className="text-sm font-medium">{t.title}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${COLUMNS.find((c: any) => c.status === t.status)?.badge ?? "bg-slate-100 text-slate-600"}`}>{statusLabel(t.status)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Completion stats */}
                <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                  <h2 className="font-bold">آمار تکمیل پروژه</h2>
                  <p className="mt-1 text-xs text-[--text-3]">پروژه‌های ساخته‌شده توسط شما و واگذارشده به یک متخصص</p>
                  <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={taRunCompletionStats}>
                    <div className="min-w-[200px] flex-1"><Select label="متخصص" value={taCompletionExpert} onChange={setTaCompletionExpert} options={users.map((u: any) => [getId(u), userName(u)])} placeholder="انتخاب متخصص" /></div>
                    <button className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={!taCompletionExpert} type="submit">محاسبه</button>
                  </form>
                  {taCompletionResult && (
                    <pre className="mt-4 overflow-x-auto rounded-xl bg-[--surface-2] p-3 text-xs text-[--text-2]" dir="ltr">{JSON.stringify(taCompletionResult, null, 2)}</pre>
                  )}
                </div>

                {/* Date count */}
                <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                  <h2 className="font-bold">تعداد پروژه در بازه تاریخی</h2>
                  <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={taRunDateCount}>
                    <div className="sm:col-span-2"><Select label="کاربر" value={taCountUser} onChange={setTaCountUser} options={users.map((u: any) => [getId(u), userName(u)])} placeholder="انتخاب کاربر" /></div>
                    <Field label="از تاریخ" name="taCountStart" type="date" value={taCountStart} onChange={setTaCountStart} />
                    <Field label="تا تاریخ" name="taCountEnd" type="date" value={taCountEnd} onChange={setTaCountEnd} />
                    <div className="sm:col-span-2"><button className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={!taCountUser || !taCountStart || !taCountEnd} type="submit">محاسبه</button></div>
                  </form>
                  {taCountResult && (
                    <pre className="mt-4 overflow-x-auto rounded-xl bg-[--surface-2] p-3 text-xs text-[--text-2]" dir="ltr">{JSON.stringify(taCountResult, null, 2)}</pre>
                  )}
                </div>
              </div>
            </section>
          )}

          
    </>
  );
}
