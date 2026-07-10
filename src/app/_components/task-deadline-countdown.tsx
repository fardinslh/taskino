"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

import { Tooltip } from "./shared";

type TaskDeadlineCountdownProps = {
  dueDate?: string;
  status?: string;
  className?: string;
};

type RemainingTime = {
  isOverdue: boolean;
  label: string;
  tone: string;
  bg: string;
};

function getRemainingTime(
  dueDate?: string,
  currentTime = Date.now(),
): RemainingTime | null {
  if (!dueDate) return null;

  const deadline = new Date(dueDate);
  if (Number.isNaN(deadline.getTime())) return null;

  const diff = deadline.getTime() - currentTime;
  const absolute = Math.abs(diff);
  const totalMinutes = Math.floor(absolute / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days > 0 ? `${days} روز` : null,
    hours > 0 || days > 0 ? `${hours} ساعت` : null,
    `${minutes} دقیقه`,
  ].filter(Boolean);

  return {
    isOverdue: diff < 0,
    label: parts.join(" و "),
    tone:
      diff < 0
        ? "text-red-700 dark:text-red-300"
        : diff <= 24 * 60 * 60 * 1000
          ? "text-amber-700 dark:text-amber-300"
          : "text-[#1f7a8c] dark:text-[#7dd3e3]",
    bg:
      diff < 0
        ? "bg-red-50 dark:bg-red-950/30"
        : diff <= 24 * 60 * 60 * 1000
          ? "bg-amber-50 dark:bg-amber-950/30"
          : "bg-[#e8f4f7] dark:bg-[#0f3040]",
  };
}

export function TaskDeadlineCountdown({
  dueDate,
  status,
  className = "",
}: TaskDeadlineCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = getRemainingTime(dueDate, now);
  const shouldShow = status === "in_progress" || status === "todo";

  useEffect(() => {
    if (!dueDate || !shouldShow) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [dueDate, shouldShow]);

  if (!shouldShow || !remaining) return null;

  const tooltip = remaining.isOverdue
    ? "زمان گذشته از ددلاین تعیین‌شده برای این گزارش."
    : "زمان باقی‌مانده تا ددلاین تعیین‌شده برای این گزارش.";

  return (
    <Tooltip className={className} content={tooltip}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${remaining.bg} ${remaining.tone}`}
      >
        <Clock3 size={11} />
        <span>{remaining.isOverdue ? "گذشته از ددلاین:" : "ددلاین:"}</span>
        <span>{remaining.label}</span>
      </span>
    </Tooltip>
  );
}
