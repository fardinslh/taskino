"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import {
  CalendarDays,
  CircleDashed,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";

import { getId, type Task } from "@/lib/api";
import { COLUMNS } from "../_lib/task-constants";
import { isTaskVisibleOnDate } from "../_lib/task-date-filter";
import {
  formatDate,
  isTaskOverdue,
  statusLabel,
  userName,
} from "../_lib/task-helpers";
import { LandingPageEntrance } from "./landing-page-entrance";
import { AssigneeStack } from "./shared";
import { TaskDeadlineCountdown } from "./task-deadline-countdown";
import { useNavigationContext } from "./taskino-context";

type ProjectBoardSectionProps = {
  progress: number;
  tasks: Task[];
  taskQuery: string;
  totalCount: number;
  openCount: number;
  doneCount: number;
  onClaimTask?: (taskId: string) => void | Promise<void>;
  onMoveTask: (taskId: string, status: string) => void | Promise<void>;
  onSearchChange: (value: string) => void;
  onSelectTask: (task: Task) => void;
};

function DraggablePortal({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  if (enabled && typeof document !== "undefined") {
    return createPortal(children, document.body);
  }

  return children;
}

export function ProjectBoardSection({
  progress,
  tasks,
  taskQuery,
  totalCount,
  openCount,
  doneCount,
  onClaimTask,
  onMoveTask,
  onSearchChange,
  onSelectTask,
}: ProjectBoardSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { selectedTask } = useNavigationContext();

  const filteredTasks = tasks.filter((task) => {
    if (selectedDate && !isTaskVisibleOnDate(task, selectedDate)) return false;

    const query = taskQuery.trim().toLowerCase();
    if (!query) return true;

    const haystack = [
      task.title,
      task.description,
      statusLabel(task.status),
      ...(task.assignedTo ?? []).map(userName),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return (
    <LandingPageEntrance className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "پروژه‌ها",
            value: totalCount,
            sub: "واگذارشده",
            icon: FolderKanban,
            accent:
              "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900",
          },
          {
            label: "پروژه‌های باز",
            value: openCount,
            sub: "در انتظار تکمیل",
            icon: ClipboardList,
            accent:
              "bg-[#e8f4f7] text-[#1f7a8c] ring-[#1f7a8c]/10 dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:ring-[#1f7a8c]/20",
          },
          {
            label: "تکمیل شده",
            value: doneCount,
            sub: `${progress}% پیشرفت`,
            icon: TrendingUp,
            accent:
              "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[--border] bg-[--surface] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-[--text-2]">
                {item.label}
              </p>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-4 ${item.accent}`}
              >
                <item.icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[--text]">
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] text-[--text-3]">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#b8dfe8] bg-[--surface] shadow-md shadow-[#1f7a8c]/8 dark:border-[#1f5060]">
        <div className="flex flex-col gap-3 border-b border-[#cce8ef] bg-gradient-to-l from-[#e0f4f8] to-[#f0fafb] px-5 py-4 dark:border-[#1f5060] dark:from-[#0f2535] dark:to-[#0f172a] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <FolderKanban size={17} />
            </div>
            <div>
              <h2 className="font-bold">برد پروژه‌ها</h2>
              <p className="text-[11px] text-[--text-3]">
                {selectedDate
                  ? `${filteredTasks.length} پروژه در تاریخ انتخاب‌شده`
                  : `${filteredTasks.length} پروژه`}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:mr-auto sm:w-auto sm:flex-row">
            <div className="relative sm:w-44">
              <CalendarDays
                className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[--text-3]"
                size={15}
              />
              <DatePicker
                portal
                calendar={jalali}
                calendarPosition="bottom-right"
                containerClassName="w-full"
                format="YYYY/MM/DD"
                inputClass="h-10 w-full rounded-xl border border-[--border] bg-[--surface] pr-9 pl-3 text-xs font-semibold text-[--text] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                locale={persianFa}
                onChange={(value) => {
                  if (!value || Array.isArray(value)) {
                    setSelectedDate(null);
                    return;
                  }
                  setSelectedDate(value.toDate());
                }}
                placeholder="فیلتر تاریخ"
                value={selectedDate ?? ""}
                zIndex={10000}
              />
              {selectedDate && (
                <button
                  aria-label="حذف فیلتر تاریخ"
                  className="absolute left-2 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[--text-3] transition-[background-color,color,transform] hover:bg-[--surface-2] hover:text-[--text] active:scale-[0.96]"
                  onClick={() => setSelectedDate(null)}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <input
              className="h-10 w-full rounded-xl border border-[--border] bg-[--surface] px-3 text-xs text-[--text] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15 sm:w-52"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="جستجوی پروژه..."
              value={taskQuery}
            />
          </div>
        </div>

        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) return;
            if (result.source.droppableId === result.destination.droppableId) {
              return;
            }
            void onMoveTask(result.draggableId, result.destination.droppableId);
          }}
        >
          <div className="grid gap-4 bg-[--surface-2]/40 p-3 sm:p-4 lg:grid-cols-3">
            {COLUMNS.map((column: any) => {
              const columnTasks = filteredTasks.filter(
                (task) => (task.status ?? "todo") === column.status,
              );

              return (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border ${column.border} ${column.colBg}`}
                  key={column.status}
                >
                  <div
                    className={`bg-gradient-to-l ${column.headerGrad} px-4 py-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${column.dot}`}
                        />
                        <h3
                          className={`text-sm font-bold ${column.headerText}`}
                        >
                          {column.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${column.badge}`}
                      >
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.status}>
                    {(dropProvided, dropSnapshot) => (
                      <div
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className={`flex min-h-72 flex-1 flex-col space-y-3 p-3 transition ${
                          dropSnapshot.isDraggingOver
                            ? "bg-white/45 dark:bg-white/5"
                            : ""
                        }`}
                      >
                        {columnTasks.length === 0 ? (
                          <div
                            className={`flex min-h-40 flex-1 flex-col items-center justify-center rounded-xl border border-dashed ${column.emptyBorder} bg-white/45 text-center dark:bg-slate-900/20`}
                          >
                            <CircleDashed
                              size={20}
                              className="text-[--text-3]"
                            />
                            <p className="mt-2 text-xs text-[--text-3]">
                              پروژه‌ای نیست
                            </p>
                          </div>
                        ) : (
                          columnTasks.map((task, index) => {
                            const taskId = getId(task);
                            const isDone = (task.status ?? "todo") === "done";
                            const isOverdue = isTaskOverdue(task);
                            const canClaimPublicTask =
                              !!task.isPublic &&
                              !isDone &&
                              !isOverdue &&
                              !!onClaimTask;
                            const deadline = task.dueDate ?? task.endDate;

                            return (
                              <Draggable
                                draggableId={taskId}
                                index={index}
                                isDragDisabled={isDone || isOverdue}
                                key={taskId}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <DraggablePortal
                                    enabled={dragSnapshot.isDragging}
                                  >
                                    <article
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={`rounded-xl border border-[--border] border-t-[3px] ${column.cardBorder} bg-[--surface] p-3.5 shadow-sm transition-[background-color,border-color,box-shadow] ${isDone || isOverdue ? "cursor-pointer" : "cursor-grab touch-none active:cursor-grabbing"} ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-[#1f7a8c]/30" : "hover:shadow-md"}`}
                                    onClick={() => onSelectTask(task)}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span
                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${column.badge}`}
                                      >
                                        {statusLabel(task.status)}
                                      </span>
                                      {task.excelFile && (
                                        <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                          <FileSpreadsheet size={10} />
                                          اکسل
                                        </span>
                                      )}
                                      {isOverdue && (
                                        <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                          مهلت گذشته
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-2.5 flex items-start gap-2">
                                      <ClipboardList
                                        size={15}
                                        className="mt-0.5 shrink-0 text-[#1f7a8c]"
                                      />
                                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                                        {task.title}
                                      </h4>
                                    </div>
                                    {task.description && (
                                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[--text-3]">
                                        {task.description}
                                      </p>
                                    )}
                                    <TaskDeadlineCountdown
                                      className="mt-3"
                                      dueDate={deadline}
                                      status={task.status}
                                    />
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                      <AssigneeStack users={task.assignedTo} />
                                      {deadline && (
                                        <div className="flex items-center gap-1 rounded-md bg-[--surface-2] px-2 py-1 text-[10px] text-[--text-3]">
                                          <CalendarDays size={10} />
                                          {formatDate(deadline)}
                                        </div>
                                      )}
                                    </div>
                                    {canClaimPublicTask && (
                                      <button
                                        className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1f7a8c] px-3 text-xs font-bold text-white transition hover:bg-[#196b7b]"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void onClaimTask(taskId);
                                        }}
                                        type="button"
                                      >
                                        <UserCheck size={13} />
                                        انتخاب پروژه
                                      </button>
                                    )}
                                    </article>
                                  </DraggablePortal>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {dropProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            <div
              className="min-h-[420px] lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]"
              id="task-inline-detail"
            >
              {!selectedTask && (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl bg-[--surface]/55 px-6 text-center shadow-[inset_0_0_0_1px_var(--border)]">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
                    <ClipboardList size={22} />
                  </div>
                  <h3 className="mt-4 text-balance text-sm font-bold text-[--text]">
                    جزئیات پروژه
                  </h3>
                  <p className="mt-1 max-w-52 text-pretty text-xs leading-5 text-[--text-3]">
                    برای مشاهده جزئیات، یک پروژه را انتخاب کنید.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </LandingPageEntrance>
  );
}
