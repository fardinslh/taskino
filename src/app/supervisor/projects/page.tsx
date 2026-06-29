"use client";

import { useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Trash2 } from "lucide-react";

import { fixedTaskApi, getId, type FixedTask } from "@/lib/api";
import { LandingPageEntrance } from "../../_components/landing-page-entrance";
import { TaskDeadlineCountdown } from "../../_components/task-deadline-countdown";
import {
  useFeedbackContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../../_components/taskino-context";
import { recurrenceLabel, statusLabel, userName } from "../../_lib/task-helpers";

type FixedTaskStatusFilter = "" | "todo" | "in_progress" | "done";

export default function SupervisorProjectsPage() {
  return <SupervisorWorkPageContent />;
}

function SupervisorWorkPageContent() {
  const [fixedTaskStatusFilter, setFixedTaskStatusFilter] =
    useState<FixedTaskStatusFilter>("");
  const [deletingId, setDeletingId] = useState("");
  const { activeView, setSelectedFixedTask } = useNavigationContext();
  const { isSupervisor, token } = useSessionContext();
  const { setError, setMessage } = useFeedbackContext();
  const { supervisorFixedTasks, loadSupervisorData } =
    useManagementContext();

  const filteredSupervisorFixedTasks = useMemo(() => {
    return supervisorFixedTasks.filter((item) => {
      if (item.isActive === false && item.status !== "done") return false;
      if (
        fixedTaskStatusFilter &&
        (item.status ?? "todo") !== fixedTaskStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [fixedTaskStatusFilter, supervisorFixedTasks]);

  async function handleDeleteFixedTask(item: FixedTask) {
    const id = getId(item);
    if (!id || deletingId) return;
    if (!window.confirm("این گزارش ثابت حذف شود؟")) return;

    setDeletingId(id);
    try {
      await fixedTaskApi.delete(token, id);
      setMessage("گزارش ثابت حذف شد.");
      await loadSupervisorData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف گزارش ثابت ناموفق بود");
    } finally {
      setDeletingId("");
    }
  }

  if (!isSupervisor || activeView !== "supervisor-projects") return null;

  return (
    <LandingPageEntrance className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-[--surface] dark:border-violet-900">
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-l from-violet-50 to-white px-5 py-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="font-bold">گزارش‌های تحت نظر</h2>
              <p className="text-[11px] text-[--text-3]">
                {supervisorFixedTasks.length} گزارش ثابت
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusFilter
              onChange={setFixedTaskStatusFilter}
              value={fixedTaskStatusFilter}
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
            emptyText="گزارش ثابت منطبق با فیلتر پیدا نشد"
            getId={getId}
            items={filteredSupervisorFixedTasks}
            deletingId={deletingId}
            onDelete={handleDeleteFixedTask}
            onSelect={setSelectedFixedTask}
            statusLabel={statusLabel}
            userName={userName}
          />
        </div>
      </div>
    </LandingPageEntrance>
  );
}

function StatusFilter({
  onChange,
  value,
}: {
  onChange: (status: FixedTaskStatusFilter) => void;
  value: FixedTaskStatusFilter;
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
          onClick={() => onChange(status as FixedTaskStatusFilter)}
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
  deletingId,
  onCreateTask,
  onDelete,
  onSelect,
  statusLabel,
  userName,
}: {
  emptyText: string;
  getId: (item: any) => string;
  items: any[];
  deletingId?: string;
  onCreateTask?: (item: any) => void | Promise<void>;
  onDelete?: (item: any) => void | Promise<void>;
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
            const specialistLabel =
              item.specialistName ||
              (assignee ? userName(assignee) : "بدون مسئول");
            const deadline = item.endDate ?? item.nextRunAt;
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[--text-3]">
                    {`مسئول: ${specialistLabel}`}
                    {item.recurrence ? ` · ${recurrenceLabel(item.recurrence)}` : ""}
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
                {onDelete && (
                  <button
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                    disabled={deletingId === getId(item)}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDelete(item);
                    }}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            );

            if (onCreateTask) {
              return (
                <button
                  key={getId(item)}
                  className="flex min-h-24 w-full items-start gap-3 rounded-xl border border-[--border] bg-[--surface] p-3 text-right transition hover:border-[#1f7a8c]/30 hover:bg-[--surface-2]"
                  onClick={() => void onCreateTask(item)}
                  type="button"
                >
                  {content}
                </button>
              );
            }

            if (onSelect) {
              return (
                <div
                  key={getId(item)}
                  className="flex min-h-24 w-full cursor-pointer items-start gap-3 rounded-xl border border-[--border] bg-[--surface] p-3 text-right transition hover:border-[#1f7a8c]/30 hover:bg-[--surface-2]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(item);
                    }
                  }}
                  onClick={() => onSelect(item)}
                  role="button"
                  tabIndex={0}
                >
                  {content}
                </div>
              );
            }

            return (
              <div
                key={getId(item)}
                className="flex min-h-24 items-start gap-3 rounded-xl border border-[--border] bg-[--surface] p-3"
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
