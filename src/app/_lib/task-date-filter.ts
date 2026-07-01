import type { Task } from "@/lib/api";

function validDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isTaskVisibleOnDate(task: Task, selectedDate: Date) {
  const rawStart = validDate(task.startDate);
  const rawEnd = validDate(task.dueDate ?? task.endDate);
  if (!rawStart && !rawEnd) return true;

  const taskStart = rawStart ?? rawEnd!;
  const taskEnd = rawEnd ?? rawStart!;
  const dayStart = new Date(selectedDate);
  const dayEnd = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  dayEnd.setHours(23, 59, 59, 999);

  return taskStart <= dayEnd && taskEnd >= dayStart;
}
