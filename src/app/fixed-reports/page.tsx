"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardList, Plus, RefreshCw, Upload } from "lucide-react";

import { getId } from "@/lib/api";
import {
  FilterBar,
  FixedTaskFormPanel,
  TemplateRow,
  type FixedTaskFormValues,
} from "../_components/fixed-task-ui";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import {
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";
import { getFixedTaskScheduleValues } from "../_lib/fixed-task-schedule";
import { userName } from "../_lib/task-helpers";

export default function FixedReportsPage() {
  return <FixedReportsPageContent />;
}

function FixedReportsPageContent() {
  const { activeView, setSelectedFixedTask } = useNavigationContext();
  const { currentUser, isManager } = useSessionContext();
  const { users, loadManagerAnalytics } = useManagementContext();
  const {
    fixedTasks,
    showFixedTaskForm,
    editingFixedTask,
    openFixedTaskForm,
    closeFixedTaskForm,
    saveFixedTaskFromValues,
    deleteFixedTask,
    seedFixedTasksFromExcel,
    toggleFixedTaskActive,
  } = useFixedTaskContext();

  const form = useForm<FixedTaskFormValues>({
    defaultValues: {
      title: "",
      recurrence: "daily",
      weekdays: [6, 0, 1, 2, 3, 4],
      monthDays: [1],
      assignedTo: "",
      approvedDurationMinutes: undefined,
      description: "",
    },
  });
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");

  const visibleFixedTasks = useMemo(() => fixedTasks, [fixedTasks]);

  const filteredFixedTasks = useMemo(() => {
    const specialistQuery = filterSpecialist.trim().toLowerCase();
    const titleQuery = filterTitle.trim().toLowerCase();

    return visibleFixedTasks.filter((task: any) => {
      const recurrenceMatch =
        !filterRecurrence || (task.recurrence ?? "daily") === filterRecurrence;
      const specialistMatch =
        !specialistQuery ||
        `${userName(task.assignedTo)} ${task.specialistName ?? ""}`
          .toLowerCase()
          .includes(specialistQuery);
      const titleMatch =
        !titleQuery ||
        String(task.title ?? "").toLowerCase().includes(titleQuery);

      return recurrenceMatch && specialistMatch && titleMatch;
    });
  }, [filterRecurrence, filterSpecialist, filterTitle, visibleFixedTasks]);

  useEffect(() => {
    if (!showFixedTaskForm) return;
    const recurrence = editingFixedTask?.recurrence ?? "daily";
    const schedule = getFixedTaskScheduleValues(
      recurrence,
      editingFixedTask?.scheduleConfig,
    );
    form.reset({
      title: editingFixedTask?.title ?? "",
      recurrence,
      ...schedule,
      assignedTo: getId(editingFixedTask?.assignedTo),
      approvedDurationMinutes:
        editingFixedTask?.approvedDurationMinutes ?? undefined,
      description: editingFixedTask?.description ?? "",
    });
  }, [editingFixedTask, form, showFixedTaskForm]);

  const clearFilters = () => {
    setFilterRecurrence("");
    setFilterSpecialist("");
    setFilterTitle("");
  };

  if (!isManager || activeView !== "fixed-reports") return null;

  return (
    <LandingPageEntrance className="space-y-4">
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
                onClick={() => setSelectedFixedTask(task)}
                onEdit={() => openFixedTaskForm(task)}
                onDelete={() => void deleteFixedTask(getId(task))}
                onToggleActive={(active) => void toggleFixedTaskActive(task, active)}
              />
            ))
          )}
        </div>
      </div>
    </LandingPageEntrance>
  );
}
