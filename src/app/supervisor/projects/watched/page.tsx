"use client";

import { useMemo, useState } from "react";
import { ClipboardList, RefreshCw, X } from "lucide-react";

import { getId, type Task } from "@/lib/api";
import { TaskDeadlineCountdown } from "../../../_components/task-deadline-countdown";
import {
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../../../_components/taskino-context";
import { statusLabel, userName } from "../../../_lib/task-helpers";

type TaskStatusFilter = "" | "todo" | "in_progress" | "done";

export default function SupervisorWatchedProjectsPage() {
  return <SupervisorWatchedProjectsPageContent />;
}

function SupervisorWatchedProjectsPageContent() {
  const [taskStatusFilter, setTaskStatusFilter] =
    useState<TaskStatusFilter>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { activeView } = useNavigationContext();
  const { isSupervisor } = useSessionContext();
  const { loadSupervisorData, supervisorTasks } = useManagementContext();

  const filteredSupervisorTasks = useMemo(() => {
    return supervisorTasks.filter((item) => {
      if (taskStatusFilter && (item.status ?? "todo") !== taskStatusFilter) {
        return false;
      }

      return true;
    });
  }, [supervisorTasks, taskStatusFilter]);

  if (!isSupervisor || activeView !== "supervisor-watched-projects")
    return null;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-[--surface] dark:border-violet-900">
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-l from-violet-50 to-white px-5 py-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="font-bold">پروژه های تحت نظر</h2>
              <p className="text-[11px] text-[--text-3]">
                {supervisorTasks.length} گزارش
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter
              onChange={setTaskStatusFilter}
              value={taskStatusFilter}
            />
            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
              onClick={() => void loadSupervisorData()}
              type="button"
            >
              <RefreshCw size={15} />
              بروزرسانی
            </button>
          </div>
        </div>

        <div className="p-4">
          <WorkList
            emptyText="پروژه ای مطابق با فیلتر پیدا نشد"
            getId={getId}
            items={filteredSupervisorTasks}
            onSelect={setSelectedTask}
            statusLabel={statusLabel}
            userName={userName}
          />
        </div>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          item={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </section>
  );
}

function TaskDetailDialog({
  item,
  onClose,
}: {
  item: Task;
  onClose: () => void;
}) {
  const assignee = Array.isArray(item.assignedTo)
    ? item.assignedTo[0]
    : item.assignedTo;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[--border] px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-[#1f7a8c]">گزارش</p>
            <h3 className="mt-1 text-base font-bold text-[--text]">
              {item.title}
            </h3>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2] hover:text-[--text]"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <DetailItem
            label="مسئول"
            value={assignee ? userName(assignee) : "بدون مسئول"}
          />
          <DetailItem label="وضعیت" value={statusLabel(item.status)} />
          <DetailItem label="شروع" value={formatDateTime(item.startDate)} />
          <DetailItem label="ددلاین" value={formatDateTime(item.dueDate)} />
        </div>

        {item.description && (
          <div className="border-t border-[--border] px-5 py-4">
            <p className="text-xs font-semibold text-[--text-3]">توضیحات</p>
            <p className="mt-2 text-sm leading-6 text-[--text-2]">
              {item.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--surface-2] p-3">
      <p className="text-[11px] font-semibold text-[--text-3]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[--text]">{value || "—"}</p>
    </div>
  );
}

function formatDateTime(date?: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function StatusFilter({
  onChange,
  value,
}: {
  onChange: (status: TaskStatusFilter) => void;
  value: TaskStatusFilter;
}) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border border-[--border] bg-[--surface] p-1">
      {[
        ["", "همه"],
        ["todo", "در انتظار"],
        ["in_progress", "در حال انجام"],
        ["done", "تکمیل شده"],
      ].map(([status, label]) => (
        <button
          key={status}
          className={`h-7 rounded-md px-2.5 text-[11px] font-semibold transition ${
            value === status
              ? "bg-[#1f7a8c] text-white"
              : "text-[--text-2] hover:bg-[--surface-2]"
          }`}
          onClick={() => onChange(status as TaskStatusFilter)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WorkList({
  emptyText,
  getId,
  items,
  onSelect,
  statusLabel,
  userName,
}: {
  emptyText: string;
  getId: (item: any) => string;
  items: any[];
  onSelect?: (item: any) => void;
  statusLabel: (status?: string) => string;
  userName: (user?: any) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl">
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[--text-3]">{emptyText}</p>
      ) : (
        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const assignee = Array.isArray(item.assignedTo)
              ? item.assignedTo[0]
              : item.assignedTo;
            const specialistLabel = assignee
              ? userName(assignee)
              : "بدون مسئول";
            const deadline = item.dueDate ?? item.endDate;

            return (
              <div
                key={getId(item)}
                className="flex min-h-24 w-full cursor-pointer items-start gap-3 rounded-xl border border-[--border] bg-[--surface] p-3 text-right transition hover:border-[#1f7a8c]/30 hover:bg-[--surface-2]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect?.(item);
                  }
                }}
                onClick={() => onSelect?.(item)}
                role="button"
                tabIndex={0}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[--text-3]">
                    {`مسئول: ${specialistLabel}`}
                  </p>
                  <TaskDeadlineCountdown
                    className="mt-3"
                    dueDate={deadline}
                    status={item.status}
                  />
                  <span className="mt-3 inline-flex rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-bold text-[--text-2]">
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
