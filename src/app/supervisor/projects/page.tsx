"use client";

import { useMemo, useState } from "react";
import { ClipboardList, FolderKanban, RefreshCw, ScrollText } from "lucide-react";

import { getId, type FixedTask } from "@/lib/api";
import {
  useFeedbackContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
  useTaskContext,
} from "../../_components/taskino-context";
import {
  recurrenceLabel,
  statusLabel,
  userName,
} from "../../_lib/task-helpers";

type FixedTaskStatusFilter = "in_progress" | "done";

export default function SupervisorProjectsPage() {
  return <SupervisorWorkPageContent />;
}

function SupervisorWorkPageContent() {
  const [currentTime] = useState(() => Date.now());
  const [fixedTaskStatusFilter, setFixedTaskStatusFilter] =
    useState<FixedTaskStatusFilter>("in_progress");
  const { activeView, setSelectedTask } = useNavigationContext();
  const { isSupervisor } = useSessionContext();
  const { setError } = useFeedbackContext();
  const { createTaskFromValues } = useTaskContext();
  const { supervisorTasks, supervisorFixedTasks, loadSupervisorData } =
    useManagementContext();

  const filteredSupervisorFixedTasks = useMemo(() => {
    return supervisorFixedTasks.filter((item) => {
      if (item.isActive === false) return false;
      if ((item.status ?? "todo") !== fixedTaskStatusFilter) return false;

      const start = item.startDate ? new Date(item.startDate).getTime() : null;
      const end = item.endDate ? new Date(item.endDate).getTime() : null;

      if (start !== null && Number.isFinite(start) && currentTime < start) {
        return false;
      }
      if (end !== null && Number.isFinite(end) && currentTime > end) {
        return false;
      }

      return true;
    });
  }, [currentTime, fixedTaskStatusFilter, supervisorFixedTasks]);

  async function handleCreateTaskFromFixedTask(item: FixedTask) {
    const assigneeId = getId(item.assignedTo);
    if (!assigneeId) {
      setError("برای این گزارش ثابت مسئولی ثبت نشده است.");
      return;
    }

    await createTaskFromValues({
      title: item.title,
      assignee: assigneeId,
      description: item.description ?? "",
      startDate: item.startDate,
      dueDate: item.endDate,
      startTime: item.startTime,
      endTime: item.endTime,
    });
  }

  if (!isSupervisor || activeView !== "supervisor-projects") return null;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "پروژه‌ها",
            value: supervisorTasks.length,
            icon: FolderKanban,
            a: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900",
          },
          {
            label: "گزارش‌های ثابت",
            value: supervisorFixedTasks.length,
            icon: ScrollText,
            a: "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[--border] bg-[--surface] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-[--text-2]">{s.label}</p>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${s.a}`}>
                <s.icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[--text]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-[--surface] dark:border-violet-900">
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-l from-violet-50 to-white px-5 py-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="font-bold">گزارش‌های تحت نظر</h2>
              <p className="text-[11px] text-[--text-3]">
                {supervisorTasks.length} گزارش عادی ·{" "}
                {supervisorFixedTasks.length} گزارش ثابت
              </p>
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

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <WorkList
            emptyText="گزارش عادی تحت نظری یافت نشد"
            getId={getId}
            items={supervisorTasks}
            onSelect={setSelectedTask}
            statusLabel={statusLabel}
            title="پروژه ها"
            userName={userName}
          />
          <WorkList
            emptyText="گزارش ثابت منطبق با فیلتر پیدا نشد"
            getId={getId}
            items={filteredSupervisorFixedTasks}
            onCreateTask={handleCreateTaskFromFixedTask}
            onStatusFilterChange={setFixedTaskStatusFilter}
            statusFilter={fixedTaskStatusFilter}
            statusLabel={statusLabel}
            title="گزارش‌های ثابت"
            userName={userName}
          />
        </div>
      </div>
    </section>
  );
}

function WorkList({
  emptyText,
  getId,
  items,
  onCreateTask,
  onStatusFilterChange,
  onSelect,
  statusFilter,
  statusLabel,
  title,
  userName,
}: {
  emptyText: string;
  getId: (item: any) => string;
  items: any[];
  onCreateTask?: (item: any) => void | Promise<void>;
  onStatusFilterChange?: (status: FixedTaskStatusFilter) => void;
  onSelect?: (item: any) => void;
  statusFilter?: FixedTaskStatusFilter;
  statusLabel: (status?: string) => string;
  title: string;
  userName: (user?: any) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[--border]">
      <div className="border-b border-[--border] bg-[--surface-2] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold">{title}</h3>
          {onStatusFilterChange && statusFilter ? (
            <div className="flex items-center gap-1 rounded-lg border border-[--border] bg-[--surface] p-1">
              <button
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === "in_progress"
                    ? "bg-[#1f7a8c] text-white"
                    : "text-[--text-2] hover:bg-[--surface-2]"
                }`}
                onClick={() => onStatusFilterChange("in_progress")}
                type="button"
              >
                در حال انجام
              </button>
              <button
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === "done"
                    ? "bg-emerald-600 text-white"
                    : "text-[--text-2] hover:bg-[--surface-2]"
                }`}
                onClick={() => onStatusFilterChange("done")}
                type="button"
              >
                تکمیل شده
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[--text-3]">{emptyText}</p>
      ) : (
        <div className="divide-y divide-[--border]">
          {items.map((item) => {
            const assignee = Array.isArray(item.assignedTo)
              ? item.assignedTo[0]
              : item.assignedTo;
            const specialistLabel =
              item.specialistName ||
              (assignee ? userName(assignee) : "بدون مسئول");
            const content = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-[--text-3]">
                    {`مسئول: ${specialistLabel}`}
                    {item.recurrence
                      ? ` · ${recurrenceLabel(item.recurrence)}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-bold text-[--text-2]">
                  {statusLabel(item.status)}
                </span>
              </>
            );

            if (onCreateTask) {
              return (
                <button
                  key={getId(item)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-[--surface-2]"
                  onClick={() => void onCreateTask(item)}
                  type="button"
                >
                  {content}
                </button>
              );
            }

            if (onSelect) {
              return (
                <button
                  key={getId(item)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-[--surface-2]"
                  onClick={() => onSelect(item)}
                  type="button"
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={getId(item)}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
