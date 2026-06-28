"use client";

import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  getId,
  managerApi,
  supervisorApi,
  taskApi,
  type ExtraTaskApprovalStatus,
  type Task,
} from "@/lib/api";
import {
  useFeedbackContext,
  useNavigationContext,
  useSessionContext,
} from "../../_components/taskino-context";
import { formatDate, statusLabel, userName } from "../../_lib/task-helpers";

const PAGE_SIZE = 10;

export default function ExtraProjectsPage() {
  const { activeView } = useNavigationContext();
  const { isManager, isSpecialist, isSupervisor, myId, token } =
    useSessionContext();
  const { setError, setMessage } = useFeedbackContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");

  const loadExtraTasks = useCallback(async () => {
    if (!token || !myId) return;

    setLoading(true);
    try {
      if (isSpecialist) {
        const response = await taskApi.extraByUser(token, myId, {
          page,
          limit: PAGE_SIZE,
        });
        setTasks(response.data ?? []);
        setTotal(response.total ?? 0);
      } else if (isSupervisor) {
        const response = await taskApi.extraByWorkField(token, {
          page,
          limit: PAGE_SIZE,
        });
        setTasks(response.data ?? []);
        setTotal(response.total ?? 0);
      } else if (isManager) {
        const response = await managerApi.extraTasks(token, {
          page,
          limit: PAGE_SIZE,
        });
        setTasks(response.data ?? []);
        setTotal(response.total ?? 0);
      }
    } catch (error) {
      setTasks([]);
      setTotal(0);
      setError(
        error instanceof Error
          ? error.message
          : "دریافت پروژه‌های مازاد ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  }, [
    isManager,
    isSpecialist,
    isSupervisor,
    myId,
    page,
    setError,
    token,
  ]);

  useEffect(() => {
    if (activeView !== "manager-extra-projects") return;
    queueMicrotask(() => void loadExtraTasks());
  }, [activeView, loadExtraTasks]);

  async function createExtraTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !title.trim()) return;

    setSaving(true);
    try {
      const selectedStartDate = startDate ? new Date(startDate) : null;
      const startTime = selectedStartDate
        ? `${String(selectedStartDate.getHours()).padStart(2, "0")}:${String(
            selectedStartDate.getMinutes(),
          ).padStart(2, "0")}`
        : undefined;
      const created = await taskApi.createExtra(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        ...(startDate
          ? {
              startDate,
              startTime,
            }
          : {}),
      });
      setTasks((current) =>
        page === 1 ? [created, ...current].slice(0, PAGE_SIZE) : current,
      );
      setTotal((current) => current + 1);
      setTitle("");
      setDescription("");
      setStartDate("");
      setShowForm(false);
      setPage(1);
      setMessage("پروژه مازاد با موفقیت ساخته شد.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ساخت پروژه مازاد ناموفق بود",
      );
    } finally {
      setSaving(false);
    }
  }

  async function advanceTask(task: Task) {
    if (!token) return;
    const nextStatus =
      task.status === "todo"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : null;
    if (!nextStatus) return;

    const id = getId(task);
    setUpdatingId(id);
    try {
      const updated = await taskApi.updateStatus(token, id, nextStatus);
      setTasks((current) =>
        current.map((item) => (getId(item) === id ? updated : item)),
      );
      setMessage(
        nextStatus === "done"
          ? "پروژه مازاد تکمیل شد."
          : "پروژه مازاد در حال انجام است.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تغییر وضعیت پروژه مازاد ناموفق بود",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function reviewExtraTask(
    task: Task,
    status: Exclude<ExtraTaskApprovalStatus, "pending">,
  ) {
    if (!token || !isSupervisor) return;

    const id = getId(task);
    setReviewingId(id);
    try {
      const updated = await supervisorApi.reviewExtraTask(token, id, status);
      setTasks((current) =>
        current.map((item) => (getId(item) === id ? updated : item)),
      );
      setMessage(
        status === "approved"
          ? "پروژه مازاد تایید شد."
          : "پروژه مازاد رد شد.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "بررسی پروژه مازاد ناموفق بود",
      );
    } finally {
      setReviewingId("");
    }
  }

  if (
    activeView !== "manager-extra-projects" ||
    (!isSpecialist && !isSupervisor && !isManager)
  ) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[--border] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <Layers3 size={19} />
            </div>
            <div>
              <h1 className="font-bold text-[--text]">پروژه‌های مازاد</h1>
              <p className="mt-0.5 text-xs text-[--text-3]">
                {isSpecialist
                  ? "پروژه‌های خود را ثبت کنید و وضعیت تایید آن‌ها را ببینید"
                  : isSupervisor
                    ? "پروژه‌های مازاد کارشناسان حوزه کاری خود را بررسی کنید"
                    : "همه پروژه‌های مازاد و وضعیت تایید آن‌ها"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[--border] bg-[--surface-2] text-[--text-2] transition-colors hover:bg-[--surface]"
              disabled={loading}
              onClick={() => void loadExtraTasks()}
              type="button"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            </button>
            {isSpecialist && (
              <button
                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition-transform active:scale-[0.96]"
                onClick={() => setShowForm((value) => !value)}
                type="button"
              >
                <Plus size={16} />
                پروژه جدید
              </button>
            )}
          </div>
        </div>

        {isSpecialist && showForm && (
          <form
            className="grid gap-3 border-b border-[--border] bg-[--surface-2]/60 p-4 md:grid-cols-2"
            onSubmit={createExtraTask}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                عنوان پروژه *
              </span>
              <input
                className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                onChange={(event) => setTitle(event.target.value)}
                required
                value={title}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                زمان شروع
              </span>
              <DatePicker
                calendar={jalali}
                calendarPosition="bottom-right"
                containerClassName="w-full"
                format="YYYY/MM/DD HH:mm"
                inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm tabular-nums text-[--text] outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                locale={persianFa}
                onChange={(value) => {
                  if (!value || Array.isArray(value)) {
                    setStartDate("");
                    return;
                  }
                  setStartDate(value.toDate().toISOString());
                }}
                placeholder="انتخاب تاریخ و ساعت شروع"
                plugins={[
                  <TimePicker
                    hideSeconds
                    key="extra-project-start-time"
                    position="bottom"
                  />,
                ]}
                value={startDate ? new Date(startDate) : ""}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
                توضیحات
              </span>
              <textarea
                className="min-h-24 w-full resize-y rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </label>
            <div className="flex justify-end gap-2 md:col-span-2">
              <button
                className="h-10 rounded-lg border border-[--border] px-4 text-sm font-semibold transition-colors hover:bg-[--surface]"
                onClick={() => setShowForm(false)}
                type="button"
              >
                انصراف
              </button>
              <button
                className="h-10 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-transform active:scale-[0.96] disabled:opacity-50"
                disabled={saving}
                type="submit"
              >
                {saving ? "در حال ساخت..." : "ثبت پروژه"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-violet-600">
            <LoaderCircle className="animate-spin" size={30} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Layers3 className="text-[--text-3]" size={36} />
            <p className="mt-3 font-semibold text-[--text]">
              پروژه مازادی ثبت نشده است
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {tasks.map((task) => {
              const assignee = task.assignedTo?.[0];
              const approvalStatus =
                task.extraTaskApprovalStatus ?? "pending";
              const nextLabel =
                task.status === "todo"
                  ? "شروع پروژه"
                  : task.status === "in_progress"
                    ? "تکمیل پروژه"
                    : null;

              return (
                <article
                  className="rounded-xl border border-[--border] bg-[--surface] p-4 shadow-sm"
                  key={getId(task)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-wrap-balance font-bold text-[--text]">
                        {task.title}
                      </h2>
                      {task.description && (
                        <p className="mt-1.5 text-wrap-pretty text-sm leading-6 text-[--text-3]">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          approvalStatus === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : approvalStatus === "rejected"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        {approvalStatus === "approved"
                          ? "تاییدشده"
                          : approvalStatus === "rejected"
                            ? "ردشده"
                            : "در انتظار تایید"}
                      </span>
                      <span className="rounded-full bg-[--surface-2] px-2.5 py-1 text-[10px] font-semibold text-[--text-2]">
                        {statusLabel(task.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[--text-3]">
                    <span className="flex items-center gap-1.5">
                      <UserRound size={14} />
                      {userName(assignee)}
                    </span>
                    {task.startDate && (
                      <span className="flex items-center gap-1.5">
                        <CalendarClock size={14} />
                        {formatDate(task.startDate)}
                        {task.startTime ? ` · ${task.startTime}` : ""}
                      </span>
                    )}
                    {task.status === "done" && task.doneTime && (
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={14} />
                        تکمیل: {formatDate(task.doneTime)}
                        {task.endTime ? ` · ${task.endTime}` : ""}
                      </span>
                    )}
                  </div>

                  {isSupervisor && approvalStatus === "pending" && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="h-10 rounded-lg border border-red-200 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
                        disabled={reviewingId === getId(task)}
                        onClick={() => void reviewExtraTask(task, "rejected")}
                        type="button"
                      >
                        رد
                      </button>
                      <button
                        className="h-10 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        disabled={reviewingId === getId(task)}
                        onClick={() => void reviewExtraTask(task, "approved")}
                        type="button"
                      >
                        تایید
                      </button>
                    </div>
                  )}

                  {isSpecialist &&
                    approvalStatus === "approved" &&
                    nextLabel && (
                    <button
                      className="mt-4 h-10 w-full rounded-lg bg-violet-600 text-sm font-semibold text-white transition-transform active:scale-[0.96] disabled:opacity-50"
                      disabled={updatingId === getId(task)}
                      onClick={() => void advanceTask(task)}
                      type="button"
                    >
                      {updatingId === getId(task)
                        ? "در حال بروزرسانی..."
                        : nextLabel}
                    </button>
                  )}
                  {isSpecialist && approvalStatus !== "approved" && (
                    <p
                      className={`mt-4 rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                        approvalStatus === "rejected"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {approvalStatus === "rejected"
                        ? "این پروژه توسط سرپرست رد شده است."
                        : "پس از تایید سرپرست امکان شروع پروژه فعال می‌شود."}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[--border] px-5 py-3">
            <p className="text-xs tabular-nums text-[--text-3]">
              صفحه {page} از {totalPages} · {total} پروژه
            </p>
            <div className="flex gap-2">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] transition-colors hover:bg-[--surface-2] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[--border] transition-colors hover:bg-[--surface-2] disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
