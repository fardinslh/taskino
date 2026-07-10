"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Loader2,
  MessageSquareText,
  Repeat,
  X,
} from "lucide-react";
import { motion } from "motion/react";

import { getId, type FixedTask, type FixedTaskStatus } from "@/lib/api";
import { Tooltip } from "./shared";
import {
  fixedTaskDurationOverdueMinutes,
  formatDurationMinutes,
} from "../_lib/fixed-task-timing";
import {
  formatDate,
  isFixedTaskOverdue,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

const FIXED_TASK_STATUSES: FixedTaskStatus[] = ["todo", "in_progress", "done"];
const RATING_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const durationOverdueTooltip =
  "زمان صرف‌شده از زمان تعیین‌شده توسط مدیر بیشتر شده است.";

function ratingLabel(score: number) {
  if (score <= 3) return "ضعیف";
  if (score <= 6) return "متوسط";
  return "خوب";
}

export function SelectedFixedTaskPanel({
  canChangeStatus,
  canRate,
  canEditTemplate,
  canDeleteTemplate,
  onClose,
  onDelete,
  onEdit,
  onRate,
  onStatusChange,
  task,
}: {
  canChangeStatus: boolean;
  canRate: boolean;
  canEditTemplate: boolean;
  canDeleteTemplate: boolean;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: FixedTask) => void;
  onRate: (taskId: string, score: number, ratingComment?: string) => Promise<void>;
  onStatusChange: (taskId: string, status: FixedTaskStatus) => void;
  task: FixedTask;
}) {
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const taskId = getId(task);
  const assignee = Array.isArray(task.assignedTo)
    ? task.assignedTo[0]
    : task.assignedTo;
  const currentStatus = task.status ?? "todo";
  const statusChangeBlocked = isFixedTaskOverdue(task);
  const durationOverdueMinutes = fixedTaskDurationOverdueMinutes(
    task,
    timerNow,
  );
  const durationOverdue = durationOverdueMinutes != null;
  const hasManagerRating = task.ratingScore != null;
  const canSubmitRating = canRate && currentStatus === "done" && !hasManagerRating;
  const managerRatingLabel =
    task.ratingScore === 0
      ? ratingLabel(0)
      : ratingLabel(task.ratingScore ?? 0);

  useEffect(() => {
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = ratingComment.trim();
    if (ratingScore == null) {
      setRatingError("انتخاب امتیاز الزامی است.");
      return;
    }

    setRatingSubmitting(true);
    setRatingError("");
    try {
      await onRate(taskId, ratingScore, comment);
      setRatingScore(null);
      setRatingComment("");
    } catch (error) {
      setRatingError(
        error instanceof Error
          ? error.message
          : "ثبت امتیاز گزارش ناموفق بود.",
      );
    } finally {
      setRatingSubmitting(false);
    }
  }

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm dark:bg-black/50"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-[--surface] shadow-2xl"
        exit={{ opacity: 0, x: "-100%" }}
        initial={{ opacity: 0, x: "-100%" }}
        transition={{ type: "spring", duration: 0.36, bounce: 0 }}
      >
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

          {task.taskComment && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[--text-3]">نظر مدیر</p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                {task.taskComment}
              </p>
            </div>
          )}

          {hasManagerRating && (
            <div className="rounded-xl bg-amber-50 p-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)] dark:bg-amber-950/25">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Award size={14} />
                  امتیاز مدیر
                </span>
                <strong className="text-sm font-black tabular-nums text-amber-700 dark:text-amber-300">
                  {task.ratingScore?.toLocaleString("fa-IR")} ·{" "}
                  {managerRatingLabel}
                </strong>
              </div>
              {task.ratingComment?.trim() && (
                <p className="mt-2 text-pretty text-xs leading-5 text-amber-900/75 dark:text-amber-100/75">
                  {task.ratingComment}
                </p>
              )}
            </div>
          )}

          {canSubmitRating && (
            <form
              className="rounded-xl bg-[--surface-2] p-3 shadow-[inset_0_0_0_1px_var(--border)]"
              onSubmit={submitRating}
            >
              <div className="flex items-center gap-2 text-sm font-black text-[--text]">
                <Award size={16} className="text-amber-600" />
                امتیازدهی گزارش
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {RATING_OPTIONS.map((value) => {
                  const selected = ratingScore === value;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`min-h-14 rounded-xl px-2 py-2 text-center transition-[background-color,box-shadow,transform] active:scale-[0.96] ${
                        selected
                          ? "bg-[#1f7a8c] text-white shadow-lg shadow-[#1f7a8c]/20"
                          : "bg-[--surface] text-[--text-2] shadow-[inset_0_0_0_1px_var(--border)] hover:bg-[--border]"
                      }`}
                      disabled={ratingSubmitting}
                      key={value}
                      onClick={() => {
                        setRatingScore(value);
                        setRatingError("");
                      }}
                      type="button"
                    >
                      <span className="block text-base font-black tabular-nums">
                        {value.toLocaleString("fa-IR")}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-bold opacity-80">
                        {ratingLabel(value)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 block">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[--text-2]">
                  <MessageSquareText size={14} className="text-[#1f7a8c]" />
                  نظر مدیر
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[--border] bg-[--surface] px-3 py-2.5 text-sm leading-6 text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  disabled={ratingSubmitting}
                  maxLength={1000}
                  onChange={(event) => {
                    setRatingComment(event.target.value);
                    setRatingError("");
                  }}
                  placeholder="نظر خود درباره کیفیت انجام این گزارش را بنویسید..."
                  value={ratingComment}
                />
              </label>
              {ratingError && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {ratingError}
                </p>
              )}
              <button
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-black text-white shadow-lg shadow-[#1f7a8c]/15 transition-[background-color,transform] hover:bg-[#186777] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={ratingSubmitting || ratingScore == null}
                type="submit"
              >
                {ratingSubmitting && <Loader2 className="animate-spin" size={16} />}
                ثبت امتیاز
              </button>
            </form>
          )}

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
                  } ${!canChangeStatus || statusChangeBlocked ? "cursor-default opacity-60" : ""}`}
                  disabled={!canChangeStatus || statusChangeBlocked}
                  onClick={() =>
                    canChangeStatus &&
                    !statusChangeBlocked &&
                    onStatusChange(taskId, status)
                  }
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
            <MetaRow label="ایجاد" value={formatDate(task.createdAt)} />
            {task.startedAt && <MetaRow label="شروع تایمر" value={formatDate(task.startedAt)} />}
            {task.doneTime && <MetaRow label="پایان تایمر" value={formatDate(task.doneTime)} />}
            {durationOverdue && (
              <MetaRow
                label="زمان صرف‌شده"
                tooltip={durationOverdueTooltip}
                value={formatDurationMinutes(durationOverdueMinutes)}
              />
            )}
            {task.actualDurationMinutes != null && (
              <MetaRow label="مدت واقعی" value={formatDurationMinutes(task.actualDurationMinutes)} />
            )}
          </div>
        </div>

        {((canEditTemplate || canDeleteTemplate) ||
          (canChangeStatus && currentStatus !== "done" && !statusChangeBlocked)) && (
          <div className="border-t border-[--border] p-4 space-y-2">
            {canChangeStatus && currentStatus !== "done" && !statusChangeBlocked && (
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
      </motion.div>
    </>
  );
}

function MetaRow({
  label,
  tooltip,
  value,
}: {
  label: string;
  tooltip?: string;
  value?: string;
}) {
  if (tooltip) {
    return (
      <Tooltip className="w-full" content={tooltip}>
        <span className="flex w-full items-center justify-between gap-3 text-xs">
          <span className="text-[--text-3]">{label}</span>
          <span className="text-right font-medium text-[--text]">
            {value || "â€”"}
          </span>
        </span>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[--text-3]">{label}</span>
      <span className="text-right font-medium text-[--text]">
        {value || "—"}
      </span>
    </div>
  );
}
