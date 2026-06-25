"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useState } from "react";

import {
  getId,
  normalizeList,
  taskApi,
  type Task,
} from "@/lib/api";

type TaskActionsInput = {
  token: string;
  myId: string;
  tasks: Task[];
  selectedTask: Task | null;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  setError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  loadData: () => Promise<void>;
};

type CreateTaskValues = {
  title: string;
  projectType?: "specialist" | "general";
  assignee?: string;
  recurrence?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  file?: File | null;
};

type TaskLookupValues = {
  firstName: string;
  lastName: string;
};

type CompletionStatsValues = {
  expertId: string;
};

type DateCountValues = {
  userId: string;
  startDate: string;
  endDate: string;
};

export function useTaskActions({
  token,
  myId,
  tasks,
  selectedTask,
  setTasks,
  setSelectedTask,
  setError,
  setMessage,
  loadData,
}: TaskActionsInput) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskRecurrence, setTaskRecurrence] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskEndTime, setTaskEndTime] = useState("");
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  const [taLookupFirst, setTaLookupFirst] = useState("");
  const [taLookupLast, setTaLookupLast] = useState("");
  const [taLookupResult, setTaLookupResult] = useState<Task[] | null>(null);
  const [taCompletionExpert, setTaCompletionExpert] = useState("");
  const [taCompletionResult, setTaCompletionResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [taCountUser, setTaCountUser] = useState("");
  const [taCountStart, setTaCountStart] = useState("");
  const [taCountEnd, setTaCountEnd] = useState("");
  const [taCountResult, setTaCountResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  function resetTaskForm() {
    setTaskTitle("");
    setTaskAssignee("");
    setTaskProjectId("");
    setTaskRecurrence("");
    setTaskDescription("");
    setTaskStartDate("");
    setTaskDueDate("");
    setTaskStartTime("");
    setTaskEndTime("");
    setTaskFile(null);
    setShowNewProjectForm(false);
  }

  async function createTask(values: CreateTaskValues) {
    const title = values.title.trim();
    if (!myId || !title) return;
    const isGeneralProject = values.projectType === "general";
    const assignee = values.assignee || (isGeneralProject ? "" : myId);
    const body = {
      title,
      ...(!isGeneralProject ? { assignedTo: [assignee] } : {}),
      projectType: values.projectType,
      isPublic: isGeneralProject,
      status: "todo",
      ...(values.description?.trim()
        ? { description: values.description.trim() }
        : {}),
      ...(values.recurrence ? { recurrence: values.recurrence } : {}),
      ...(values.startDate
        ? { startDate: new Date(values.startDate).toISOString() }
        : {}),
      ...(values.endDate
        ? { endDate: new Date(values.endDate).toISOString() }
        : {}),
      ...(values.startTime ? { startTime: values.startTime } : {}),
      ...(values.endTime ? { endTime: values.endTime } : {}),
    };
    try {
      await taskApi.create(token, body, values.file ?? undefined);
      resetTaskForm();
      setMessage("گزارش جدید ساخته شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت گزارش ناموفق بود");
    }
  }

  async function createTaskFromValues(values: CreateTaskValues) {
    return createTask(values);
  }

  async function claimTask(taskId: string) {
    if (!myId) return;
    try {
      const updated = await taskApi.update(token, taskId, {
        assignedTo: [myId],
        isPublic: false,
      });
      setTasks((prev) => prev.map((t) => (getId(t) === taskId ? updated : t)));
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask(updated);
      await loadData();
      setMessage("گزارش برای شما اساین شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "اساین گزارش ناموفق بود");
    }
  }

  async function moveTask(taskId: string, newStatus: string) {
    try {
      const currentTask = tasks.find((task) => getId(task) === taskId);
      const shouldClaimPublicTask =
        !!currentTask?.isPublic &&
        (newStatus === "in_progress" || newStatus === "done");
      if (shouldClaimPublicTask && !myId) return;
      const updatedTask: Partial<Task> = shouldClaimPublicTask
        ? await taskApi.update(token, taskId, {
            status: newStatus,
            assignedTo: [myId],
            isPublic: false,
          })
        : { status: newStatus };

      if (!shouldClaimPublicTask) {
        await taskApi.updateStatus(token, taskId, newStatus);
      }

      setTasks((prev) =>
        prev.map((t) =>
          getId(t) === taskId ? { ...t, ...updatedTask } : t,
        ),
      );
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask((prev) =>
          prev ? { ...prev, ...updatedTask } : prev,
        );
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // MongoDB "retryable writes not supported" error fires even when the write
      // already succeeded on the first attempt. Reload and continue silently.
      if (message.toLowerCase().includes("retrywrites")) {
        setTasks((prev) =>
          prev.map((t) =>
            getId(t) === taskId ? { ...t, status: newStatus } : t,
          ),
        );
        if (selectedTask && getId(selectedTask) === taskId)
          setSelectedTask((prev) =>
            prev ? { ...prev, status: newStatus } : prev,
          );
        await loadData();
        return;
      }
      setError(message || "تغییر وضعیت ناموفق بود");
    }
  }

  async function updateTask(taskId: string, body: Record<string, unknown>) {
    try {
      const updated = await taskApi.update(token, taskId, body);
      setTasks((prev) =>
        prev.map((t) => (getId(t) === taskId ? { ...t, ...updated } : t)),
      );
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask((prev) => (prev ? { ...prev, ...updated } : prev));
      setMessage("گزارش بروزرسانی شد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "بروزرسانی گزارش ناموفق بود",
      );
    }
  }

  async function uploadTaskCompletionFile(taskId: string, file: File) {
    try {
      const updated = await taskApi.uploadCompletionFile(token, taskId, file);
      setTasks((prev) =>
        prev.map((t) => (getId(t) === taskId ? { ...t, ...updated } : t)),
      );
      if (selectedTask && getId(selectedTask) === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      setMessage("فایل تکمیل پروژه آپلود شد.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "آپلود فایل تکمیل پروژه ناموفق بود",
      );
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await taskApi.delete(token, taskId);
      setTasks((prev) => prev.filter((t) => getId(t) !== taskId));
      setSelectedTask(null);
      setMessage("گزارش حذف شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف گزارش ناموفق بود");
    }
  }

  async function taLookupTasks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taLookupFirst.trim() || !taLookupLast.trim()) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    try {
      const res = await taskApi.byUserName(
        token,
        taLookupFirst.trim(),
        taLookupLast.trim(),
      );
      setTaLookupResult(normalizeList(res));
    } catch (err) {
      setTaLookupResult([]);
      setError(err instanceof Error ? err.message : "جستجو ناموفق بود");
    }
  }

  async function taRunCompletionStats(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId || !taCompletionExpert) return;
    try {
      const res = await taskApi.completionStats(token, {
        managerId: myId,
        expertId: taCompletionExpert,
      });
      setTaCompletionResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت آمار ناموفق بود");
    }
  }

  async function taRunDateCount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taCountUser || !taCountStart || !taCountEnd) return;
    try {
      const res = await taskApi.dateCount(token, {
        userId: taCountUser,
        startdate: taCountStart,
        enddate: taCountEnd,
      });
      setTaCountResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت تعداد ناموفق بود");
    }
  }

  async function taLookupTasksFromValues(values: TaskLookupValues) {
    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    try {
      const res = await taskApi.byUserName(
        token,
        values.firstName.trim(),
        values.lastName.trim(),
      );
      setTaLookupResult(normalizeList(res));
    } catch (err) {
      setTaLookupResult([]);
      setError(err instanceof Error ? err.message : "جستجو ناموفق بود");
    }
  }

  async function taRunCompletionStatsFromValues(values: CompletionStatsValues) {
    if (!myId || !values.expertId) return;
    try {
      const res = await taskApi.completionStats(token, {
        managerId: myId,
        expertId: values.expertId,
      });
      setTaCompletionResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت آمار ناموفق بود");
    }
  }

  async function taRunDateCountFromValues(values: DateCountValues) {
    if (!values.userId || !values.startDate || !values.endDate) return;
    try {
      const res = await taskApi.dateCount(token, {
        userId: values.userId,
        startdate: values.startDate,
        enddate: values.endDate,
      });
      setTaCountResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت تعداد ناموفق بود");
    }
  }

  return {
    taskTitle,
    setTaskTitle,
    taskAssignee,
    setTaskAssignee,
    taskProjectId,
    setTaskProjectId,
    taskRecurrence,
    setTaskRecurrence,
    taskDescription,
    setTaskDescription,
    taskStartDate,
    setTaskStartDate,
    taskDueDate,
    setTaskDueDate,
    taskStartTime,
    setTaskStartTime,
    taskEndTime,
    setTaskEndTime,
    taskFile,
    setTaskFile,
    showNewProjectForm,
    setShowNewProjectForm,
    taLookupFirst,
    setTaLookupFirst,
    taLookupLast,
    setTaLookupLast,
    taLookupResult,
    setTaLookupResult,
    taCompletionExpert,
    setTaCompletionExpert,
    taCompletionResult,
    setTaCompletionResult,
    taCountUser,
    setTaCountUser,
    taCountStart,
    setTaCountStart,
    taCountEnd,
    setTaCountEnd,
    taCountResult,
    setTaCountResult,
    createTask,
    createTaskFromValues,
    claimTask,
    moveTask,
    updateTask,
    uploadTaskCompletionFile,
    deleteTask,
    taLookupTasks,
    taLookupTasksFromValues,
    taRunCompletionStats,
    taRunCompletionStatsFromValues,
    taRunDateCount,
    taRunDateCountFromValues,
  };
}
