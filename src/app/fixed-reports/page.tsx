"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  ClipboardList,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";

import { getId } from "@/lib/api";
import {
  ActivationModal,
  FilterBar,
  FixedTaskFormPanel,
  IncompleteRow,
  TemplateRow,
  type ActivationFormValues,
  type FixedTaskFormValues,
} from "../_components/fixed-task-ui";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";

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
