"use client";

import { Bell, X } from "lucide-react";
import type { Notification } from "@/lib/api";
import { getId } from "@/lib/api";

type RejectLeaveDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
  reason: string;
};

export function RejectLeaveDialog({ onCancel, onConfirm, onReasonChange, reason }: RejectLeaveDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-[--border] bg-[--surface] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2">
          <X size={18} className="text-red-500" />
          <h3 className="text-base font-bold text-[--text]">رد درخواست مرخصی</h3>
        </div>
        <p className="mt-1 text-xs text-[--text-3]">دلیل رد را وارد کنید.</p>
        <textarea
          autoFocus
          className="mt-3 h-24 w-full resize-none rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="مثلاً: ظرفیت مرخصی تکمیل است"
        />
        <div className="mt-4 flex gap-2">
          <button
            className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            disabled={!reason.trim()}
            onClick={onConfirm}
            type="button"
          >
            رد درخواست
          </button>
          <button className="h-10 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold" onClick={onCancel} type="button">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

type NotificationDialogProps = {
  notification: Notification;
  onClose: () => void;
  onRead: (id: string) => void;
};

export function NotificationDialog({ notification, onClose, onRead }: NotificationDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[--border] bg-[--surface] p-6 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
          <Bell size={26} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[--text]">{notification.title || "اعلان جدید"}</h3>
        {notification.message && <p className="mt-2 text-sm leading-relaxed text-[--text-2]">{notification.message}</p>}
        <div className="mt-5 flex gap-2">
          <button
            className="h-10 flex-1 rounded-lg bg-[#1f7a8c] text-sm font-semibold text-white transition hover:bg-[#196b7b]"
            onClick={() => onRead(getId(notification))}
            type="button"
          >
            باشه، دیدم
          </button>
        </div>
      </div>
    </div>
  );
}
