"use client";

import { useMemo } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { Trash2, X } from "lucide-react";

import { getId } from "@/lib/api";
import { recurrenceLabel, userName } from "../_lib/task-helpers";
import { formatDate } from "../_lib/task-helpers";
import { Field, Select } from "./shared";

export type FixedTaskFormValues = {
  title: string;
  recurrence: "daily" | "weekly" | "monthly";
  assignedTo: string;
  description: string;
};

export type ActivationFormValues = {
  startDate: string;
  endDate: string;
};

// ─── Template Row ─────────────────────────────────────────────────────────────
export function TemplateRow({
  task,
  onEdit,
  onDelete,
}: {
  task: any;
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
export function IncompleteRow({ item }: { item: any }) {
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
export function FixedTaskFormPanel({
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
            .filter((user: any) => {
              const role = user.roles ?? user.role;
              return (
                (role === "specialist" || role === "supervisor") &&
                (!currentUser?.workField ||
                  !user.workField ||
                  user.workField === currentUser.workField)
              );
            })
            .map((user: any) => [getId(user), userName(user)] as [string, string])}
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
export function FilterBar({
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
export function ActivationModal({
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
              form.setError("startDate", { message: "این فیلد الزامی است." });
              return;
            }
            if (Number.isNaN(endDate.getTime())) {
              form.setError("endDate", { message: "این فیلد الزامی است." });
              return;
            }

            if (recurrence === "weekly") {
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              activationValues.startDate = startDate.toISOString();
              activationValues.endDate = endDate.toISOString();
              if (endDate < todayStart) {
                form.setError("startDate", { message: "امکان انتخاب هفته‌ای که تمام شده وجود ندارد." });
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
              form.setError("startDate", { message: "زمان شروع نمی‌تواند در گذشته باشد." });
              return;
            }

            if (endDate <= startDate) {
              form.setError("endDate", { message: "زمان پایان باید بعد از زمان شروع باشد." });
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
                          if (!value || Array.isArray(value)) { field.onChange(""); return; }
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
                        plugins={[<TimePicker key="time-picker" position="bottom" hideSeconds />]}
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
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">بازه هفتگی *</span>
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
                          : startValue ? [startValue] : undefined
                      }
                      onChange={(value) => {
                        if (!value) { field.onChange(""); form.setValue("endDate", "", { shouldValidate: true }); return; }
                        if (Array.isArray(value) && value.length >= 2) {
                          const [start, end] = value;
                          field.onChange(start.toDate().toISOString());
                          form.setValue("endDate", end.toDate().toISOString(), { shouldValidate: true });
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
                          if (!value || Array.isArray(value)) { field.onChange(""); return; }
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
                        placeholder={name === "startDate" ? "انتخاب ماه شروع" : "انتخاب ماه پایان"}
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
