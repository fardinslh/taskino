"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import {
  AlertTriangle,
  CalendarDays,
  CircleDashed,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  Layers3,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

import { getId } from "@/lib/api";
import {
  ActivationModal,
  FilterBar,
  FixedTaskFormPanel,
  IncompleteRow,
  TemplateRow,
  type FixedTaskFormValues,
} from "../_components/fixed-task-ui";
import { AssigneeStack, Field, Select } from "../_components/shared";
import {
  useFixedTaskContext,
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
  ["specialist", "پروژه تخصصی"],
  ["general", "پروژه عمومی"],
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
  const { currentUser, isManager, isSupervisor } = useSessionContext();
  const { users, supervisorStats, loadSupervisorData } = useManagementContext();
  const {
    fixedTasks,
    incompleteFixedTasks,
    fixedReportsTab,
    setFixedReportsTab,
    showFixedTaskForm,
    editingFixedTask,
    openFixedTaskForm,
    closeFixedTaskForm,
    saveFixedTaskFromValues,
    activateFixedTask,
    deactivateFixedTask,
    deleteFixedTask,
    seedFixedTasksFromExcel,
  } = useFixedTaskContext();
  const [activatingTask, setActivatingTask] = useState<any>(null);
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const {
    tasks,
    taCompletionResult,
    taCountResult,
    createTaskFromValues,
    deleteTask,
    moveTask,
    taRunCompletionStatsFromValues,
    taRunDateCountFromValues,
    specialistTaskCounts,
  } = useTaskContext();

  const specialistTotalCount = specialistTaskCounts?.total ?? 0;
  const specialistTodoCount = specialistTaskCounts?.todo ?? specialistTaskCounts?.pending ?? 0;
  const specialistInProgressCount = specialistTaskCounts?.inProgress ?? specialistTaskCounts?.in_progress ?? 0;
  const specialistOpenCount = specialistTodoCount + specialistInProgressCount;
  const specialistDoneCount = specialistTaskCounts?.done ?? specialistTaskCounts?.completed ?? 0;
  const specialistProgress =
    specialistTotalCount ? Math.round((specialistDoneCount / specialistTotalCount) * 100) : 0;
  const projectBoardTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task: any) => {
      const haystack = [
        task.title,
        task.description,
        statusLabel(task.status),
        userName(task.assignedTo),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [taskQuery, tasks]);

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
  const fixedTaskForm = useForm<FixedTaskFormValues>({
    defaultValues: { title: "", recurrence: "daily", assignedTo: "", description: "" },
  });

  const visibleFixedTasks = fixedTasks.filter((item: any) => item.isActive !== true);
  const supervisedFixedTasksCount = supervisorStats?.supervisedFixedTasks ?? 0;
  const filteredFixedTasks = useMemo(() => {
    const specialistQuery = filterSpecialist.trim().toLowerCase();
    const titleQuery = filterTitle.trim().toLowerCase();
    return visibleFixedTasks.filter((task: any) => {
      const recurrenceMatch = !filterRecurrence || (task.recurrence ?? "daily") === filterRecurrence;
      const specialistMatch = !specialistQuery || userName(task.assignedTo).toLowerCase().includes(specialistQuery);
      const titleMatch = !titleQuery || String(task.title ?? "").toLowerCase().includes(titleQuery);
      return recurrenceMatch && specialistMatch && titleMatch;
    });
  }, [filterRecurrence, filterSpecialist, filterTitle, visibleFixedTasks]);

  useEffect(() => {
    if (!showFixedTaskForm) return;
    fixedTaskForm.reset({
      title: editingFixedTask?.title ?? "",
      recurrence: editingFixedTask?.recurrence ?? "daily",
      assignedTo: getId(editingFixedTask?.assignedTo),
      description: editingFixedTask?.description ?? "",
    });
  }, [editingFixedTask, fixedTaskForm, showFixedTaskForm]);

  const clearFilters = () => { setFilterRecurrence(""); setFilterSpecialist(""); setFilterTitle(""); };

  const completionStats = taCompletionResult as Record<string, any> | null;
  const dateCountStats = taCountResult as Record<string, any> | null;
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
  const projectType =
    useWatch({
      control: projectForm.control,
      name: "projectType",
    }) ?? "specialist";
  const projectStartDate = useWatch({
    control: projectForm.control,
    name: "startDate",
  });
  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const scopedUsers = users.filter((user: any) => {
    if (!currentUser?.workField) return true;
    return user.workField === currentUser.workField;
  });

  const scopedAssigneeOptions = scopedUsers
    .filter((user: any) => {
      if (projectType === "general") {
        return user.roles === "specialist" || user.roles === "supervisor";
      }
      return user.roles === "specialist";
    })
    .map((user: any) => [getId(user), userName(user)] as [string, string]);

  const scopedSpecialistOptions = scopedUsers
    .filter((user: any) => user.roles === "specialist")
    .map((user: any) => [getId(user), userName(user)] as [string, string]);

  const scopedUserOptions = scopedUsers.map(
    (user: any) => [getId(user), userName(user)] as [string, string],
  );
  const dateCountUser = dateCountStats
    ? users.find((user: any) => getId(user) === String(dateCountStats.userId))
    : null;
  const dateCountHasData = Math.max(
    Number(dateCountStats?.totalTasks ?? 0),
    Number(dateCountStats?.completedTasks ?? 0),
    Number(dateCountStats?.pendingTasks ?? 0),
    Number(dateCountStats?.todoTasks ?? 0),
  );
  const createTitle = isSupervisor ? "گزارش جدید" : "پروژه جدید";
  const createButtonLabel = isSupervisor ? "گزارش جدید" : "پروژه جدید";
  const titleFieldLabel = isSupervisor ? "عنوان گزارش *" : "عنوان پروژه *";
  const titlePlaceholder = isSupervisor
    ? "مثلاً: تکمیل اکسل فروش"
    : "مثلاً: تکمیل اکسل فروش";
  const descriptionPlaceholder = isSupervisor
    ? "شرح کوتاه گزارش"
    : "شرح کوتاه پروژه";
  const assigneeLabel = isSupervisor ? "مسئول گزارش" : "مسئول پروژه";
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
        <section className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "پروژه‌ها",
                value: specialistTotalCount,
                sub: "واگذارشده",
                icon: FolderKanban,
                a: "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
              },
              {
                label: "پروژه‌های باز",
                value: specialistOpenCount,
                sub: `${specialistInProgressCount} در حال انجام`,
                icon: ClipboardList,
                a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
              },
              {
                label: "تکمیل شده",
                value: specialistDoneCount,
                sub: `${specialistProgress}% پیشرفت`,
                icon: TrendingUp,
                a: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[--border] bg-[--surface] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[--text-2]">{s.label}</p>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${s.a}`}
                  >
                    <s.icon size={15} />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-[--text]">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-[--text-3]">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#b8dfe8] bg-[--surface] shadow-md shadow-[#1f7a8c]/8 dark:border-[#1f5060]">
            <div className="flex flex-col gap-3 border-b border-[#cce8ef] bg-gradient-to-l from-[#e0f4f8] to-[#f0fafb] px-5 py-4 dark:border-[#1f5060] dark:from-[#0f2535] dark:to-[#0f172a] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <FolderKanban size={17} />
              </div>
              <div>
                <h2 className="font-bold">برد پروژه‌ها</h2>
                <p className="text-[11px] text-[--text-3]">
                  {tasks.length} پروژه واگذارشده · {specialistInProgressCount} در حال انجام · {specialistDoneCount} تکمیل شده
                </p>
              </div>
              <input
                className="h-8 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] sm:mr-auto sm:w-52"
                onChange={(event) => setTaskQuery(event.target.value)}
                placeholder="جستجوی پروژه..."
                value={taskQuery}
              />
            </div>

            <DragDropContext
              onDragEnd={(result: any) => {
                if (!result.destination) return;
                if (result.source.droppableId === result.destination.droppableId) return;
                void moveTask(result.draggableId, result.destination.droppableId);
              }}
            >
              <div className="grid gap-4 bg-[--surface-2]/40 p-4 lg:grid-cols-3">
                {COLUMNS.map((column: any) => {
                  const columnTasks = projectBoardTasks.filter(
                    (task: any) => (task.status ?? "todo") === column.status,
                  );

                  return (
                    <div
                      className={`overflow-hidden rounded-2xl border ${column.border} ${column.colBg}`}
                      key={column.status}
                    >
                      <div className={`bg-gradient-to-l ${column.headerGrad} px-4 py-3`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                            <h3 className={`text-sm font-bold ${column.headerText}`}>
                              {column.title}
                            </h3>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${column.badge}`}>
                            {columnTasks.length}
                          </span>
                        </div>
                      </div>

                      <Droppable droppableId={column.status}>
                        {(dropProvided: any, dropSnapshot: any) => (
                          <div
                            ref={dropProvided.innerRef}
                            {...dropProvided.droppableProps}
                            className={`min-h-72 space-y-3 p-3 transition ${
                              dropSnapshot.isDraggingOver ? "bg-white/45 dark:bg-white/5" : ""
                            }`}
                          >
                            {columnTasks.length === 0 ? (
                              <div className={`flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed ${column.emptyBorder} bg-white/45 text-center dark:bg-slate-900/20`}>
                                <CircleDashed size={20} className="text-[--text-3]" />
                                <p className="mt-2 text-xs text-[--text-3]">پروژه‌ای نیست</p>
                              </div>
                            ) : (
                              columnTasks.map((task: any, index: number) => {
                                const taskId = getId(task);
                                const isDone = (task.status ?? "todo") === "done";

                                return (
                                  <Draggable
                                    draggableId={taskId}
                                    index={index}
                                    isDragDisabled={isDone}
                                    key={taskId}
                                  >
                                    {(dragProvided: any, dragSnapshot: any) => (
                                      <article
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`rounded-xl border border-[--border] border-t-[3px] ${column.cardBorder} bg-[--surface] p-3.5 shadow-sm transition-all ${isDone ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} hover:-translate-y-0.5 hover:shadow-md ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : ""}`}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${column.badge}`}>
                                            {statusLabel(task.status)}
                                          </span>
                                          {task.excelFile && (
                                            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                              <FileSpreadsheet size={10} />
                                              اکسل
                                            </span>
                                          )}
                                        </div>
                                        <div className="mt-2.5 flex items-start gap-2">
                                          <ClipboardList size={15} className="mt-0.5 shrink-0 text-[#1f7a8c]" />
                                          <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                                            {task.title}
                                          </h4>
                                        </div>
                                        {task.description && (
                                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">
                                            {task.description}
                                          </p>
                                        )}
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                          <AssigneeStack fallback={task.assignedTo} />
                                          {task.dueDate && (
                                            <div className="flex items-center gap-1 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] text-[--text-3]">
                                              <CalendarDays size={10} />
                                              {formatDate(task.dueDate)}
                                            </div>
                                          )}
                                        </div>
                                      </article>
                                    )}
                                  </Draggable>
                                );
                              })
                            )}
                            {dropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        </section>
      )}

      {isManager && activeView === "tasks-admin" && (
        <section className="space-y-4">
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
                      نوع {isSupervisor ? "گزارش" : "پروژه"} را مشخص کن، بعد مسئول مناسب همان حوزه را انتخاب کن.
                    </p>
                  </div>
                </div>
                <button
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]"
                  onClick={() =>
                    setShowNewProjectForm((value: boolean) => {
                      if (value) projectForm.reset();
                      return !value;
                    })
                  }
                  type="button"
                >
                  {showNewProjectForm ? <X size={15} /> : <Plus size={15} />}
                  {showNewProjectForm ? "بستن فرم" : createButtonLabel}
                </button>
              </div>
            </div>

            {showNewProjectForm && (
              <form
                className="grid gap-4 bg-[--surface-2]/40 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
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
                  await createTaskFromValues({
                    title: values.title,
                    assignee: values.assignee,
                    description: values.description,
                    startDate: values.startDate,
                    dueDate: values.dueDate,
                    file: values.file?.[0] ?? null,
                  });
                  projectForm.reset();
                })}
              >
                <div className="space-y-4 rounded-2xl border border-[--border] bg-[--surface] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[--text]">
                    <Layers3 size={15} className="text-[#1f7a8c]" />
                    مشخصات پروژه
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
                      label="نوع پروژه"
                      options={PROJECT_TYPE_OPTIONS}
                      placeholder="انتخاب نوع پروژه"
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
                      ? `${isSupervisor ? "گزارش" : "پروژه"} عمومی است؛ می‌توانی از بین متخصص یا سرپرست همان حوزه انتخاب کنی.`
                      : `${isSupervisor ? "گزارش" : "پروژه"} تخصصی است؛ فقط متخصص‌های همان حوزه نمایش داده می‌شوند.`}
                  </div>
                  <Select
                    label={assigneeLabel}
                    options={scopedAssigneeOptions}
                    placeholder={
                      projectType === "general"
                        ? "انتخاب متخصص یا سرپرست"
                        : "انتخاب متخصص"
                    }
                    registration={projectForm.register("assignee")}
                  />
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
                      ایجاد {isSupervisor ? "گزارش" : "پروژه"}
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
                  <h2 className="font-bold">همه پروژه‌ها</h2>
                  <p className="text-[11px] text-[--text-3]">{tasks.length} پروژه</p>
                </div>
              </div>
              <div className="max-h-[420px] divide-y divide-[--border] overflow-y-auto">
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

            <div className="space-y-4">
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
                      options={scopedSpecialistOptions}
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
                        <p className="text-[11px] text-[--text-3]">کل پروژه‌ها</p>
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
                <h2 className="font-bold">تعداد پروژه در بازه تاریخی</h2>
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
                          {dateCountUser ? userName(dateCountUser) : "کاربر انتخاب‌شده"}
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
                          label: "کل پروژه‌ها",
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
                        در این بازه پروژه‌ای ثبت نشده است.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {isSupervisor && activeView === "tasks-admin" && (
        <section className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: "الگوهای ثابت", value: visibleFixedTasks.length },
              { label: "انجام‌نشده", value: incompleteFixedTasks.length },
              { label: "فعال", value: supervisedFixedTasksCount },
              { label: "مهلت‌گذشته", value: incompleteFixedTasks.filter((item: any) => item.deadlineStatus === "overdue").length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
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
                    <p className="text-[11px] text-[--text-3]">{visibleFixedTasks.length} الگو تعریف شده</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                    onClick={() => void loadSupervisorData()}
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
                  form={fixedTaskForm}
                  editingFixedTask={editingFixedTask}
                  users={users}
                  currentUser={currentUser}
                  onClose={() => { closeFixedTaskForm(); fixedTaskForm.reset(); }}
                  onSubmit={async (values) => {
                    await saveFixedTaskFromValues(values);
                    await loadSupervisorData();
                    fixedTaskForm.reset();
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
                    <p className="mt-3 font-semibold text-[--text]">موردی با این فیلترها پیدا نشد</p>
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
                    <p className="text-[11px] text-[--text-3]">{incompleteFixedTasks.length} مورد نیاز به بررسی</p>
                  </div>
                </div>
                <button
                  className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                  onClick={() => void loadSupervisorData()}
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
              onActivate={async (values) => {
                const activated = await activateFixedTask(activatingTask, values);
                if (activated) await loadSupervisorData();
                return activated;
              }}
            />
          )}
        </section>
      )}
    </>
  );
}
