"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Loader2,
  MessageSquareText,
  Repeat,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "motion/react";

import {
  getId,
  type FixedTask,
  type FixedTaskStatus,
  type User,
} from "@/lib/api";
import { Tooltip } from "./shared";
import {
  fixedTaskDurationOverdueMinutes,
  formatDurationMinutes,
} from "../_lib/fixed-task-timing";
import {
  avatarUrl,
  isFixedTaskOverdue,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

const FIXED_TASK_STATUSES: FixedTaskStatus[] = ["todo", "done"];
const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;
const durationOverdueTooltip =
  "زمان صرف‌شده از زمان تعیین‌شده توسط مدیر بیشتر شده است.";

function ratingLabel(score: number) {
  if (score <= 2) return "ضعیف";
  if (score <= 3) return "متوسط";
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
  users,
  inline = false,
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
  users: User[];
  inline?: boolean;
}) {
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const taskId = getId(task);
  const assignedUser = Array.isArray(task.assignedTo)
    ? task.assignedTo[0]
    : task.assignedTo;
  const assignee =
    users.find((user) => getId(user) === getId(assignedUser)) ?? assignedUser;
  const assigneeAvatarUrl = avatarUrl(assignee);
  const showAssigneeAvatar = Boolean(assigneeAvatarUrl) && !avatarFailed;
  const currentStatus = task.status ?? "todo";
  const statusChangeBlocked = isFixedTaskOverdue(task);
  const durationOverdueMinutes = fixedTaskDurationOverdueMinutes(task);
  const durationOverdue = durationOverdueMinutes != null;
  const hasManagerRating = task.ratingScore != null;
  const canSubmitRating = canRate && currentStatus === "done" && !hasManagerRating;
  const managerRatingLabel =
    task.ratingScore === 0
      ? ratingLabel(0)
      : ratingLabel(task.ratingScore ?? 0);

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

  const panel = (
    <motion.div
      animate={inline ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
      className={
        inline
          ? "flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-[--surface] shadow-2xl"
      }
      exit={
        inline
          ? { opacity: 0, y: -12, transition: { duration: 0.15 } }
          : { opacity: 0, x: "-100%" }
      }
      initial={inline ? { opacity: 0, y: 12 } : { opacity: 0, x: "-100%" }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
    >
        <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
          <h3 className="font-bold text-[--text]">جزئیات گزارش ثابت</h3>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[--text-3] transition-[background-color,color,transform] hover:bg-[--surface-2] hover:text-[--text] active:scale-[0.96]"
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
            ) : (
              <CircleDashed size={18} className="mt-0.5 shrink-0 text-[--text-3]" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-snug text-[--text]">
                {task.title}
              </h2>
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#e8f4f7] px-3 py-2.5 text-[#1f7a8c] shadow-[inset_0_0_0_1px_rgba(31,122,140,0.12)] dark:bg-[#0f3040] dark:text-cyan-300">
                <span
                  className="group/avatar relative shrink-0 outline-none"
                  tabIndex={showAssigneeAvatar ? 0 : undefined}
                >
                  <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-[#1f7a8c] text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                    <UserRound size={17} />
                    {showAssigneeAvatar && (
                      <img
                        alt={assignee ? userName(assignee) : ""}
                        className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                        onError={() => setAvatarFailed(true)}
                        src={assigneeAvatarUrl}
                      />
                    )}
                  </span>
                  {showAssigneeAvatar && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-12 z-30 h-44 w-44 -translate-y-1/2 overflow-hidden rounded-3xl bg-[--surface] p-2 opacity-0 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_14px_32px_rgba(15,23,42,0.2)] transition-[opacity,filter] duration-150 ease-in [filter:blur(4px)] group-hover/avatar:opacity-100 group-hover/avatar:duration-300 group-hover/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-hover/avatar:[filter:blur(0px)] group-focus-visible/avatar:opacity-100 group-focus-visible/avatar:duration-300 group-focus-visible/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-focus-visible/avatar:[filter:blur(0px)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_14px_32px_rgba(0,0,0,0.35)]"
                    >
                      <img
                        alt=""
                        className="h-full w-full rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                        onError={() => setAvatarFailed(true)}
                        src={assigneeAvatarUrl}
                      />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold opacity-75">مسئول گزارش</p>
                  <p className="truncate text-sm font-black">
                    {assignee ? userName(assignee) : "بدون مسئول"}
                  </p>
                </div>
              </div>
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
              className="rounded-xl bg-[--surface-2]/70 p-3 shadow-[inset_0_0_0_1px_var(--border)]"
              onSubmit={submitRating}
            >
              <div className="flex items-center gap-2 text-sm font-black text-[--text]">
                <Award size={16} className="text-amber-600" />
                امتیازدهی گزارش
              </div>
              <div className="mt-2 flex items-center gap-0.5">
                {RATING_OPTIONS.map((value) => {
                  const selected = ratingScore === value;
                  return (
                    <button
                      aria-pressed={selected}
                      aria-label={`${value} ستاره`}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-[background-color,color,transform] active:scale-[0.96] ${
                        selected
                          ? "bg-amber-500/10 text-amber-500"
                          : "text-amber-500/35 hover:bg-amber-500/10 hover:text-amber-500 dark:text-amber-400/35"
                      }`}
                      disabled={ratingSubmitting}
                      key={value}
                      onClick={() => {
                        setRatingScore(value);
                        setRatingError("");
                      }}
                      type="button"
                    >
                      <Star fill={selected ? "currentColor" : "none"} size={18} />
                    </button>
                  );
                })}
              </div>
              <label className="mt-2.5 block">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[--text-2]">
                  <MessageSquareText size={14} className="text-[#1f7a8c]" />
                  نظر مدیر (اختیاری)
                </span>
                <textarea
                  className="mt-1.5 min-h-16 w-full resize-y rounded-xl border border-[--border] bg-[--surface] px-3 py-2 text-sm leading-5 text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
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
                className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-black text-white shadow-sm transition-[background-color,transform] hover:bg-[#186777] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
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
            <MetaRow label="نوع گزارش" value={recurrenceLabel(task.recurrence)} />
            <MetaRow label="وضعیت" value={statusLabel(currentStatus)} />
            {task.approvedDurationMinutes != null && (
              <MetaRow
                label="زمان در دسترس"
                value={formatDurationMinutes(task.approvedDurationMinutes)}
              />
            )}
            {durationOverdue && (
              <MetaRow
                label="زمان صرف‌شده"
                tooltip={durationOverdueTooltip}
                value={formatDurationMinutes(durationOverdueMinutes)}
              />
            )}
            {task.actualDurationMinutes != null && (
              <MetaRow
                label="زمان ثبت‌شده"
                value={formatDurationMinutes(task.actualDurationMinutes)}
              />
            )}
          </div>
        </div>

        {((canEditTemplate || canDeleteTemplate) ||
          (canChangeStatus && currentStatus !== "done" && !statusChangeBlocked)) && (
          <div className="border-t border-[--border] p-4 space-y-2">
            {canChangeStatus && currentStatus !== "done" && !statusChangeBlocked && (
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-semibold text-white transition-[background-color,transform] hover:bg-[#196b7b] active:scale-[0.96]"
                onClick={() => onStatusChange(taskId, "done")}
                type="button"
              >
                تکمیل کردن
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
  );

  if (inline && typeof document !== "undefined") {
    const target = document.getElementById("fixed-task-inline-detail");
    return target ? createPortal(panel, target) : null;
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
      {panel}
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
