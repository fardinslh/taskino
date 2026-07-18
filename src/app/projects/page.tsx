"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import {
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Layers3,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { getId, normalizeList, supervisorApi } from "@/lib/api";
import { ProjectBoardSection } from "../_components/project-board-section";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import { Field, Select } from "../_components/shared";
import {
  useFeedbackContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../_components/taskino-context";
import { COLUMNS } from "../_lib/task-constants";
import { formatDate, statusLabel, userName } from "../_lib/task-helpers";

type ProjectType = "specialist" | "general";

type ProjectFormValues = {
  title: string;
  projectType: ProjectType;
  assignee: string;
  description: string;
  startDate: string;
  dueDate: string;
  file: FileList | null;
};

type CompletionFormValues = {
  expertId: string;
};

type DateCountFormValues = {
  userId: string;
  startDate: string;
  endDate: string;
};

const PROJECT_TYPE_OPTIONS: Array<[ProjectType, string]> = [
  ["specialist", "گزارش تخصصی"],
  ["general", "گزارش عمومی"],
];

export default function ProjectsPage() {
  return <ProjectsPageContent />;
}

function ProjectsPageContent() {
  const {
    activeView,
    setSelectedTask,
    setShowNewProjectForm,
    showNewProjectForm,
    setTaskQuery,
    taskQuery,
  } = useNavigationContext();
  const { currentUser, isManager, isSupervisor, token } = useSessionContext();
  const { setError } = useFeedbackContext();
  const { supervisorTasks, users } = useManagementContext();
  const {
    tasks,
    taCompletionResult,
    taCountResult,
    claimTask,
    createTaskFromValues,
    deleteTask,
    moveTask,
    taRunCompletionStatsFromValues,
    taRunDateCountFromValues,
    specialistTaskCounts,
  } = useTaskContext();

  const specialistTotalCount = specialistTaskCounts?.total ?? 0;
  const specialistTodoCount =
    specialistTaskCounts?.todo ?? specialistTaskCounts?.pending ?? 0;
  const specialistOpenCount = specialistTodoCount;
  const specialistDoneCount =
    specialistTaskCounts?.done ?? specialistTaskCounts?.completed ?? 0;
  const specialistProgress = specialistTotalCount
    ? Math.round((specialistDoneCount / specialistTotalCount) * 100)
    : 0;
  const visibleProjectTasks = isSupervisor ? supervisorTasks : tasks;
  const [supervisorWorkFieldUsers, setSupervisorWorkFieldUsers] = useState<
    any[]
  >([]);
  const isSupervisorCreateView =
    isSupervisor && activeView === "supervisor-create-project";
  const loadSupervisorWorkFieldUsers = useEffectEvent(async () => {
    if (!token) return;

    try {
      const response = await supervisorApi.workFieldSpecialists(token);
      queueMicrotask(() =>
        setSupervisorWorkFieldUsers(normalizeList(response as any)),
      );
    } catch (error) {
      queueMicrotask(() => {
        setSupervisorWorkFieldUsers([]);
        setError(
          error instanceof Error
            ? error.message
            : "دریافت کاربران حوزه ناموفق بود",
        );
      });
    }
  });

  const projectForm = useForm<ProjectFormValues>({
    defaultValues: {
      title: "",
      projectType: "specialist",
      assignee: "",
      description: "",
      startDate: "",
      dueDate: "",
      file: null,
    },
  });
  const completionForm = useForm<CompletionFormValues>({
    defaultValues: { expertId: "" },
  });
  const dateCountForm = useForm<DateCountFormValues>({
    defaultValues: { userId: "", startDate: "", endDate: "" },
  });
  const completionStats = taCompletionResult as Record<string, any> | null;
  const dateCountStats = taCountResult as Record<string, any> | null;
  useEffect(() => {
    if (!isSupervisorCreateView || !token) return;
    queueMicrotask(() => void loadSupervisorWorkFieldUsers());
  }, [isSupervisorCreateView, token]);

  const selectableUsers = isSupervisorCreateView
    ? supervisorWorkFieldUsers
    : users;
  const lookupUsers = useMemo(() => {
    const mergedUsers = [currentUser, ...selectableUsers, ...users].filter(
      Boolean,
    );
    const seen = new Set<string>();

    return mergedUsers.filter((user: any) => {
      const id = getId(user);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [currentUser, selectableUsers, users]);

  const completionManager = completionStats
    ? lookupUsers.find(
        (u: any) => getId(u) === String(completionStats.managerId),
      )
    : null;
  const completionExpert = completionStats
    ? lookupUsers.find(
        (u: any) => getId(u) === String(completionStats.expertId),
      )
    : null;

  const selectedFile =
    useWatch({
      control: projectForm.control,
      name: "file",
    })?.[0] ?? null;
  const projectType =
    useWatch({
      control: projectForm.control,
      name: "projectType",
    }) ?? "specialist";
  const projectStartDate = useWatch({
    control: projectForm.control,
    name: "startDate",
  });
  useEffect(() => {
    if (projectType === "general") {
      projectForm.setValue("assignee", "");
    }
  }, [projectForm, projectType]);
  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const resolveUserRole = (user: any) => user?.roles ?? user?.role ?? "";

  const scopedUsers = selectableUsers.filter((user: any) => {
    if (!currentUser?.workField || !user?.workField) return true;
    return user.workField === currentUser.workField;
  });

  const scopedAssigneeOptions = scopedUsers
    .filter((user: any) => {
      const role = resolveUserRole(user);
      return role === "specialist" || role === "supervisor";
    })
    .map((user: any) => [getId(user), userName(user)] as [string, string]);

  const scopedSpecialistOptions = scopedUsers
    .filter((user: any) => {
      const role = resolveUserRole(user);
      return role === "specialist" || role === "supervisor";
    })
    .map((user: any) => [getId(user), userName(user)] as [string, string]);

  const scopedUserOptions = scopedUsers.map(
    (user: any) => [getId(user), userName(user)] as [string, string],
  );
  const dateCountUser = dateCountStats
    ? lookupUsers.find(
        (user: any) => getId(user) === String(dateCountStats.userId),
      )
    : null;
  const dateCountHasData = Math.max(
    Number(dateCountStats?.totalTasks ?? 0),
    Number(dateCountStats?.completedTasks ?? 0),
    Number(dateCountStats?.pendingTasks ?? 0),
    Number(dateCountStats?.todoTasks ?? 0),
  );
  const createTitle = "گزارش جدید محول‌شده به کارشناس";
  const createButtonLabel = "گزارش جدید";
  const titleFieldLabel = "عنوان گزارش *";
  const titlePlaceholder = "مثلاً: تکمیل اکسل فروش";
  const descriptionPlaceholder = "شرح کوتاه گزارش";
  const assigneeLabel = "کارشناس مسئول گزارش";
  function formatLocalDateBoundary(value: string, endOfDay = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const normalized = new Date(date);
    if (endOfDay) {
      normalized.setHours(23, 59, 59, 999);
    } else {
      normalized.setHours(0, 0, 0, 0);
    }

    return normalized.toISOString();
  }

  return (
    <>
      {!isManager && !isSupervisor && activeView === "tasks-admin" && (
        <ProjectBoardSection
          doneCount={specialistDoneCount}
          onClaimTask={claimTask}
          onMoveTask={moveTask}
          onSearchChange={setTaskQuery}
          onSelectTask={setSelectedTask}
          openCount={specialistOpenCount}
          progress={specialistProgress}
          taskQuery={taskQuery}
          tasks={tasks}
          totalCount={specialistTotalCount}
        />
      )}

      {((isManager && activeView === "tasks-admin") ||
        (isSupervisor &&
          (activeView === "tasks-admin" ||
            activeView === "supervisor-create-project"))) && (
        <LandingPageEntrance className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-[--border] bg-[--surface] shadow-sm">
            <div className="border-b border-[--border] bg-[radial-gradient(circle_at_top_left,_rgba(31,122,140,0.16),_transparent_42%),linear-gradient(135deg,rgba(31,122,140,0.10),transparent_50%)] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-bold">{createTitle}</h2>
                    <p className="text-[12px] text-[--text-3]">
                      نوع گزارش را مشخص کن، بعد
                      مسئول مناسب همان حوزه را انتخاب کن.
                    </p>
                  </div>
                </div>
                <button
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]"
                  onClick={() => {
                    if (showNewProjectForm) projectForm.reset();
                    setShowNewProjectForm(!showNewProjectForm);
                  }}
                  type="button"
                >
                  {showNewProjectForm ? <X size={15} /> : <Plus size={15} />}
                  {showNewProjectForm ? "بستن فرم" : createButtonLabel}
                </button>
              </div>
            </div>

            {showNewProjectForm && (
              <form
                className="grid gap-4 bg-[--surface-2]/40 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
                onSubmit={projectForm.handleSubmit(async (values) => {
                  const now = new Date();
                  if (values.startDate && new Date(values.startDate) < now) {
                    projectForm.setError("startDate", {
                      message: "تاریخ شروع نمی‌تواند در گذشته باشد.",
                    });
                    return;
                  }
                  if (values.dueDate && new Date(values.dueDate) < now) {
                    projectForm.setError("dueDate", {
                      message: "ددلاین نمی‌تواند در گذشته باشد.",
                    });
                    return;
                  }
                  if (
                    values.startDate &&
                    values.dueDate &&
                    new Date(values.dueDate) < new Date(values.startDate)
                  ) {
                    projectForm.setError("dueDate", {
                      message: "ددلاین باید بعد از تاریخ شروع باشد.",
                    });
                    return;
                  }
                  if (values.projectType === "specialist" && !values.assignee) {
                    projectForm.setError("assignee", {
                      message: "انتخاب کارشناس مسئول گزارش الزامی است.",
                    });
                    return;
                  }
                  await createTaskFromValues({
                    title: values.title,
                    projectType: values.projectType,
                    assignee:
                      values.projectType === "specialist"
                        ? values.assignee
                        : "",
                    description: values.description,
                    startDate: values.startDate,
                    endDate: values.dueDate,
                    file: values.file?.[0] ?? null,
                  });
                  projectForm.reset();
                })}
              >
                <div className="space-y-4 rounded-2xl border border-[--border] bg-[--surface] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[--text]">
                    <Layers3 size={15} className="text-[#1f7a8c]" />
                    مشخصات گزارش
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label={titleFieldLabel}
                      name="projTitle"
                      required
                      placeholder={titlePlaceholder}
                      registration={projectForm.register("title", {
                        required: true,
                      })}
                    />
                    <Select
                      label="نوع گزارش"
                      options={PROJECT_TYPE_OPTIONS}
                      placeholder="انتخاب نوع گزارش"
                      registration={projectForm.register("projectType", {
                        required: true,
                      })}
                    />
                  </div>
                  <Field
                    label="توضیحات"
                    name="projDescription"
                    placeholder={descriptionPlaceholder}
                    registration={projectForm.register("description")}
                  />
                  <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[--border] bg-[--surface-2] px-3 text-sm font-medium text-[--text-2] transition hover:bg-[--surface]">
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
                </div>

                <div className="space-y-4 rounded-2xl border border-[--border] bg-[--surface] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[--text]">
                    <FolderKanban size={15} className="text-[#1f7a8c]" />
                    تخصیص و زمان‌بندی
                  </div>
                  <div className="rounded-xl bg-[--surface-2] p-3 text-xs text-[--text-2]">
                    {projectType === "general"
                      ? "گزارش عمومی است و برای همه نمایش داده می‌شود."
                      : "گزارش تخصصی است؛ فقط متخصص‌های همان حوزه نمایش داده می‌شوند."}
                  </div>
                  {projectType === "specialist" && (
                    <Select
                      label={assigneeLabel}
                      options={scopedAssigneeOptions}
                      placeholder="انتخاب متخصص"
                      registration={projectForm.register("assignee", {
                        required: true,
                      })}
                    />
                  )}
                  {projectForm.formState.errors.assignee && (
                    <span className="-mt-2 block text-xs text-red-500">
                      {projectForm.formState.errors.assignee.message}
                    </span>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["startDate", "dueDate"] as const).map((name) => (
                      <label className="block" key={name}>
                        <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                          {name === "startDate" ? "شروع" : "ددلاین"}
                        </span>
                        <Controller
                          control={projectForm.control}
                          name={name}
                          render={({ field }) => (
                            <DatePicker
                              portal
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
                                name === "dueDate" && projectStartDate
                                  ? new Date(projectStartDate)
                                  : todayStart
                              }
                              format="YYYY/MM/DD HH:mm"
                              calendarPosition="bottom-right"
                              inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                              containerClassName="w-full"
                              zIndex={10000}
                              placeholder={
                                name === "startDate"
                                  ? "انتخاب تاریخ شروع"
                                  : "انتخاب ددلاین"
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
                        {projectForm.formState.errors[name] && (
                          <span className="mt-1 block text-xs text-red-500">
                            {projectForm.formState.errors[name]?.message}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="h-10 flex-1 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={projectForm.formState.isSubmitting}
                      type="submit"
                    >
                      ایجاد گزارش
                    </button>
                    {selectedFile && (
                      <button
                        className="h-10 rounded-xl border border-[--border] bg-[--surface] px-3 text-xs font-medium text-red-500"
                        onClick={() => projectForm.setValue("file", null)}
                        type="button"
                      >
                        حذف فایل
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
              <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
                  <ClipboardList size={17} />
                </div>
                <div>
                  <h2 className="font-bold">همه گزارشات محول شده به کارشناس</h2>
                  <p className="text-[11px] text-[--text-3]">
                    {visibleProjectTasks.length} گزارش
                  </p>
                </div>
              </div>
              <div className="max-h-[420px] divide-y divide-[--border] overflow-y-auto">
                {visibleProjectTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[--text-3]">
                    گزارشی یافت نشد
                  </p>
                ) : (
                  visibleProjectTasks.map((task: any) => (
                    <div
                      key={getId(task)}
                      className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 transition hover:bg-[--surface-2]"
                      onClick={() => setSelectedTask(task)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTask(task);
                        }
                      }}
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
                        {task.ratingScore != null && (
                          <span
                            aria-label={`امتیاز مدیر: ${task.ratingScore} از ۵`}
                            className="flex items-center gap-px text-amber-500"
                            title={`امتیاز مدیر: ${task.ratingScore} از ۵`}
                          >
                            {[1, 2, 3, 4, 5].map((score) => (
                              <Star
                                fill={
                                  score <= Math.round(task.ratingScore ?? 0)
                                    ? "currentColor"
                                    : "none"
                                }
                                key={score}
                                size={12}
                              />
                            ))}
                          </span>
                        )}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            COLUMNS.find(
                              (column: any) => column.status === task.status,
                            )?.badge ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabel(task.status)}
                        </span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteTask(getId(task));
                          }}
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

            <div className="space-y-4">
              <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                <h2 className="font-bold">آمار تکمیل گزارشات محول شده به کارشناس</h2>
                <p className="mt-1 text-xs text-[--text-3]">
                  گزارشات ساخته‌شده توسط شما و واگذارشده به یک متخصص یا سرپرست
                </p>
                <form
                  className="mt-4 flex flex-wrap items-end gap-2"
                  onSubmit={completionForm.handleSubmit(
                    taRunCompletionStatsFromValues,
                  )}
                >
                  <div className="min-w-[200px] flex-1">
                    <Select
                      label="متخصص یا سرپرست"
                      options={scopedSpecialistOptions}
                      placeholder="انتخاب متخصص یا سرپرست"
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
                          کل گزارشات محول شده به کارشناس
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {completionStats?.totalTasks}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
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
                <h2 className="font-bold">تعداد گزارشات محول شده به کارشناس در بازه تاریخی</h2>
                <form
                  className="mt-4 grid gap-2 sm:grid-cols-2"
                  onSubmit={dateCountForm.handleSubmit((values) =>
                    taRunDateCountFromValues({
                      ...values,
                      startDate: formatLocalDateBoundary(values.startDate),
                      endDate: formatLocalDateBoundary(values.endDate, true),
                    }),
                  )}
                >
                  <div className="sm:col-span-2">
                    <Select
                      label="کاربر"
                      options={scopedUserOptions}
                      placeholder="انتخاب کاربر"
                      registration={dateCountForm.register("userId", {
                        required: true,
                      })}
                    />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                      از تاریخ
                    </span>
                    <Controller
                      control={dateCountForm.control}
                      name="startDate"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <DatePicker
                          portal
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
                          format="YYYY/MM/DD"
                          calendarPosition="bottom-right"
                          inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                          containerClassName="w-full"
                          zIndex={10000}
                          placeholder="انتخاب تاریخ شروع"
                        />
                      )}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                      تا تاریخ
                    </span>
                    <Controller
                      control={dateCountForm.control}
                      name="endDate"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <DatePicker
                          portal
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
                          format="YYYY/MM/DD"
                          calendarPosition="bottom-right"
                          inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                          containerClassName="w-full"
                          zIndex={10000}
                          placeholder="انتخاب تاریخ پایان"
                        />
                      )}
                    />
                  </label>
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
                {dateCountStats && (
                  <div className="mt-4 rounded-2xl border border-[#cbe8ef] bg-gradient-to-br from-[#f4fbfd] to-[#ffffff] p-4 shadow-sm dark:border-[#1f5060] dark:from-[#0f2535] dark:to-[#0b1220]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8ecf1] pb-3 dark:border-[#1f5060]">
                      <div>
                        <p className="text-xs font-semibold text-[--text-3]">
                          نتیجه بازه تاریخی
                        </p>
                        <h3 className="mt-1 font-bold text-[--text]">
                          {dateCountUser
                            ? userName(dateCountUser)
                            : "کاربر انتخاب‌شده"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#1f7a8c]">
                        <span className="rounded-full bg-[#e8f4f7] px-2.5 py-1 dark:bg-[#0f3040]">
                          {dateCountStats.startDate
                            ? formatDate(dateCountStats.startDate)
                            : "—"}
                        </span>
                        <span className="rounded-full bg-[#e8f4f7] px-2.5 py-1 dark:bg-[#0f3040]">
                          تا
                        </span>
                        <span className="rounded-full bg-[#e8f4f7] px-2.5 py-1 dark:bg-[#0f3040]">
                          {dateCountStats.endDate
                            ? formatDate(dateCountStats.endDate)
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "کل گزارشات محول شده به کارشناس",
                          value: dateCountStats.totalTasks ?? 0,
                          tone: "text-[#1f7a8c]",
                          bg: "bg-[#e8f4f7] dark:bg-[#0f3040]",
                        },
                        {
                          label: "تکمیل‌شده",
                          value: dateCountStats.completedTasks ?? 0,
                          tone: "text-emerald-600",
                          bg: "bg-emerald-50 dark:bg-emerald-950/40",
                        },
                        {
                          label: "در انتظار",
                          value: dateCountStats.pendingTasks ?? 0,
                          tone: "text-amber-600",
                          bg: "bg-amber-50 dark:bg-amber-950/40",
                        },
                        {
                          label: "باز / todo",
                          value: dateCountStats.todoTasks ?? 0,
                          tone: "text-slate-600",
                          bg: "bg-slate-50 dark:bg-slate-900/40",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl ${item.bg} p-4 ring-1 ring-black/5 dark:ring-white/5`}
                        >
                          <p className="text-[11px] font-semibold text-[--text-3]">
                            {item.label}
                          </p>
                          <p className={`mt-1 text-2xl font-bold ${item.tone}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {dateCountHasData === 0 && (
                      <div className="mt-4 rounded-xl border border-dashed border-[#cfe7ec] bg-white/70 px-4 py-3 text-sm text-[--text-2] dark:border-[#1f5060] dark:bg-white/5">
                        در این بازه گزارشی ثبت نشده است.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </LandingPageEntrance>
      )}
    </>
  );
}
