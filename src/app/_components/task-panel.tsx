"use client";

import { CheckCircle2, CircleDashed, Download, FileUp, UserPlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { getId, type Task, type User } from "@/lib/api";
import { COLUMNS } from "../_lib/task-constants";
import { formatDate, initials, statusLabel, userName } from "../_lib/task-helpers";

// ─── Task Detail Panel ────────────────────────────────────────────────────────
export function TaskPanel({
  task, users, canEditAssignments, canComment, canClaim, canDownloadCompletionFile, canUploadCompletionFile, onDownloadExcel, onDownloadCompletionFile, onUploadCompletionFile, onCommentChange, onDescriptionChange, onAssign, onUnassign, onClaim, onDelete, onClose,
}: {
  task: Task; users: User[];
  canEditAssignments: boolean;
  canComment: boolean;
  canClaim: boolean;
  canDownloadCompletionFile?: boolean;
  canUploadCompletionFile?: boolean;
  onDownloadExcel: () => void;
  onDownloadCompletionFile?: () => void;
  onUploadCompletionFile?: (file: File) => void;
  onCommentChange: (c: string) => void;
  onDescriptionChange?: (d: string) => void;
  onAssign: (userId: string) => void;
  onUnassign?: (userId: string) => void;
  onClaim: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [desc, setDesc] = useState(task.description ?? "");
  const [descEditing, setDescEditing] = useState(false);
  const [comment, setComment] = useState(task.taskComment ?? "");
  const [commentEditing, setCommentEditing] = useState(false);
  const [assignSelect, setAssignSelect] = useState("");
  const [completionFileName, setCompletionFileName] = useState("");
  const assignedIds = (task.assignedTo ?? []).map((u) => typeof u === "string" ? u : getId(u));
  const unassignedUsers = users.filter((u) => !assignedIds.includes(getId(u)));
  const isDone = task.status === "done";
  const canManageAssignments = canEditAssignments && !isDone;
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

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm dark:bg-black/50"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-[--surface] shadow-2xl">
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
              {task.status === "done"
                ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                : task.status === "in_progress"
                ? <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-[#1f7a8c] border-t-transparent animate-spin" />
                : <CircleDashed size={18} className="mt-0.5 shrink-0 text-[--text-3]" />
              }
              <h2 className="text-lg font-bold leading-snug text-[--text]">{task.title}</h2>
            </div>
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
                  const fullUser = users.find((usr) => getId(usr) === id) ?? (typeof u === "object" ? u : undefined);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-[--surface-2] px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white">
                          {initials(fullUser)}
                        </div>
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
      </div>
    </>
  );
}
