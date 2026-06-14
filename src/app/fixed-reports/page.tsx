"use client";

import {
  AlertTriangle,
  ClipboardList,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { getId } from "@/lib/api";
import { Field, Select } from "../_components/shared";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";
import { formatDate, userName } from "../_lib/task-helpers";

export default function FixedReportsPage() {
  return <FixedReportsPageContent />;
}

function FixedReportsPageContent() {
  const { activeView } = useNavigationContext();
  const { currentUser, isManager } = useSessionContext();
  const { users, loadManagerAnalytics } = useManagementContext();
  const {
    fixedTasks, incompleteFixedTasks, fixedReportsTab, showFixedTaskForm,
    editingFixedTask, ftTitle, ftAssignee, ftRecurrence, ftDescription,
    ftActive, ftNextRunAt, setFixedReportsTab, setFtTitle, setFtAssignee,
    setFtRecurrence, setFtDescription, setFtActive, setFtNextRunAt,
    openFixedTaskForm, closeFixedTaskForm, saveFixedTask,
    toggleFixedTaskActive, deleteFixedTask, seedFixedTasksFromExcel,
  } = useFixedTaskContext();

  return (
    <>
{isManager && activeView === "fixed-reports" && (
            <section className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  { label: "الگوهای ثابت", value: fixedTasks.length },
                  { label: "انجام‌نشده", value: incompleteFixedTasks.length },
                  { label: "فعال", value: fixedTasks.filter((item: any) => item.isActive !== false).length },
                  { label: "مهلت‌گذشته", value: incompleteFixedTasks.filter((item: any) => item.deadlineStatus === "overdue").length },
                ].map((s: any) => (
                  <div key={s.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                    <p className="text-xs text-[--text-3]">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl border border-[--border] bg-[--surface-2] p-1 w-fit">
                <button
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${fixedReportsTab === "templates" ? "bg-[--surface] text-[#1f7a8c] shadow-sm" : "text-[--text-2] hover:text-[--text]"}`}
                  onClick={() => setFixedReportsTab("templates")} type="button"
                >الگوهای ثابت ({fixedTasks.length})</button>
                <button
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${fixedReportsTab === "incomplete" ? "bg-[--surface] text-[#1f7a8c] shadow-sm" : "text-[--text-2] hover:text-[--text]"}`}
                  onClick={() => setFixedReportsTab("incomplete")} type="button"
                >انجام‌نشده ({incompleteFixedTasks.length})</button>
              </div>

              {/* ─ Templates tab ─ */}
              {fixedReportsTab === "templates" && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
                        <ClipboardList size={17} />
                      </div>
                      <div>
                        <h2 className="font-bold">مدیریت الگوهای ثابت</h2>
                        <p className="text-[11px] text-[--text-3]">{fixedTasks.length} الگو تعریف شده</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]" onClick={() => void loadManagerAnalytics()} type="button">
                        <RefreshCw size={15} />
                      </button>
                      <button
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                        onClick={() => void seedFixedTasksFromExcel()} type="button"
                      >
                        <Upload size={15} />ایمپورت از اکسل
                      </button>
                      <button
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#1f7a8c] to-[#2491a5] px-4 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.98]"
                        onClick={() => openFixedTaskForm()} type="button"
                      >
                        <Plus size={15} />الگوی جدید
                      </button>
                    </div>
                  </div>

                  {/* Create / Edit form */}
                  {showFixedTaskForm && (
                    <div className="border-b border-[--border] bg-[--surface-2]/70 p-4">
                      <p className="mb-3 text-sm font-bold">{editingFixedTask ? "ویرایش الگو" : "الگوی ثابت جدید"}</p>
                      <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_220px_auto]" onSubmit={saveFixedTask}>
                        <Field label="عنوان *" name="ftTitle" value={ftTitle} onChange={setFtTitle} required placeholder="مثلاً: گزارش روزانه" />
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">توالی *</span>
                          <select
                            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                            value={ftRecurrence}
                            onChange={(e) => setFtRecurrence(e.target.value as "daily" | "weekly" | "monthly")}
                          >
                            <option value="daily">روزانه</option>
                            <option value="weekly">هفتگی</option>
                            <option value="monthly">ماهانه</option>
                          </select>
                        </label>
                        <Select label="مسئول * (هم‌حوزه)" value={ftAssignee} onChange={setFtAssignee}
                          options={users.filter((u: any) => (u.roles === "specialist" || u.roles === "supervisor") && (!currentUser?.workField || u.workField === currentUser.workField)).map((u: any) => [getId(u), userName(u)])}
                          placeholder="انتخاب مسئول هم‌حوزه"
                        />
                        <div className="flex items-end gap-2">
                          <button className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-50 transition hover:bg-[#196b7b]" disabled={!ftTitle.trim() || !ftAssignee} type="submit">
                            {editingFixedTask ? "ذخیره" : <><Plus size={14} />ایجاد</>}
                          </button>
                          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]" onClick={closeFixedTaskForm} type="button"><X size={15} /></button>
                        </div>
                      </form>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="توضیحات" name="ftDescription" value={ftDescription} onChange={setFtDescription} placeholder="اختیاری" />
                        <Field label="زمان اجرا (اختیاری)" name="ftNextRunAt" type="datetime-local" value={ftNextRunAt} onChange={setFtNextRunAt} />
                      </div>
                      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-[--text-2]">
                        <input type="checkbox" className="h-4 w-4 accent-[#1f7a8c]" checked={ftActive} onChange={(e) => setFtActive(e.target.checked)} />
                        همین حالا فعال باشد (پیش‌فرض: غیرفعال تا زمان فعال‌سازی)
                      </label>
                    </div>
                  )}

                  {/* Templates list */}
                  <div className="divide-y divide-[--border]">
                    {fixedTasks.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <ClipboardList size={32} className="text-[--text-3]" />
                        <p className="mt-3 font-semibold text-[--text]">الگویی تعریف نشده</p>
                        <button className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white" onClick={() => openFixedTaskForm()} type="button">
                          <Plus size={15} />اولین الگو را بساز
                        </button>
                      </div>
                    ) : (
                      fixedTasks.map((ft: any) => (
                        <div key={getId(ft)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{ft.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ft.isActive !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                {ft.isActive !== false ? "فعال" : "غیرفعال"}
                              </span>
                              <span className="rounded-full bg-[--surface-2] px-2 py-0.5 text-[10px] font-semibold text-[--text-2]">
                                {ft.recurrence === "daily" ? "روزانه" : ft.recurrence === "weekly" ? "هفتگی" : "ماهانه"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[--text-3]">
                              {ft.assignedTo ? `مسئول: ${userName(ft.assignedTo)}` : ""}
                              {ft.description ? ` · ${ft.description}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${ft.isActive !== false ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"}`}
                              onClick={() => void toggleFixedTaskActive(ft)} type="button"
                            >
                              {ft.isActive !== false ? "غیرفعال کن" : "فعال کن"}
                            </button>
                            <button
                              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-1.5 text-xs font-semibold text-[--text-2] transition hover:bg-[--surface-2]"
                              onClick={() => openFixedTaskForm(ft)} type="button"
                            >ویرایش</button>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => void deleteFixedTask(getId(ft))} type="button"
                            ><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ─ Incomplete tab ─ */}
              {fixedReportsTab === "incomplete" && (
                <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
                  <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        <AlertTriangle size={17} />
                      </div>
                      <div>
                        <h2 className="font-bold">گزارش‌های ثابت انجام‌نشده</h2>
                        <p className="text-[11px] text-[--text-3]">{incompleteFixedTasks.length} مورد نیاز به بررسی</p>
                      </div>
                    </div>
                    <button className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]" onClick={() => void loadManagerAnalytics()} type="button">
                      <RefreshCw size={15} />بروزرسانی
                    </button>
                  </div>
                  <div className="divide-y divide-[--border]">
                    {incompleteFixedTasks.length === 0 ? (
                      <p className="py-10 text-center text-sm text-[--text-3]">گزارش ثابت انجام‌نشده‌ای یافت نشد</p>
                    ) : (
                      incompleteFixedTasks.map((item: any) => (
                        <div key={getId(item)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="mt-1 text-xs text-[--text-3]">
                              {item.recurrence === "daily" ? "روزانه" : item.recurrence === "weekly" ? "هفتگی" : "ماهانه"}
                              {item.assignedTo ? ` · مسئول: ${userName(item.assignedTo)}` : ""}
                              {item.deadline ? ` · مهلت: ${formatDate(item.deadline)}` : ""}
                            </p>
                          </div>
                          <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${item.deadlineStatus === "overdue" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]"}`}>
                            {item.deadlineStatus === "overdue" ? "مهلت گذشته" : "در مهلت"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          
    </>
  );
}
