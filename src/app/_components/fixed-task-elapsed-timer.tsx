"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

function elapsedSeconds(startedAt?: string | null) {
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function FixedTaskElapsedTimer({
  className = "",
  startedAt,
}: {
  className?: string;
  startedAt?: string | null;
}) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(startedAt));

  useEffect(() => {
    if (!startedAt) return;

    const interval = window.setInterval(
      () => setSeconds(elapsedSeconds(startedAt)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-[#e8f4f7] px-2.5 py-2 text-xs text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5] ${className}`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <Clock3 size={13} />
        زمان سپری‌شده
      </span>
      <span className="font-mono text-sm font-extrabold" dir="ltr">
        {formatElapsed(seconds)}
      </span>
    </div>
  );
}
