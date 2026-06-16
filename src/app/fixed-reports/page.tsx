"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
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
import { formatDate, recurrenceLabel, userName } from "../_lib/task-helpers";

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

// ─── Template Row ─────────────────────────────────────────────────────────────
function TemplateRow({
  task,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
}: {
  task: any;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const active = task.isActive !== false;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{task.title}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {active ? "فعال" : "غیرفعال"}
          </span>
          <span className="rounded-full bg-[--surface-2] px-2 py-0.5 text-[10px] font-semibold text-[--text-2]">
            {recurrenceLabel(task.recurrence ?? "daily")}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[--text-3]">
          {task.assignedTo ? `مسئول: ${userName(task.assignedTo)}` : ""}
          {task.description ? ` · ${task.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
          onClick={active ? onDeactivate : onActivate}
          type="button"
        >
          {active ? "غیرفعال کن" : "فعال کن"}
        </button>
        <button
          className="rounded-lg border border-[--border] bg-[--surface] px-3 py-1.5 text-xs font-semibold text-[--text-2] transition hover:bg-[--surface-2]"
          onClick={onEdit}
          type="button"
        >
          ویرایش
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
          onClick={onDelete}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Incomplete Row ───────────────────────────────────────────────────────────
function IncompleteRow({ item }: { item: any }) {
  const overdue = item.deadlineStatus === "overdue";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-xs text-[--text-3]">
          {recurrenceLabel(item.recurrence ?? "daily")}
          {item.assignedTo ? ` · مسئول: ${userName(item.assignedTo)}` : ""}
          {item.deadline ? ` · مهلت: ${formatDate(item.deadline)}` : ""}
        </p>
      </div>
      <span
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
          overdue
            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            : "bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]"
        }`}
      >
        {overdue ? "مهلت گذشته" : "در مهلت"}
      </span>
    </div>
  );
}

// ─── Fixed Task Form Panel ────────────────────────────────────────────────────
function FixedTaskFormPanel({
  form,
  editingFixedTask,
  users,
  currentUser,
  onClose,
  onSubmit,
}: {
  form: UseFormReturn<FixedTaskFormValues>;
  editingFixedTask: any;
  users: any[];
  currentUser: any;
  onClose: () => void;
  onSubmit: (values: FixedTaskFormValues) => Promise<void>;
}) {
  return (
    <div className="border-b border-[--border] bg-[--surface-2]/70 p-4">
      <p className="mb-3 text-sm font-bold">
        {editingFixedTask ? "ویرایش الگو" : "الگوی ثابت جدید"}
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_180px_220px_auto]"
        onSubmit={form.handleSubmit(onSubmit)}
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
                (user.roles === "specialist" || user.roles === "supervisor") &&
                (!currentUser?.workField || user.workField === currentUser.workField),
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
            onClick={onClose}
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
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({
  filterRecurrence,
  filterSpecialist,
  filterTitle,
  onRecurrenceChange,
  onSpecialistChange,
  onTitleChange,
  onClear,
  filteredCount,
  totalCount,
}: {
  filterRecurrence: string;
  filterSpecialist: string;
  filterTitle: string;
  onRecurrenceChange: (v: string) => void;
  onSpecialistChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="border-b border-[--border] bg-[--surface-2]/40 px-5 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
            فیلتر بر اساس تکرار
          </span>
          <select
            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
            value={filterRecurrence}
            onChange={(e) => onRecurrenceChange(e.target.value)}
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
            onChange={(e) => onSpecialistChange(e.target.value)}
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
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[--text-3]">
          {filteredCount} مورد از {totalCount} مورد
        </p>
        <button
          className="rounded-lg border border-[--border] bg-[--surface] px-3 py-1.5 text-xs font-semibold text-[--text-2] transition hover:bg-[--surface] focus:outline-none"
          onClick={onClear}
          type="button"
        >
          پاک کردن فیلترها
        </button>
      </div>
    </div>
  );
}

// ─── Activation Modal ─────────────────────────────────────────────────────────
function ActivationModal({
  task,
  onClose,
  onActivate,
}: {
  task: any;
  onClose: () => void;
  onActivate: (values: ActivationFormValues) => Promise<boolean>;
}) {
  const form = useForm<ActivationFormValues>({
    defaultValues: { startDate: "", endDate: "" },
  });
  const recurrence: string = task.recurrence ?? "daily";
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[--border] bg-[--surface] p-5 shadow-2xl"
        dir="rtl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold">فعال‌سازی الگوی ثابت</h3>
            <p className="mt-1 text-xs text-[--text-3]">{task.title}</p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] text-[--text-2]"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            const startDate = new Date(values.startDate);
            const endDate = new Date(values.endDate);
            const activationValues = { ...values };

            if (Number.isNaN(startDate.getTime())) {
              form.setError("startDate", {
                message: "این فیلد الزامی است.",
              });
              return;
            }

            if (Number.isNaN(endDate.getTime())) {
              form.setError("endDate", {
                message: "این فیلد الزامی است.",
              });
              return;
            }

            if (recurrence === "weekly") {
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              activationValues.startDate = startDate.toISOString();
              activationValues.endDate = endDate.toISOString();
              if (endDate < todayStart) {
                form.setError("startDate", {
                  message: "امکان انتخاب هفته‌ای که تمام شده وجود ندارد.",
                });
                return;
              }
            }

            if (recurrence === "monthly") {
              startDate.setDate(1);
              startDate.setHours(0, 0, 0, 0);
              endDate.setMonth(endDate.getMonth() + 1, 0);
              endDate.setHours(23, 59, 59, 999);
              activationValues.startDate = startDate.toISOString();
              activationValues.endDate = endDate.toISOString();
            }

            if (recurrence === "daily" && startDate < new Date()) {
              form.setError("startDate", {
                message: "زمان شروع نمی‌تواند در گذشته باشد.",
              });
              return;
            }

            if (endDate <= startDate) {
              form.setError("endDate", {
                message: "زمان پایان باید بعد از زمان شروع باشد.",
              });
              return;
            }

            const ok = await onActivate(activationValues);
            if (ok) onClose();
          })}
        >
          {recurrence === "daily" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["startDate", "endDate"] as const).map((name) => (
                <label className="block" key={name}>
                  <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                    {name === "startDate" ? "تاریخ و ساعت شروع *" : "تاریخ و ساعت پایان *"}
                  </span>
                  <Controller
                    control={form.control}
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
                        minDate={name === "startDate" ? todayStart : undefined}
                        format="YYYY/MM/DD HH:mm"
                        calendarPosition="bottom-right"
                        inputClass="h-11 w-full rounded-lg border border-[--border] bg-[--surface-2] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                        containerClassName="w-full"
                        placeholder={name === "startDate" ? "انتخاب زمان شروع" : "انتخاب زمان پایان"}
                        plugins={[
                          <TimePicker key="time-picker" position="bottom" hideSeconds />,
                        ]}
                      />
                    )}
                  />
                  {form.formState.errors[name] && (
                    <span className="mt-1 block text-xs text-red-500">
                      {form.formState.errors[name]?.message || "این فیلد الزامی است."}
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : recurrence === "weekly" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                بازه هفتگی *
              </span>
              <Controller
                control={form.control}
                name="startDate"
                rules={{ required: true }}
                render={({ field }) => {
                  const startValue = field.value ? new Date(field.value) : "";
                  const endDateValue = form.getValues("endDate");
                  const endValue = endDateValue ? new Date(endDateValue) : "";
                  return (
                    <DatePicker
                      value={
                        startValue && endValue
                          ? [startValue, endValue]
                          : startValue
                            ? [startValue]
                            : undefined
                      }
                      onChange={(value) => {
                        if (!value) {
                          field.onChange("");
                          form.setValue("endDate", "", { shouldValidate: true });
                          return;
                        }
                        if (Array.isArray(value) && value.length >= 2) {
                          const [start, end] = value;
                          field.onChange(start.toDate().toISOString());
                          form.setValue("endDate", end.toDate().toISOString(), {
                            shouldValidate: true,
                          });
                          return;
                        }
                        if (Array.isArray(value)) {
                          const [start] = value;
                          if (!start) return;
                          field.onChange(start.toDate().toISOString());
                          form.setValue("endDate", "", { shouldValidate: true });
                        }
                      }}
                      calendar={jalali}
                      locale={persianFa}
                      range
                      weekPicker
                      format="YYYY/MM/DD"
                      calendarPosition="bottom-right"
                      inputClass="h-11 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] dark:bg-[--surface] dark:text-[--text] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                      containerClassName="w-full"
                      placeholder="انتخاب بازه هفتگی"
                    />
                  );
                }}
              />
              {form.formState.errors.startDate && (
                <span className="mt-1 block text-xs text-red-500">
                  {form.formState.errors.startDate.message || "این فیلد الزامی است."}
                </span>
              )}
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["startDate", "endDate"] as const).map((name) => (
                <label className="block" key={name}>
                  <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                    {name === "startDate" ? "ماه شروع *" : "ماه پایان *"}
                  </span>
                  <Controller
                    control={form.control}
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
                          name === "endDate" && form.getValues("startDate")
                            ? new Date(form.getValues("startDate"))
                            : new Date()
                        }
                        onlyMonthPicker
                        format="YYYY/MM"
                        calendarPosition="bottom-right"
                        inputClass="h-11 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] dark:bg-[--surface] dark:text-[--text] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                        containerClassName="w-full"
                        placeholder={
                          name === "startDate" ? "انتخاب ماه شروع" : "انتخاب ماه پایان"
                        }
                      />
                    )}
                  />
                  {form.formState.errors[name] && (
                    <span className="mt-1 block text-xs text-red-500">
                      {form.formState.errors[name]?.message || "این فیلد الزامی است."}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <button
            className="h-11 w-full rounded-lg bg-[#1f7a8c] text-sm font-semibold text-white transition hover:bg-[#196b7b] disabled:opacity-50"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            فعال کن
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
    defaultValues: { title: "", recurrence: "daily", assignedTo: "", description: "" },
  });
  const [activatingTask, setActivatingTask] = useState<any>(null);
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");

  const visibleFixedTasks = fixedTasks.filter((item: any) => item.isActive !== true);

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

  const clearFilters = () => {
    setFilterRecurrence("");
    setFilterSpecialist("");
    setFilterTitle("");
  };

  if (!isManager || activeView !== "fixed-reports") return null;

  const stats = [
    { label: "الگوهای ثابت", value: visibleFixedTasks.length },
    { label: "انجام‌نشده", value: incompleteFixedTasks.length },
    { label: "فعال", value: fixedTasks.filter((item: any) => item.isActive !== false).length },
    {
      label: "مهلت‌گذشته",
      value: incompleteFixedTasks.filter((item: any) => item.deadlineStatus === "overdue").length,
    },
  ];

  return (
    <section className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[--border] bg-[--surface] p-4"
          >
            <p className="text-xs text-[--text-3]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex w-fit rounded-xl border border-[--border] bg-[--surface-2] p-1">
        {(
          [
            { key: "templates", label: `الگوهای ثابت (${visibleFixedTasks.length})` },
            { key: "incomplete", label: `انجام‌نشده (${incompleteFixedTasks.length})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              fixedReportsTab === key
                ? "bg-[--surface] text-[#1f7a8c] shadow-sm"
                : "text-[--text-2] hover:text-[--text]"
            }`}
            onClick={() => setFixedReportsTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
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
            <FixedTaskFormPanel
              form={form}
              editingFixedTask={editingFixedTask}
              users={users}
              currentUser={currentUser}
              onClose={() => {
                closeFixedTaskForm();
                form.reset();
              }}
              onSubmit={async (values) => {
                await saveFixedTaskFromValues(values);
                form.reset();
              }}
            />
          )}

          <FilterBar
            filterRecurrence={filterRecurrence}
            filterSpecialist={filterSpecialist}
            filterTitle={filterTitle}
            onRecurrenceChange={setFilterRecurrence}
            onSpecialistChange={setFilterSpecialist}
            onTitleChange={setFilterTitle}
            onClear={clearFilters}
            filteredCount={filteredFixedTasks.length}
            totalCount={visibleFixedTasks.length}
          />

          <div className="divide-y divide-[--border]">
            {filteredFixedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ClipboardList size={32} className="text-[--text-3]" />
                <p className="mt-3 font-semibold text-[--text]">
                  موردی با این فیلترها پیدا نشد
                </p>
                <button
                  className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white"
                  onClick={clearFilters}
                  type="button"
                >
                  <Plus size={15} />
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              filteredFixedTasks.map((task: any) => (
                <TemplateRow
                  key={getId(task)}
                  task={task}
                  onActivate={() => setActivatingTask(task)}
                  onDeactivate={() => void deactivateFixedTask(task)}
                  onEdit={() => openFixedTaskForm(task)}
                  onDelete={() => void deleteFixedTask(getId(task))}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Incomplete Tab */}
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
                <IncompleteRow key={getId(item)} item={item} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Activation Modal */}
      {activatingTask && (
        <ActivationModal
          task={activatingTask}
          onClose={() => setActivatingTask(null)}
          onActivate={(values) => activateFixedTask(activatingTask, values)}
        />
      )}
    </section>
  );
}
