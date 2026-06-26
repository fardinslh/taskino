"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, RefreshCw, Timer } from "lucide-react";

import {
  fixedTaskApi,
  getId,
  normalizeList,
  type FixedTask,
} from "@/lib/api";
import { TaskDeadlineCountdown } from "../../../_components/task-deadline-countdown";
import {
  useFeedbackContext,
  useFixedTaskContext,
  useNavigationContext,
  useSessionContext,
} from "../../../_components/taskino-context";
import {
  effectiveTimingApprovalStatus,
  formatDurationMinutes,
} from "../../../_lib/fixed-task-timing";
import {
  formatDate,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../../../_lib/task-helpers";

export default function SupervisorPendingReportsPage() {
  const { activeView, setSelectedFixedTask } = useNavigationContext();
  const { isSupervisor, token } = useSessionContext();
  const { setError } = useFeedbackContext();
  const { fixedTasks, setFixedTasks } = useFixedTaskContext();
  const [loading, setLoading] = useState(false);

  const loadFixedTasks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const limit = 100;
      const firstResponse = await fixedTaskApi.list(token, { page: 1, limit });
      const firstPageItems = normalizeList(
        firstResponse as FixedTask[] | { data?: FixedTask[] },
      );
      const total =
        firstResponse &&
        typeof firstResponse === "object" &&
        "total" in (firstResponse as Record<string, unknown>)
          ? Number((firstResponse as Record<string, unknown>).total)
          : firstPageItems.length;
      const totalPages = Math.ceil(total / limit);
      const remainingResponses =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                fixedTaskApi.list(token, { page: index + 2, limit }),
              ),
            )
          : [];
      const remainingItems = remainingResponses.flatMap((response) =>
        normalizeList(response as FixedTask[] | { data?: FixedTask[] }),
      );

      setFixedTasks([...firstPageItems, ...remainingItems]);
    } catch (error) {
      setFixedTasks([]);
      setError(
        error instanceof Error
          ? error.message
          : "دریافت گزارش‌های ثابت ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  }, [setError, token]);

  useEffect(() => {
    if (!isSupervisor || activeView !== "supervisor-pending-reports") return;
    void loadFixedTasks();
  }, [activeView, isSupervisor, loadFixedTasks]);

  const pendingReports = useMemo(
    () =>
      fixedTasks.filter(
        (task) =>
          (task.status ?? "todo") === "done" &&
          effectiveTimingApprovalStatus(task) === "pending" &&
          task.actualDurationMinutes != null,
      ),
    [fixedTasks],
  );

  if (!isSupervisor || activeView !== "supervisor-pending-reports") {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-[--surface] dark:border-amber-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-l from-amber-50 to-white px-5 py-4 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Clock3 size={17} />
            </div>
            <div>
              <h2 className="font-bold">گزارش‌های در انتظار</h2>
              <p className="text-[11px] text-[--text-3]">
                {pendingReports.length} گزارش نیازمند تایید زمان
              </p>
            </div>
          </div>
          <button
            className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
            disabled={loading}
            onClick={() => void loadFixedTasks()}
            type="button"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={15} />
            بروزرسانی
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
            <RefreshCw className="animate-spin text-amber-500" size={34} />
            <p className="mt-3 font-semibold text-[--text]">
              در حال دریافت گزارش‌ها
            </p>
          </div>
        ) : pendingReports.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
            <Timer size={34} className="text-[--text-3]" />
            <p className="mt-3 font-semibold text-[--text]">
              گزارشی در انتظار تایید زمان نیست
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingReports.map((task) => {
              const assignee = Array.isArray(task.assignedTo)
                ? task.assignedTo[0]
                : task.assignedTo;
              const deadline = task.endDate ?? task.nextRunAt;

              return (
                <button
                  key={getId(task)}
                  className="min-h-32 rounded-xl border border-[--border] bg-[--surface] p-3 text-right shadow-sm transition hover:border-amber-400/60 hover:bg-[--surface-2] active:scale-[0.98]"
                  onClick={() => setSelectedFixedTask(task)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[--text]">
                        {task.title}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[--text-3]">
                        {assignee ? userName(assignee) : "بدون مسئول"}
                        {task.recurrence
                          ? ` · ${recurrenceLabel(task.recurrence)}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      تایید زمان
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-bold text-[--text-2]">
                      {statusLabel(task.status)}
                    </span>
                    <span className="rounded-md bg-[#e8f4f7] px-2 py-1 text-[10px] font-bold text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
                      {formatDurationMinutes(task.actualDurationMinutes)}
                    </span>
                    {task.doneTime && (
                      <span className="rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-semibold text-[--text-3]">
                        {formatDate(task.doneTime)}
                      </span>
                    )}
                  </div>

                  <TaskDeadlineCountdown
                    className="mt-3"
                    dueDate={deadline}
                    status={task.status}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
