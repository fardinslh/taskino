"use client";

import { useForm, useWatch } from "react-hook-form";
import {
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { getId } from "@/lib/api";
import { Field, Select } from "../_components/shared";
import {
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";
import { COLUMNS } from "../_lib/task-constants";
import { statusLabel, userName } from "../_lib/task-helpers";

type ProjectFormValues = {
  title: string;
  assignee: string;
  description: string;
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  file: FileList | null;
};

type LookupFormValues = {
  firstName: string;
  lastName: string;
};

type CompletionFormValues = {
  expertId: string;
};

type DateCountFormValues = {
  userId: string;
  startDate: string;
  endDate: string;
};

export default function ProjectsPage() {
  return <ProjectsPageContent />;
}

function ProjectsPageContent() {
  const {
    activeView,
    setSelectedTask,
    setShowNewProjectForm,
    showNewProjectForm,
  } = useNavigationContext();
  const { isManager } = useSessionContext();
  const { users } = useManagementContext();
  const {
    tasks,
    taLookupResult,
    taCompletionResult,
    taCountResult,
    createTaskFromValues,
    deleteTask,
    taLookupTasksFromValues,
    taRunCompletionStatsFromValues,
    taRunDateCountFromValues,
  } = useTaskContext();

  const projectForm = useForm<ProjectFormValues>({
    defaultValues: {
      title: "",
      assignee: "",
      description: "",
      startDate: "",
      dueDate: "",
      startTime: "",
      endTime: "",
      file: null,
    },
  });
  const lookupForm = useForm<LookupFormValues>({
    defaultValues: { firstName: "", lastName: "" },
  });
  const completionForm = useForm<CompletionFormValues>({
    defaultValues: { expertId: "" },
  });
  const dateCountForm = useForm<DateCountFormValues>({
    defaultValues: { userId: "", startDate: "", endDate: "" },
  });

  const completionStats = taCompletionResult as Record<string, any> | null;
  const completionManager = completionStats
    ? users.find((u: any) => getId(u) === String(completionStats.managerId))
    : null;
  const completionExpert = completionStats
    ? users.find((u: any) => getId(u) === String(completionStats.expertId))
    : null;
  const selectedFile =
    useWatch({
      control: projectForm.control,
      name: "file",
    })?.[0] ?? null;

  return (
    <>
      {!isManager && activeView === "tasks-admin" && (
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
            <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <FolderKanban size={17} />
              </div>
              <div>
                <h2 className="font-bold">پروژه‌های من</h2>
                <p className="text-[11px] text-[--text-3]">
                  {tasks.length} پروژه واگذار شده
                </p>
              </div>
            </div>
            <div className="divide-y divide-[--border]">
              {tasks.length === 0 ? (
                <p className="py-10 text-center text-sm text-[--text-3]">
                  پروژه‌ای به شما واگذار نشده
                </p>
              ) : (
                tasks.map((task: any) => (
                  <button
                    key={getId(task)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right transition hover:bg-[--surface-2]"
                    onClick={() => setSelectedTask(task)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {task.title}
                        </p>
                        {task.excelFile && (
                          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <FileSpreadsheet size={10} />
                            اکسل
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-0.5 truncate text-xs text-[--text-3]">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        COLUMNS.find((column: any) => column.status === task.status)
                          ?.badge ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabel(task.status)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {isManager && activeView === "tasks-admin" && (
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                  <FolderKanban size={17} />
                </div>
                <div>
                  <h2 className="font-bold">پروژه جدید</h2>
                  <p className="text-[11px] text-[--text-3]">
                    یک پروژه جدید برای کارشناس تعریف کن
                  </p>
                </div>
              </div>
              <button
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]"
                onClick={() =>
                  setShowNewProjectForm((value: boolean) => {
                    if (value) projectForm.reset();
                    return !value;
                  })
                }
                type="button"
              >
                {showNewProjectForm ? <X size={15} /> : <Plus size={15} />}
                {showNewProjectForm ? "بستن" : "پروژه جدید"}
              </button>
            </div>
            {showNewProjectForm && (
              <form
                className="grid gap-3 border-t border-[--border] bg-[--surface-2]/60 p-4 sm:grid-cols-2 xl:grid-cols-3"
                onSubmit={projectForm.handleSubmit(async (values) => {
                  await createTaskFromValues({
                    title: values.title,
                    assignee: values.assignee,
                    description: values.description,
                    startDate: values.startDate,
                    dueDate: values.dueDate,
                    startTime: values.startTime,
                    endTime: values.endTime,
                    file: values.file?.[0] ?? null,
                  });
                  projectForm.reset();
                })}
              >
                <Field
                  label="عنوان پروژه *"
                  name="projTitle"
                  required
                  placeholder="مثلاً: تکمیل اکسل فروش"
                  registration={projectForm.register("title", {
                    required: true,
                  })}
                />
                <Select
                  label="مسئول (کارشناس)"
                  options={users.map((user: any) => [
                    getId(user),
                    userName(user),
                  ])}
                  placeholder="بدون مسئول (خودم)"
                  registration={projectForm.register("assignee")}
                />
                <Field
                  label="توضیحات"
                  name="projDescription"
                  placeholder="شرح کوتاه پروژه"
                  registration={projectForm.register("description")}
                />
                <Field
                  label="شروع"
                  name="projStartDate"
                  type="datetime-local"
                  registration={projectForm.register("startDate")}
                />
                <Field
                  label="ددلاین"
                  name="projDueDate"
                  type="datetime-local"
                  registration={projectForm.register("dueDate")}
                />
                <Field
                  label="ساعت شروع روزانه"
                  name="projStartTime"
                  type="time"
                  registration={projectForm.register("startTime")}
                />
                <Field
                  label="ساعت پایان روزانه"
                  name="projEndTime"
                  type="time"
                  registration={projectForm.register("endTime")}
                />
                <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[--border] bg-[--surface] px-3 text-sm font-medium text-[--text-2] transition hover:bg-[--surface-2] sm:col-span-2">
                  <FileSpreadsheet size={15} className="text-[#1f7a8c]" />
                  <span className="truncate">
                    {selectedFile?.name ?? "ضمیمه فایل اکسل (اختیاری)"}
                  </span>
                  <input
                    accept=".xlsx,.xls"
                    className="hidden"
                    type="file"
                    {...projectForm.register("file")}
                  />
                </label>
                <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-3">
                  <button
                    className="h-10 flex-1 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={projectForm.formState.isSubmitting}
                    type="submit"
                  >
                    ایجاد پروژه
                  </button>
                  {selectedFile && (
                    <button
                      className="h-10 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs font-medium text-red-500"
                      onClick={() => projectForm.setValue("file", null)}
                      type="button"
                    >
                      حذف فایل
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
            <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
                <ClipboardList size={17} />
              </div>
              <div>
                <h2 className="font-bold">همه پروژه‌ها</h2>
                <p className="text-[11px] text-[--text-3]">{tasks.length} پروژه</p>
              </div>
            </div>
            <div className="max-h-[360px] divide-y divide-[--border] overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-[--text-3]">
                  پروژه‌ای یافت نشد
                </p>
              ) : (
                tasks.map((task: any) => (
                  <div
                    key={getId(task)}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {task.title}
                      </p>
                      <p className="text-xs text-[--text-3]">
                        {(task.assignedTo ?? []).map(userName).join("، ") ||
                          "بدون مسئول"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          COLUMNS.find((column: any) => column.status === task.status)
                            ?.badge ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabel(task.status)}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => void deleteTask(getId(task))}
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

          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
            <h2 className="font-bold">پروژه‌های یک کاربر بر اساس نام</h2>
            <form
              className="mt-4 flex flex-wrap items-end gap-2"
              onSubmit={lookupForm.handleSubmit(taLookupTasksFromValues)}
            >
              <Field
                label="نام"
                name="lookupFirstName"
                registration={lookupForm.register("firstName", {
                  required: true,
                })}
              />
              <Field
                label="نام خانوادگی"
                name="lookupLastName"
                registration={lookupForm.register("lastName", {
                  required: true,
                })}
              />
              <button
                className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50"
                disabled={lookupForm.formState.isSubmitting}
                type="submit"
              >
                جستجو
              </button>
            </form>
            {taLookupResult !== null && (
              <div className="mt-4 space-y-2">
                {taLookupResult.length === 0 ? (
                  <p className="text-sm text-[--text-3]">
                    پروژه‌ای برای این کاربر یافت نشد
                  </p>
                ) : (
                  taLookupResult.map((task: any) => (
                    <div
                      key={getId(task)}
                      className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface-2] px-4 py-2.5"
                    >
                      <p className="text-sm font-medium">{task.title}</p>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          COLUMNS.find((column: any) => column.status === task.status)
                            ?.badge ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabel(task.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
              <h2 className="font-bold">آمار تکمیل پروژه</h2>
              <p className="mt-1 text-xs text-[--text-3]">
                پروژه‌های ساخته‌شده توسط شما و واگذارشده به یک متخصص
              </p>
              <form
                className="mt-4 flex flex-wrap items-end gap-2"
                onSubmit={completionForm.handleSubmit(
                  taRunCompletionStatsFromValues,
                )}
              >
                <div className="min-w-[200px] flex-1">
                  <Select
                    label="متخصص"
                    options={users
                      .filter((user: any) => user.roles === "specialist")
                      .map((user: any) => [getId(user), userName(user)])}
                    placeholder="انتخاب متخصص"
                    registration={completionForm.register("expertId", {
                      required: true,
                    })}
                  />
                </div>
                <button
                  className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={completionForm.formState.isSubmitting}
                  type="submit"
                >
                  محاسبه
                </button>
              </form>
              {taCompletionResult && (
                <div className="mt-4 space-y-3 rounded-xl bg-[--surface-2] p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-[--surface] p-3">
                      <p className="text-[11px] text-[--text-3]">مدیر</p>
                      <p className="mt-1 text-sm font-semibold">
                        {completionManager
                          ? userName(completionManager)
                          : completionStats?.managerId}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[--surface] p-3">
                      <p className="text-[11px] text-[--text-3]">متخصص</p>
                      <p className="mt-1 text-sm font-semibold">
                        {completionExpert
                          ? userName(completionExpert)
                          : completionStats?.expertId}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[--surface] p-3">
                      <p className="text-[11px] text-[--text-3]">
                        کل پروژه‌ها
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {completionStats?.totalTasks}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        تکمیل شده
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {completionStats?.completedTasks}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        در انتظار
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {completionStats?.pendingTasks}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
              <h2 className="font-bold">تعداد پروژه در بازه تاریخی</h2>
              <form
                className="mt-4 grid gap-2 sm:grid-cols-2"
                onSubmit={dateCountForm.handleSubmit(taRunDateCountFromValues)}
              >
                <div className="sm:col-span-2">
                  <Select
                    label="کاربر"
                    options={users.map((user: any) => [
                      getId(user),
                      userName(user),
                    ])}
                    placeholder="انتخاب کاربر"
                    registration={dateCountForm.register("userId", {
                      required: true,
                    })}
                  />
                </div>
                <Field
                  label="از تاریخ"
                  name="taCountStart"
                  type="date"
                  registration={dateCountForm.register("startDate", {
                    required: true,
                  })}
                />
                <Field
                  label="تا تاریخ"
                  name="taCountEnd"
                  type="date"
                  registration={dateCountForm.register("endDate", {
                    required: true,
                  })}
                />
                <div className="sm:col-span-2">
                  <button
                    className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={dateCountForm.formState.isSubmitting}
                    type="submit"
                  >
                    محاسبه
                  </button>
                </div>
              </form>
              {taCountResult && (
                <pre
                  className="mt-4 overflow-x-auto rounded-xl bg-[--surface-2] p-3 text-xs text-[--text-2]"
                  dir="ltr"
                >
                  {JSON.stringify(taCountResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
