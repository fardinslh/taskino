"use client";

import { useTaskinoPageContext } from "../../_components/taskino-context";

export default function SupervisorProjectsPage() {
  return <SupervisorWorkPageContent />;
}

function SupervisorWorkPageContent() {
  const {
    ClipboardList,
    RefreshCw,
    getId,
    statusLabel,
    userName,
    supervisorTasks,
    supervisorFixedTasks,
    activeView,
    isSupervisor,
    loadSupervisorData,
    setSelectedTask,
  } = useTaskinoPageContext();

  if (!isSupervisor || activeView !== "supervisor-projects") return null;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-[--surface] dark:border-violet-900">
        <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-l from-violet-50 to-white px-5 py-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="font-bold">گزارش‌های تحت نظر</h2>
              <p className="text-[11px] text-[--text-3]">
                {supervisorTasks.length} گزارش عادی · {supervisorFixedTasks.length} گزارش ثابت
              </p>
            </div>
          </div>
          <button
            className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
            onClick={() => void loadSupervisorData()}
            type="button"
          >
            <RefreshCw size={15} />
            بروزرسانی
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <WorkList
            emptyText="گزارش عادی تحت نظری یافت نشد"
            items={supervisorTasks}
            onSelect={setSelectedTask}
            statusLabel={statusLabel}
            title="گزارش‌های عادی"
            userName={userName}
            getId={getId}
          />
          <WorkList
            emptyText="گزارش ثابت تحت نظری یافت نشد"
            items={supervisorFixedTasks}
            statusLabel={statusLabel}
            title="گزارش‌های ثابت"
            userName={userName}
            getId={getId}
          />
        </div>
      </div>
    </section>
  );
}

function WorkList({
  emptyText,
  getId,
  items,
  onSelect,
  statusLabel,
  title,
  userName,
}: {
  emptyText: string;
  getId: (item: any) => string;
  items: any[];
  onSelect?: (item: any) => void;
  statusLabel: (status?: string) => string;
  title: string;
  userName: (user?: any) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[--border]">
      <div className="border-b border-[--border] bg-[--surface-2] px-4 py-3">
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-[--text-3]">{emptyText}</p>
      ) : (
        <div className="divide-y divide-[--border]">
          {items.map((item) => {
            const assignee = Array.isArray(item.assignedTo) ? item.assignedTo[0] : item.assignedTo;
            const content = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-[--text-3]">
                    {assignee ? `مسئول: ${userName(assignee)}` : "بدون مسئول"}
                    {item.recurrence ? ` · ${item.recurrence}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] font-bold text-[--text-2]">
                  {statusLabel(item.status)}
                </span>
              </>
            );

            return onSelect ? (
              <button
                key={getId(item)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-[--surface-2]"
                onClick={() => onSelect(item)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div key={getId(item)} className="flex items-center justify-between gap-3 px-4 py-3">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
