"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type ActivationFormValues = {
  startDate: string;
  endDate: string;
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
    activateFixedTask,
    deactivateFixedTask,
    deleteFixedTask,
    seedFixedTasksFromExcel,
  } = useFixedTaskContext();

  const form = useForm<FixedTaskFormValues>({
    defaultValues: {
      title: "",
      recurrence: "daily",
      assignedTo: "",
      description: "",
    },
  });
  const activationForm = useForm<ActivationFormValues>({
    defaultValues: { startDate: "", endDate: "" },
  });
  const [activatingTask, setActivatingTask] = useState<any>(null);
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const activationRecurrence = activatingTask?.recurrence ?? "daily";
  const visibleFixedTasks = fixedTasks.filter(
    (item: any) => item.isActive !== true,
  );
  const filteredFixedTasks = useMemo(() => {
    const specialistQuery = filterSpecialist.trim().toLowerCase();
    const titleQuery = filterTitle.trim().toLowerCase();

    return visibleFixedTasks.filter((task: any) => {
      const recurrenceMatch =
        !filterRecurrence || (task.recurrence ?? "daily") === filterRecurrence;
      const specialistMatch =
        !specialistQuery ||
        userName(task.assignedTo).toLowerCase().includes(specialistQuery);
      const titleMatch =
        !titleQuery || String(task.title ?? "").toLowerCase().includes(titleQuery);

      return recurrenceMatch && specialistMatch && titleMatch;
    });
  }, [filterRecurrence, filterSpecialist, filterTitle, visibleFixedTasks]);

  useEffect(() => {
    if (!showFixedTaskForm) return;
    form.reset({
      title: editingFixedTask?.title ?? "",
      recurrence: editingFixedTask?.recurrence ?? "daily",
      assignedTo: getId(editingFixedTask?.assignedTo),
      description: editingFixedTask?.description ?? "",
    });
  }, [editingFixedTask, form, showFixedTaskForm]);

  if (!isManager || activeView !== "fixed-reports") return null;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "الگوهای ثابت", value: visibleFixedTasks.length },
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
          الگوهای ثابت ({visibleFixedTasks.length})
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
                  {visibleFixedTasks.length} الگو تعریف شده
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
              <div className="mt-3">
                <Field
                  label="توضیحات"
                  name="ftDescription"
                  placeholder="اختیاری"
                  registration={form.register("description")}
                />
              </div>
              <label className="hidden">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1f7a8c]"
                  checked={false}
                  readOnly
                />
                همین حالا فعال باشد
              </label>
            </div>
          )}

          <div className="border-b border-[--border] bg-[--surface-2]/40 px-5 py-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                  فیلتر بر اساس تکرار
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  value={filterRecurrence}
                  onChange={(event) => setFilterRecurrence(event.target.value)}
                >
                  <option value="">همه</option>
                  <option value="daily">روزانه</option>
                  <option value="weekly">هفتگی</option>
                  <option value="monthly">ماهانه</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                  فیلتر بر اساس نام متخصص
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  placeholder="نام یا نام خانوادگی متخصص"
                  value={filterSpecialist}
                  onChange={(event) => setFilterSpecialist(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                  فیلتر بر اساس عنوان گزارش
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  placeholder="عنوان گزارش"
                  value={filterTitle}
                  onChange={(event) => setFilterTitle(event.target.value)}
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[--text-3]">
                {filteredFixedTasks.length} مورد از {visibleFixedTasks.length} مورد
              </p>
              <button
                className="rounded-lg border border-[--border] bg-[--surface] px-3 py-1.5 text-xs font-semibold text-[--text-2] transition hover:bg-[--surface] focus:outline-none"
                onClick={() => {
                  setFilterRecurrence("");
                  setFilterSpecialist("");
                  setFilterTitle("");
                }}
                type="button"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>

          <div className="divide-y divide-[--border]">
            {filteredFixedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ClipboardList size={32} className="text-[--text-3]" />
                <p className="mt-3 font-semibold text-[--text]">
                  موردی با این فیلترها پیدا نشد
                </p>
                <button
                  className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white"
                  onClick={() => {
                    setFilterRecurrence("");
                    setFilterSpecialist("");
                    setFilterTitle("");
                  }}
                  type="button"
                >
                  <Plus size={15} />
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              filteredFixedTasks.map((task: any) => {
                return (
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
                        onClick={() => {
                          if (task.isActive !== false) {
                            void deactivateFixedTask(task);
                            return;
                          }
                          activationForm.reset({ startDate: "", endDate: "" });
                          setActivatingTask(task);
                        }}
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
                );
              })
            )}
          </div>
        </div>
      )}

      {activatingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActivatingTask(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[--border] bg-[--surface] p-5 shadow-2xl"
            dir="rtl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">
                  {
                    "\u0641\u0639\u0627\u0644\u200c\u0633\u0627\u0632\u06cc \u0627\u0644\u06af\u0648\u06cc \u062b\u0627\u0628\u062a"
                  }
                </h3>
                <p className="mt-1 text-xs text-[--text-3]">
                  {activatingTask.title}
                </p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] text-[--text-2]"
                onClick={() => setActivatingTask(null)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={activationForm.handleSubmit(async (values) => {
                const startDate = new Date(values.startDate);
                const endDate = new Date(values.endDate);

                if (activationRecurrence === "weekly") {
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(23, 59, 59, 999);

                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (endDate < today) {
                    activationForm.setError("startDate", {
                      message: "امکان انتخاب هفته‌ای که تمام شده وجود ندارد.",
                    });
                    return;
                  }
                }

                if (activationRecurrence === "monthly") {
                  startDate.setDate(1);
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setMonth(endDate.getMonth() + 1, 0);
                  endDate.setHours(23, 59, 59, 999);
                }

                if (endDate <= startDate) {
                  activationForm.setError("endDate", {
                    message:
                      "\u0632\u0645\u0627\u0646 \u067e\u0627\u06cc\u0627\u0646 \u0628\u0627\u06cc\u062f \u0628\u0639\u062f \u0627\u0632 \u0632\u0645\u0627\u0646 \u0634\u0631\u0648\u0639 \u0628\u0627\u0634\u062f.",
                  });
                  return;
                }

                const activated = await activateFixedTask(
                  activatingTask,
                  values,
                );
                if (activated) setActivatingTask(null);
              })}
            >
              {activationRecurrence === "daily" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["startDate", "endDate"] as const).map((name) => (
                    <label className="block" key={name}>
                      <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                        {name === "startDate"
                          ? "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a \u0634\u0631\u0648\u0639 *"
                          : "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a \u067e\u0627\u06cc\u0627\u0646 *"}
                      </span>
                      <Controller
                        control={activationForm.control}
                        name={name}
                        rules={{ required: true }}
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
                            minDate={
                              name === "startDate" ? new Date() : undefined
                            }
                            format="YYYY/MM/DD HH:mm"
                            calendarPosition="bottom-right"
                            inputClass="h-11 w-full rounded-lg border border-[--border] bg-[--surface-2] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                            containerClassName="w-full"
                            placeholder={
                              name === "startDate"
                                ? "\u0627\u0646\u062a\u062e\u0627\u0628 \u0632\u0645\u0627\u0646 \u0634\u0631\u0648\u0639"
                                : "\u0627\u0646\u062a\u062e\u0627\u0628 \u0632\u0645\u0627\u0646 \u067e\u0627\u06cc\u0627\u0646"
                            }
                            plugins={[
                              <TimePicker
                                key="time-picker"
                                position="bottom"
                                hideSeconds
                              />,
                            ]}
                          />
                        )}
                      />
                      {activationForm.formState.errors[name] && (
                        <span className="mt-1 block text-xs text-red-500">
                          {activationForm.formState.errors[name]?.message ||
                            "\u0627\u06cc\u0646 \u0641\u06cc\u0644\u062f \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a."}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                    {activationRecurrence === "weekly"
                      ? "\u0628\u0627\u0632\u0647 \u0647\u0641\u062a\u06af\u06cc *"
                      : "\u0628\u0627\u0632\u0647 \u0645\u0627\u0647\u0627\u0646\u0647 *"}
                  </span>
                  <Controller
                    control={activationForm.control}
                    name="startDate"
                    rules={{ required: true }}
                    render={({ field }) => {
                      const startValue = field.value
                        ? new Date(field.value)
                        : "";
                      const endDateValue = activationForm.getValues("endDate");
                      const endValue = endDateValue
                        ? new Date(endDateValue)
                        : "";

                      return (
                        <DatePicker
                          value={
                            activationRecurrence !== "daily" &&
                            startValue &&
                            endValue
                              ? [startValue, endValue]
                              : undefined
                          }
                          onChange={(value) => {
                            if (!value) {
                              field.onChange("");
                              activationForm.setValue("endDate", "", {
                                shouldValidate: true,
                              });
                              return;
                            }

                            if (Array.isArray(value) && value.length >= 2) {
                              const [start, end] = value;
                              field.onChange(start.toDate().toISOString());
                              activationForm.setValue(
                                "endDate",
                                end.toDate().toISOString(),
                                { shouldValidate: true },
                              );
                              return;
                            }

                            if (activationRecurrence === "weekly") {
                              if (!Array.isArray(value) || value.length < 2) {
                                field.onChange("");
                                activationForm.setValue("endDate", "", {
                                  shouldValidate: true,
                                });
                                return;
                              }
                            }
                          }}
                          calendar={jalali}
                          locale={persianFa}
                          minDate={
                            activationRecurrence === "weekly"
                              ? undefined
                              : new Date()
                          }
                          range={activationRecurrence !== "daily"}
                          weekPicker={activationRecurrence === "weekly"}
                          onlyMonthPicker={activationRecurrence === "monthly"}
                          format={
                            activationRecurrence === "weekly"
                              ? "YYYY/MM/DD"
                              : "YYYY/MM"
                          }
                          calendarPosition="bottom-right"
                          inputClass="h-11 w-full rounded-lg border border-[--border] bg-[--surface-2] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                          containerClassName="w-full"
                          placeholder={
                            activationRecurrence === "weekly"
                              ? "\u0627\u0646\u062a\u062e\u0627\u0628 \u0628\u0627\u0632\u0647 \u0647\u0641\u062a\u06af\u06cc"
                              : "\u0627\u0646\u062a\u062e\u0627\u0628 \u0628\u0627\u0632\u0647 \u0645\u0627\u0647\u0627\u0646\u0647"
                          }
                        />
                      );
                    }}
                  />
                  {activationForm.formState.errors.startDate && (
                    <span className="mt-1 block text-xs text-red-500">
                      {activationForm.formState.errors.startDate.message ||
                        "\u0627\u06cc\u0646 \u0641\u06cc\u0644\u062f \u0627\u0644\u0632\u0627\u0645\u06cc \u0627\u0633\u062a."}
                    </span>
                  )}
                </label>
              )}
              <button
                className="h-11 w-full rounded-lg bg-[#1f7a8c] text-sm font-semibold text-white transition hover:bg-[#196b7b] disabled:opacity-50"
                disabled={activationForm.formState.isSubmitting}
                type="submit"
              >
                {"\u0641\u0639\u0627\u0644 \u06a9\u0646"}
              </button>
            </form>
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
