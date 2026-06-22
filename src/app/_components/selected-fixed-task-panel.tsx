"use client";

import { useState } from "react";

import { CheckCircle2, ChevronLeft, CircleDashed, Repeat, X } from "lucide-react";

import { getId, type FixedTask, type FixedTaskStatus } from "@/lib/api";
import { formatDate, recurrenceLabel, statusLabel, userName } from "../_lib/task-helpers";

const FIXED_TASK_STATUSES: FixedTaskStatus[] = ["todo", "in_progress", "done"];

export function SelectedFixedTaskPanel({
  canChangeStatus,
  canEditTemplate,
  canDeleteTemplate,
  canReviewTiming,
  onClose,
  onDelete,
  onEdit,
  onStatusChange,
  onReviewTiming,
  task,
}: {
  canChangeStatus: boolean;
  canEditTemplate: boolean;
  canDeleteTemplate: boolean;
  canReviewTiming: boolean;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: FixedTask) => void;
  onStatusChange: (taskId: string, status: FixedTaskStatus) => void;
  onReviewTiming: (
    taskId: string,
    status: "approved" | "rejected",
    approvedDurationMinutes?: number,
  ) => Promise<void>;
  task: FixedTask;
}) {
  const taskId = getId(task);
  const assignee = Array.isArray(task.assignedTo)
    ? task.assignedTo[0]
    : task.assignedTo;
  const currentStatus = task.status ?? "todo";
  const [approvedDuration, setApprovedDuration] = useState(
    String(task.actualDurationMinutes ?? ""),
  );
  const [reviewing, setReviewing] = useState(false);
  const timingPending =
    canReviewTiming &&
    currentStatus === "done" &&
    task.timingApprovalStatus === "pending" &&
    !!task.actualDurationMinutes;
  const timingStatusLabel =
    task.timingApprovalStatus === "approved"
      ? "تأیید شده"
      : task.timingApprovalStatus === "rejected"
        ? "رد شده"
        : "در انتظار بررسی";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm dark:bg-black/50"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-[--surface] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
          <h3 className="font-bold text-[--text]">جزئیات گزارش ثابت</h3>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2] hover:text-[--text]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-start gap-2">
            {currentStatus === "done" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : currentStatus === "in_progress" ? (
              <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-[#1f7a8c] border-t-transparent animate-spin" />
            ) : (
              <CircleDashed size={18} className="mt-0.5 shrink-0 text-[--text-3]" />
            )}
            <div>
              <h2 className="text-lg font-bold leading-snug text-[--text]">
                {task.title}
              </h2>
              <p className="mt-1 text-xs text-[--text-3]">
                ثابت · {recurrenceLabel(task.recurrence)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-[--text-3]">توضیحات</p>
            <p className="rounded-xl bg-[--surface-2] px-3 py-2.5 text-sm leading-relaxed text-[--text]">
              {task.description || "بدون توضیحات"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-[--text-3]">وضعیت</p>
            <div className="flex flex-wrap gap-2">
              {FIXED_TASK_STATUSES.map((status) => (
                <button
                  key={status}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    currentStatus === status
                      ? "border-transparent bg-[#1f7a8c] text-white"
                      : "border-[--border] text-[--text-2] hover:bg-[--surface-2]"
                  } ${!canChangeStatus ? "cursor-default opacity-60" : ""}`}
                  disabled={!canChangeStatus}
                  onClick={() => canChangeStatus && onStatusChange(taskId, status)}
                  type="button"
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[--surface-2] p-4 space-y-3">
            <MetaRow label="مسئول" value={assignee ? userName(assignee) : "بدون مسئول"} />
            <MetaRow label="فعال" value={task.isActive === false ? "خیر" : "بله"} />
            <MetaRow label="تکرار" value={recurrenceLabel(task.recurrence)} />
            <MetaRow label="شروع" value={formatDate(task.startDate)} />
            <MetaRow label="پایان" value={formatDate(task.endDate)} />
            <MetaRow label="نوبت بعدی" value={formatDate(task.nextRunAt)} />
            <MetaRow label="ایجاد" value={formatDate(task.createdAt)} />
            {task.startedAt && <MetaRow label="شروع تایمر" value={formatDate(task.startedAt)} />}
            {task.doneTime && <MetaRow label="پایان تایمر" value={formatDate(task.doneTime)} />}
            {task.actualDurationMinutes != null && (
              <MetaRow label="مدت واقعی" value={`${task.actualDurationMinutes} دقیقه`} />
            )}
            {task.approvedDurationMinutes != null && (
              <MetaRow label="مدت تأییدشده" value={`${task.approvedDurationMinutes} دقیقه`} />
            )}
            {currentStatus === "done" && (
              <MetaRow label="تأیید زمان‌بندی" value={timingStatusLabel} />
            )}
          </div>
        </div>

        {((canEditTemplate || canDeleteTemplate) ||
          (canChangeStatus && currentStatus !== "done") || timingPending) && (
          <div className="border-t border-[--border] p-4 space-y-2">
            {timingPending && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">بررسی زمان انجام گزارش</p>
                <label className="mt-2 block text-[11px] text-amber-700 dark:text-amber-400">
                  مدت تأییدشده (دقیقه)
                  <input
                    className="mt-1 h-9 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-[--text] outline-none focus:border-amber-500 dark:border-amber-900 dark:bg-[--surface]"
                    min={1}
                    onChange={(event) => setApprovedDuration(event.target.value)}
                    type="number"
                    value={approvedDuration}
                  />
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="h-9 rounded-lg bg-emerald-600 text-xs font-bold text-white disabled:opacity-50"
                    disabled={reviewing || !Number(approvedDuration)}
                    onClick={async () => {
                      setReviewing(true);
                      await onReviewTiming(taskId, "approved", Number(approvedDuration));
                      setReviewing(false);
                    }}
                    type="button"
                  >تأیید زمان</button>
                  <button
                    className="h-9 rounded-lg border border-red-200 text-xs font-bold text-red-600 disabled:opacity-50 dark:border-red-900"
                    disabled={reviewing}
                    onClick={async () => {
                      setReviewing(true);
                      await onReviewTiming(taskId, "rejected");
                      setReviewing(false);
                    }}
                    type="button"
                  >رد زمان</button>
                </div>
              </div>
            )}
            {canChangeStatus && currentStatus !== "done" && (
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-semibold text-white transition hover:bg-[#196b7b] active:scale-[0.98]"
                onClick={() =>
                  onStatusChange(
                    taskId,
                    currentStatus === "todo" ? "in_progress" : "done",
                  )
                }
                type="button"
              >
                {currentStatus === "todo" ? "شروع کار" : "تکمیل کردن"}
                <ChevronLeft size={15} />
              </button>
            )}
            {canEditTemplate && (
              <>
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[--border] bg-[--surface-2] text-sm font-semibold text-[--text] transition hover:bg-[--surface]"
                  onClick={() => onEdit(task)}
                  type="button"
                >
                  <Repeat size={15} />
                  ویرایش الگو
                </button>
              </>
            )}
            {canDeleteTemplate && (
              <>
                <button
                  className="flex h-9 w-full items-center justify-center rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                  onClick={() => onDelete(taskId)}
                  type="button"
                >
                  حذف گزارش ثابت
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[--text-3]">{label}</span>
      <span className="text-right font-medium text-[--text]">
        {value || "—"}
      </span>
    </div>
  );
}
