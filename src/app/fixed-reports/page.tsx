"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
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

type FixedTaskFormValues = {
  title: string;
  recurrence: "daily" | "weekly" | "monthly";
  assignedTo: string;
  description: string;
  nextRunAt: string;
  isActive: boolean;
};

export default function FixedReportsPage() {
  return <FixedReportsPageContent />;
}

function FixedReportsPageContent() {
  const { activeView } = useNavigationContext();
  const { currentUser, isManager } = useSessionContext();
  const { users, loadManagerAnalytics } = useManagementContext();
  const {
    fixedTasks,
    incompleteFixedTasks,
    fixedReportsTab,
    showFixedTaskForm,
    editingFixedTask,
    setFixedReportsTab,
    openFixedTaskForm,
    closeFixedTaskForm,
    saveFixedTaskFromValues,
    toggleFixedTaskActive,
    deleteFixedTask,
    seedFixedTasksFromExcel,
  } = useFixedTaskContext();

  const form = useForm<FixedTaskFormValues>({
    defaultValues: {
      title: "",
      recurrence: "daily",
      assignedTo: "",
      description: "",
      nextRunAt: "",
      isActive: false,
    },
  });

  useEffect(() => {
    if (!showFixedTaskForm) return;
    form.reset({
      title: editingFixedTask?.title ?? "",
      recurrence: editingFixedTask?.recurrence ?? "daily",
      assignedTo: getId(editingFixedTask?.assignedTo),
      description: editingFixedTask?.description ?? "",
      nextRunAt: editingFixedTask?.nextRunAt ?? "",
      isActive: editingFixedTask?.isActive !== false && !!editingFixedTask,
    });
  }, [editingFixedTask, form, showFixedTaskForm]);

  if (!isManager || activeView !== "fixed-reports") return null;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "الگوهای ثابت", value: fixedTasks.length },
          { label: "انجام‌نشده", value: incompleteFixedTasks.length },
          {
            label: "فعال",
            value: fixedTasks.filter((item: any) => item.isActive !== false)
              .length,
          },
          {
            label: "مهلت‌گذشته",
            value: incompleteFixedTasks.filter(
              (item: any) => item.deadlineStatus === "overdue",
            ).length,
          },
        ].map((stat: any) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[--border] bg-[--surface] p-4"
          >
            <p className="text-xs text-[--text-3]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex w-fit rounded-xl border border-[--border] bg-[--surface-2] p-1">
        <button
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
            fixedReportsTab === "templates"
              ? "bg-[--surface] text-[#1f7a8c] shadow-sm"
              : "text-[--text-2] hover:text-[--text]"
          }`}
          onClick={() => setFixedReportsTab("templates")}
          type="button"
        >
          الگوهای ثابت ({fixedTasks.length})
        </button>
        <button
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
            fixedReportsTab === "incomplete"
              ? "bg-[--surface] text-[#1f7a8c] shadow-sm"
              : "text-[--text-2] hover:text-[--text]"
          }`}
          onClick={() => setFixedReportsTab("incomplete")}
          type="button"
        >
          انجام‌نشده ({incompleteFixedTasks.length})
        </button>
      </div>

      {fixedReportsTab === "templates" && (
        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
          <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
                <ClipboardList size={17} />
              </div>
              <div>
                <h2 className="font-bold">مدیریت الگوهای ثابت</h2>
                <p className="text-[11px] text-[--text-3]">
                  {fixedTasks.length} الگو تعریف شده
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                onClick={() => void loadManagerAnalytics()}
                type="button"
              >
                <RefreshCw size={15} />
              </button>
              <button
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                onClick={() => void seedFixedTasksFromExcel()}
                type="button"
              >
                <Upload size={15} />
                ایمپورت از اکسل
              </button>
              <button
                className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#1f7a8c] to-[#2491a5] px-4 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.98]"
                onClick={() => openFixedTaskForm()}
                type="button"
              >
                <Plus size={15} />
                الگوی جدید
              </button>
            </div>
          </div>

          {showFixedTaskForm && (
            <div className="border-b border-[--border] bg-[--surface-2]/70 p-4">
              <p className="mb-3 text-sm font-bold">
                {editingFixedTask ? "ویرایش الگو" : "الگوی ثابت جدید"}
              </p>
              <form
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_220px_auto]"
                onSubmit={form.handleSubmit(async (values) => {
                  await saveFixedTaskFromValues(values);
                  form.reset();
                })}
              >
                <Field
                  label="عنوان *"
                  name="ftTitle"
                  required
                  placeholder="مثلاً: گزارش روزانه"
                  registration={form.register("title", { required: true })}
                />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                    توالی *
                  </span>
                  <select
                    className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                    {...form.register("recurrence", { required: true })}
                  >
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="monthly">ماهانه</option>
                  </select>
                </label>
                <Select
                  label="مسئول * (هم‌حوزه)"
                  options={users
                    .filter(
                      (user: any) =>
                        (user.roles === "specialist" ||
                          user.roles === "supervisor") &&
                        (!currentUser?.workField ||
                          user.workField === currentUser.workField),
                    )
                    .map((user: any) => [getId(user), userName(user)])}
                  placeholder="انتخاب مسئول هم‌حوزه"
                  registration={form.register("assignedTo", { required: true })}
                />
                <div className="flex items-end gap-2">
                  <button
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b] disabled:opacity-50"
                    disabled={form.formState.isSubmitting}
                    type="submit"
                  >
                    {editingFixedTask ? "ذخیره" : "ایجاد"}
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]"
                    onClick={() => {
                      closeFixedTaskForm();
                      form.reset();
                    }}
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>
              </form>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field
                  label="توضیحات"
                  name="ftDescription"
                  placeholder="اختیاری"
                  registration={form.register("description")}
                />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                    {"\u0632\u0645\u0627\u0646 \u0627\u062c\u0631\u0627 (\u0627\u062e\u062a\u06cc\u0627\u0631\u06cc)"}
                  </span>
                  <Controller
                    control={form.control}
                    name="nextRunAt"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? new Date(field.value) : ""}
                        onChange={(value) => {
                          if (!value || Array.isArray(value)) {
                            field.onChange("");
                            return;
                          }

                          field.onChange(value.toDate().toISOString());
                        }}
                        calendar={jalali}
                        locale={persianFa}
                        format="YYYY/MM/DD HH:mm"
                        calendarPosition="bottom-right"
                        inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                        containerClassName="w-full"
                        placeholder={"\u0627\u0646\u062a\u062e\u0627\u0628 \u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a"}
                        plugins={[
                          <TimePicker key="time-picker" position="bottom" hideSeconds />,
                        ]}
                      />
                    )}
                  />
                </label>
              </div>
              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-[--text-2]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1f7a8c]"
                  {...form.register("isActive")}
                />
                همین حالا فعال باشد
              </label>
            </div>
          )}

          <div className="divide-y divide-[--border]">
            {fixedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ClipboardList size={32} className="text-[--text-3]" />
                <p className="mt-3 font-semibold text-[--text]">
                  الگویی تعریف نشده
                </p>
                <button
                  className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white"
                  onClick={() => openFixedTaskForm()}
                  type="button"
                >
                  <Plus size={15} />
                  اولین الگو را بساز
                </button>
              </div>
            ) : (
              fixedTasks.map((task: any) => (
                <div
                  key={getId(task)}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{task.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          task.isActive !== false
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {task.isActive !== false ? "فعال" : "غیرفعال"}
                      </span>
                      <span className="rounded-full bg-[--surface-2] px-2 py-0.5 text-[10px] font-semibold text-[--text-2]">
                        {task.recurrence === "daily"
                          ? "روزانه"
                          : task.recurrence === "weekly"
                            ? "هفتگی"
                            : "ماهانه"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[--text-3]">
                      {task.assignedTo
                        ? `مسئول: ${userName(task.assignedTo)}`
                        : ""}
                      {task.description ? ` · ${task.description}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        task.isActive !== false
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                      onClick={() => void toggleFixedTaskActive(task)}
                      type="button"
                    >
                      {task.isActive !== false ? "غیرفعال کن" : "فعال کن"}
                    </button>
                    <button
                      className="rounded-lg border border-[--border] bg-[--surface] px-3 py-1.5 text-xs font-semibold text-[--text-2] transition hover:bg-[--surface-2]"
                      onClick={() => openFixedTaskForm(task)}
                      type="button"
                    >
                      ویرایش
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => void deleteFixedTask(getId(task))}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {fixedReportsTab === "incomplete" && (
        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
          <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle size={17} />
              </div>
              <div>
                <h2 className="font-bold">گزارش‌های ثابت انجام‌نشده</h2>
                <p className="text-[11px] text-[--text-3]">
                  {incompleteFixedTasks.length} مورد نیاز به بررسی
                </p>
              </div>
            </div>
            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
              onClick={() => void loadManagerAnalytics()}
              type="button"
            >
              <RefreshCw size={15} />
              بروزرسانی
            </button>
          </div>
          <div className="divide-y divide-[--border]">
            {incompleteFixedTasks.length === 0 ? (
              <p className="py-10 text-center text-sm text-[--text-3]">
                گزارش ثابت انجام‌نشده‌ای یافت نشد
              </p>
            ) : (
              incompleteFixedTasks.map((item: any) => (
                <div
                  key={getId(item)}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-[--text-3]">
                      {item.recurrence === "daily"
                        ? "روزانه"
                        : item.recurrence === "weekly"
                          ? "هفتگی"
                          : "ماهانه"}
                      {item.assignedTo
                        ? ` · مسئول: ${userName(item.assignedTo)}`
                        : ""}
                      {item.deadline
                        ? ` · مهلت: ${formatDate(item.deadline)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                      item.deadlineStatus === "overdue"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]"
                    }`}
                  >
                    {item.deadlineStatus === "overdue"
                      ? "مهلت گذشته"
                      : "در مهلت"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
