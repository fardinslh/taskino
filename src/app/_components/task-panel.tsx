"use client";

/* eslint-disable @next/next/no-img-element -- User avatars may come from arbitrary backend hosts. */

import { Award, CheckCircle2, CircleDashed, Download, FileUp, Loader2, MessageSquareText, Star, UserPlus, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { getId, type Task, type User } from "@/lib/api";
import { COLUMNS } from "../_lib/task-constants";
import { avatarUrl, formatDate, initials, statusLabel, userName } from "../_lib/task-helpers";

function AssigneeAvatar({ user }: { user?: User | string }) {
  const [failed, setFailed] = useState(false);
  const url = avatarUrl(user);
  if (url && !failed) {
    return (
      <span className="group/avatar relative shrink-0 outline-none" tabIndex={0}>
        <img
          alt={userName(user)}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
          src={url}
          onError={() => setFailed(true)}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-10 z-30 h-44 w-44 -translate-y-1/2 overflow-hidden rounded-3xl bg-[--surface] p-2 opacity-0 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_14px_32px_rgba(15,23,42,0.2)] transition-[opacity,filter] duration-150 ease-in [filter:blur(4px)] group-hover/avatar:opacity-100 group-hover/avatar:duration-300 group-hover/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-hover/avatar:[filter:blur(0px)] group-focus-visible/avatar:opacity-100 group-focus-visible/avatar:duration-300 group-focus-visible/avatar:ease-[cubic-bezier(0.2,0,0,1)] group-focus-visible/avatar:[filter:blur(0px)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_14px_32px_rgba(0,0,0,0.35)]"
        >
          <img
            alt=""
            className="h-full w-full rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            onError={() => setFailed(true)}
            src={url}
          />
        </span>
      </span>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white">
      {initials(user)}
    </div>
  );
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────
const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

function ratingLabel(score: number) {
  if (score <= 2) return "ضعیف";
  if (score <= 3) return "متوسط";
  return "خوب";
}

export function TaskPanel({
  task, users, canEditAssignments, canComment, canClaim, canRate, canDownloadCompletionFile, canUploadCompletionFile, onDownloadExcel, onDownloadCompletionFile, onUploadCompletionFile, onCommentChange, onDescriptionChange, onRate, onAssign, onUnassign, onClaim, onDelete, onClose, inline, currentUser,
}: {
  task: Task; users: User[];
  canEditAssignments: boolean;
  canComment: boolean;
  canClaim: boolean;
  canRate?: boolean;
  canDownloadCompletionFile?: boolean;
  canUploadCompletionFile?: boolean;
  onDownloadExcel: () => void;
  onDownloadCompletionFile?: () => void;
  onUploadCompletionFile?: (file: File) => void;
  onCommentChange: (c: string) => void;
  onDescriptionChange?: (d: string) => void;
  onRate?: (taskId: string, score: number, ratingComment?: string) => Promise<void>;
  onAssign: (userId: string) => void;
  onUnassign?: (userId: string) => void;
  onClaim: () => void;
  onDelete: () => void;
  onClose: () => void;
  inline?: boolean;
  currentUser?: User | null;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [desc, setDesc] = useState(task.description ?? "");
  const [descEditing, setDescEditing] = useState(false);
  const [comment, setComment] = useState(task.taskComment ?? "");
  const [commentEditing, setCommentEditing] = useState(false);
  const [assignSelect, setAssignSelect] = useState("");
  const [completionFileName, setCompletionFileName] = useState("");
  const [rtScore, setRtScore] = useState<number | null>(null);
  const [rtComment, setRtComment] = useState("");
  const [rtSubmitting, setRtSubmitting] = useState(false);
  const [rtError, setRtError] = useState("");
  const assignedIds = (task.assignedTo ?? []).map((u) => typeof u === "string" ? u : getId(u));
  const unassignedUsers = users.filter((u) => !assignedIds.includes(getId(u)));
  const isDone = task.status === "done";
  const canManageAssignments = canEditAssignments && !isDone;
  const taskId = getId(task);
  const hasManagerRating = task.ratingScore != null;
  const canSubmitRating = !!canRate && isDone && !hasManagerRating;
  const managerRatingLabel = ratingLabel(task.ratingScore ?? 0);

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = rtComment.trim();
    if (rtScore == null) {
      setRtError("انتخاب امتیاز الزامی است.");
      return;
    }
    setRtSubmitting(true);
    setRtError("");
    try {
      await onRate?.(taskId, rtScore, comment);
      setRtScore(null);
      setRtComment("");
    } catch (error) {
      setRtError(
        error instanceof Error ? error.message : "ثبت امتیاز گزارش ناموفق بود.",
      );
    } finally {
      setRtSubmitting(false);
    }
  }
  const showCompletionUpload = canUploadCompletionFile && task.status === "done";
  const completionExcelFile = task.completionExcelFile ?? task.completionFile;
  const hasCompletionFile = !!(
    typeof completionExcelFile === "string"
      ? completionExcelFile
      : completionExcelFile
        ? getId(completionExcelFile)
        : ""
  );
  const showCompletionDownload = canDownloadCompletionFile && hasCompletionFile;
  const showCompletionAttachment =
    showCompletionUpload || showCompletionDownload;

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
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
          <h3 className="font-bold text-[--text]">جزئیات گزارش</h3>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2] hover:text-[--text]" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <div className="flex items-start gap-2">
              {task.status === "done" ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <CircleDashed size={18} className="mt-0.5 shrink-0 text-[--text-3]" />
              )}
              <h2 className="text-lg font-bold leading-snug text-[--text]">{task.title}</h2>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <p className="mb-2 text-xs font-semibold text-[--text-3]">مسئول پروژه</p>
            {canClaim && !isDone && (
              <button
                className="mb-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1f7a8c] text-xs font-semibold text-white transition hover:bg-[#196b7b]"
                onClick={onClaim}
                type="button"
              >
                <UserPlus size={13} /> برداشتن این پروژه برای من
              </button>
            )}
            {task.assignedTo && task.assignedTo.length > 0 ? (
              <div className="space-y-2">
                {task.assignedTo.map((u, i) => {
                  const id = typeof u === "string" ? u : getId(u);
                  const fullUser =
                    currentUser && (currentUser._id === id || getId(currentUser) === id)
                      ? currentUser
                      : users.find((usr) => getId(usr) === id) ??
                        (typeof u === "object" ? u : undefined);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-[--surface-2] px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <AssigneeAvatar user={fullUser} />
                        <div>
                          <p className="text-sm font-semibold">{userName(fullUser)}</p>
                          <p className="text-xs text-[--text-3]">{fullUser?.roles || "specialist"}</p>
                        </div>
                      </div>
                      {canManageAssignments && onUnassign && (
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[--text-3] transition hover:bg-red-50 hover:text-red-500"
                          onClick={() => onUnassign(id)}
                          type="button"
                          title="حذف مسئول"
                        ><X size={12} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[--border] p-3 text-center text-xs text-[--text-3]">بدون مسئول</div>
            )}
            {canManageAssignments && unassignedUsers.length > 0 && (
              <div className="mt-2 flex gap-2">
                <select
                  className="h-9 flex-1 rounded-lg border border-[--border] bg-[--surface] px-2 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  value={assignSelect}
                  onChange={(e) => setAssignSelect(e.target.value)}
                >
                  <option value="">اساین به…</option>
                  {unassignedUsers.map((u) => <option key={getId(u)} value={getId(u)}>{userName(u)}</option>)}
                </select>
                <button
                  className="flex h-9 items-center gap-1 rounded-lg bg-[#1f7a8c] px-3 text-xs font-semibold text-white transition hover:bg-[#196b7b] disabled:opacity-40"
                  disabled={!assignSelect}
                  onClick={() => { if (assignSelect) { onAssign(assignSelect); setAssignSelect(""); } }}
                  type="button"
                ><UserPlus size={13} />اساین</button>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="mb-2 text-xs font-semibold text-[--text-3]">وضعیت</p>
            <div className="flex gap-2 flex-wrap">
              {COLUMNS.map((col) => (
                <button
                  key={col.status}
                  disabled
                  className={`flex cursor-default items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${task.status === col.status ? `${col.badge} border-transparent` : "border-[--border] text-[--text-2] opacity-60"}`}
                  type="button"
                >
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {col.title}
                </button>
              ))}
            </div>
          </div>

          {/* Excel attachment */}
          {task.excelFile && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[--text-3]">فایل اکسل</p>
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                onClick={onDownloadExcel} type="button"
              >
                <Download size={15} /> دانلود فایل اکسل
              </button>
            </div>
          )}

          {/* Completion attachment */}
          {showCompletionAttachment && (
            <div>
              <p className="mb-2 text-xs font-semibold text-[--text-3]">فایل تکمیل پروژه</p>
              {showCompletionDownload && (
                <button
                  className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.96] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                  onClick={onDownloadCompletionFile}
                  type="button"
                >
                  <Download size={15} /> دانلود فایل تکمیل
                </button>
              )}
              {showCompletionUpload && (
                <label className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#1f7a8c]/35 bg-[#1f7a8c]/5 px-3 py-2 text-sm font-semibold text-[#1f7a8c] transition hover:bg-[#1f7a8c]/10 active:scale-[0.96]">
                  <FileUp size={15} />
                  <span className="line-clamp-1">
                    {completionFileName || "آپلود فایل تکمیل"}
                  </span>
                  <input
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!/\.(xlsx|xls)$/i.test(file.name)) {
                        onUploadCompletionFile?.(file);
                        event.target.value = "";
                        return;
                      }
                      setCompletionFileName(file.name);
                      onUploadCompletionFile?.(file);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
              )}
              {completionExcelFile && !completionFileName && (
                <p className="mt-1.5 text-[11px] text-[--text-3]">
                  فایل تکمیل قبلا ثبت شده است.
                </p>
              )}
            </div>
          )}

          {/* Comment */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[--text-3]">کامنت مدیر</p>
              {canComment && !commentEditing && (
                <button className="text-xs font-semibold text-[#1f7a8c] hover:underline" onClick={() => setCommentEditing(true)} type="button">
                  {comment.trim() ? "ویرایش" : "افزودن"}
                </button>
              )}
            </div>
            {commentEditing ? (
              <div className="space-y-2">
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-[--border] bg-[--surface] px-3 py-2.5 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  value={comment} onChange={(e) => setComment(e.target.value)} placeholder="کامنت خود را بنویسید…"
                />
                <div className="flex gap-2">
                  <button className="h-9 rounded-lg bg-[#1f7a8c] px-4 text-xs font-semibold text-white" onClick={() => { onCommentChange(comment.trim()); setCommentEditing(false); }} type="button">ذخیره</button>
                  <button className="h-9 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-xs font-semibold" onClick={() => { setComment(task.taskComment ?? ""); setCommentEditing(false); }} type="button">انصراف</button>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-[--surface-2] px-3 py-2.5 text-sm leading-relaxed text-[--text] whitespace-pre-wrap">
                {comment.trim() || <span className="text-[--text-3]">کامنتی ثبت نشده</span>}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-[--text-3]">توضیحات</p>
              {onDescriptionChange && !descEditing && (
                <button className="text-xs font-semibold text-[#1f7a8c] hover:underline" onClick={() => setDescEditing(true)} type="button">
                  {desc ? "ویرایش" : "افزودن"}
                </button>
              )}
            </div>
            {descEditing ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  className="h-24 w-full resize-none rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="توضیحات گزارش را وارد کنید…"
                />
                <div className="flex gap-2">
                  <button
                    className="flex h-8 flex-1 items-center justify-center rounded-lg bg-[#1f7a8c] text-xs font-semibold text-white transition hover:bg-[#196b7b]"
                    onClick={() => { onDescriptionChange?.(desc); setDescEditing(false); }}
                    type="button"
                  >ذخیره</button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--border] text-[--text-2] transition hover:bg-[--surface-2]"
                    onClick={() => { setDesc(task.description ?? ""); setDescEditing(false); }}
                    type="button"
                  ><X size={13} /></button>
                </div>
              </div>
            ) : desc ? (
              <p className="rounded-xl bg-[--surface-2] px-3 py-2.5 text-sm text-[--text] leading-relaxed">{desc}</p>
            ) : onDescriptionChange ? (
              <button
                className="w-full rounded-xl border border-dashed border-[--border] p-3 text-center text-xs text-[--text-3] transition hover:border-[#1f7a8c]/40 hover:text-[#1f7a8c]"
                onClick={() => setDescEditing(true)}
                type="button"
              >+ افزودن توضیحات</button>
            ) : (
              <p className="rounded-xl bg-[--surface-2] px-3 py-2.5 text-sm text-[--text-3]">بدون توضیحات</p>
            )}
          </div>

          {/* Manager Rating Display */}
          {hasManagerRating && (
            <div className="rounded-xl bg-amber-50 p-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)] dark:bg-amber-950/25 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Award size={14} />
                  امتیاز مدیر
                </span>
                <strong className="text-sm font-black tabular-nums text-amber-700 dark:text-amber-300">
                  {task.ratingScore?.toLocaleString("fa-IR")} از ۵
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-800/80 dark:text-amber-400/80">
                <span>ارزیابی کیفیت:</span>
                <span className="font-bold">{managerRatingLabel}</span>
              </div>
              {task.ratingComment?.trim() && (
                <p className="mt-2 border-t border-amber-500/10 pt-1.5 text-pretty text-xs leading-5 text-amber-900/75 dark:text-amber-100/75">
                  {task.ratingComment}
                </p>
              )}
            </div>
          )}

          {/* Rating Form */}
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
                  const selected = rtScore === value;
                  const isFilled = rtScore !== null && value <= rtScore;
                  return (
                    <button
                      aria-pressed={selected}
                      aria-label={`${value} ستاره`}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-[background-color,color,transform] active:scale-[0.96] ${
                        selected
                          ? "bg-amber-500/10 text-amber-500"
                          : isFilled
                            ? "text-amber-500 hover:bg-amber-500/10"
                            : "text-amber-500/35 hover:bg-amber-500/10 hover:text-amber-500 dark:text-amber-400/35"
                      }`}
                      disabled={rtSubmitting}
                      key={value}
                      onClick={() => {
                        setRtScore(value);
                        setRtError("");
                      }}
                      type="button"
                    >
                      <Star fill={isFilled ? "currentColor" : "none"} size={18} />
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
                  disabled={rtSubmitting}
                  maxLength={1000}
                  onChange={(event) => {
                    setRtComment(event.target.value);
                    setRtError("");
                  }}
                  placeholder="نظر خود درباره کیفیت انجام این گزارش را بنویسید..."
                  value={rtComment}
                />
              </label>
              {rtError && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {rtError}
                </p>
              )}
              <button
                className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-black text-white shadow-sm transition-[background-color,transform] hover:bg-[#186777] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={rtSubmitting || rtScore == null}
                type="submit"
              >
                {rtSubmitting && <Loader2 className="animate-spin" size={16} />}
                ثبت امتیاز
              </button>
            </form>
          )}

          {/* Meta */}
          <div className="rounded-xl bg-[--surface-2] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[--text-3]">تاریخ ایجاد</span>
              <span className="font-medium text-[--text]">{formatDate(task.createdAt)}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[--text-3]">مهلت</span>
                <span className="font-medium text-[--text]">{formatDate(task.dueDate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[--text-3]">وضعیت</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${COLUMNS.find((c) => c.status === task.status)?.badge ?? ""}`}>
                {statusLabel(task.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Panel footer */}
        {canEditAssignments ? (
          <div className="border-t border-[--border] p-4 space-y-2">
            {isDone && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />تکمیل شده
              </div>
            )}
            <button
              className="flex h-9 w-full items-center justify-center rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              onClick={onDelete} type="button"
            >
              حذف گزارش
            </button>
          </div>
        ) : task.status === "done" ? (
          <div className="border-t border-[--border] p-4">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />تکمیل شده
            </div>
          </div>
        ) : null}
      </motion.div>
  );

  if (inline && typeof document !== "undefined") {
    const target = document.getElementById("task-inline-detail");
    return target ? createPortal(panel, target) : null;
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        animate={{ opacity: 1 }}
        ref={overlayRef}
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
