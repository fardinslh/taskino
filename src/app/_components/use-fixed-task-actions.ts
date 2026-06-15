"use client";

import type { DropResult } from "@hello-pangea/dnd";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useState,
} from "react";

import {
  fixedTaskApi,
  getId,
  type User,
  type FixedTask,
  type FixedTaskStatus,
} from "@/lib/api";

type FixedTaskFormValues = {
  title: string;
  assignedTo: string;
  recurrence: "daily" | "weekly" | "monthly";
  description?: string;
  nextRunAt?: string;
  isActive: boolean;
};

type FixedTaskActionsInput = {
  fixedTasks: FixedTask[];
  loadData: () => Promise<void>;
  loadManagerAnalytics: () => Promise<void>;
  myId: string;
  users?: User[];
  setError: Dispatch<SetStateAction<string>>;
  setFixedTasks: Dispatch<SetStateAction<FixedTask[]>>;
  setMessage: Dispatch<SetStateAction<string>>;
  token: string;
};

export function useFixedTaskActions({
  fixedTasks,
  loadData,
  loadManagerAnalytics,
  myId,
  users = [],
  setError,
  setFixedTasks,
  setMessage,
  token,
}: FixedTaskActionsInput) {
  const [editingFixedTask, setEditingFixedTask] = useState<FixedTask | null>(null);
  const [fixedReportsTab, setFixedReportsTab] = useState<"templates" | "incomplete">("templates");
  const [ftActive, setFtActive] = useState(false);
  const [ftAssignee, setFtAssignee] = useState("");
  const [ftDescription, setFtDescription] = useState("");
  const [ftNextRunAt, setFtNextRunAt] = useState("");
  const [ftRecurrence, setFtRecurrence] = useState<"daily" | "weekly" | "monthly">("daily");
  const [ftTitle, setFtTitle] = useState("");
  const [showFixedTaskForm, setShowFixedTaskForm] = useState(false);

  function closeFixedTaskForm() {
    setShowFixedTaskForm(false);
    setEditingFixedTask(null);
  }

  function openFixedTaskForm(fixedTask?: FixedTask) {
    setEditingFixedTask(fixedTask ?? null);
    setFtTitle(fixedTask?.title ?? "");
    setFtAssignee(getId(fixedTask?.assignedTo));
    setFtRecurrence(fixedTask?.recurrence ?? "daily");
    setFtDescription(fixedTask?.description ?? "");
    setFtActive(fixedTask?.isActive !== false && !!fixedTask);
    setFtNextRunAt(fixedTask?.nextRunAt?.slice(0, 16) ?? "");
    setShowFixedTaskForm(true);
  }

  function buildDateRange(
    recurrence: "daily" | "weekly" | "monthly",
    nextRunAt?: string,
  ) {
    const baseDate = nextRunAt ? new Date(nextRunAt) : new Date();
    const startDate = new Date(baseDate);
    const endDate = new Date(baseDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (recurrence === "weekly") {
      endDate.setDate(startDate.getDate() + 6);
    }

    if (recurrence === "monthly") {
      endDate.setMonth(startDate.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  function findSpecialistName(assignedTo: string) {
    const specialist = users.find((user) => getId(user) === assignedTo);
    const fullName = [specialist?.firstName, specialist?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || specialist?.mobile || specialist?.email || undefined;
  }

  async function saveFixedTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!myId || !ftTitle.trim() || !ftAssignee) return;

    const body = {
      title: ftTitle.trim(),
      assignedTo: ftAssignee,
      recurrence: ftRecurrence,
      description: ftDescription.trim() || undefined,
      isActive: ftActive,
      ...(ftNextRunAt ? { nextRunAt: new Date(ftNextRunAt).toISOString() } : {}),
    };

    try {
      if (editingFixedTask) {
        const updated = await fixedTaskApi.update(
          token,
          getId(editingFixedTask),
          myId,
          body,
        );
        setFixedTasks((current) =>
          current.map((item) =>
            getId(item) === getId(editingFixedTask) ? updated : item,
          ),
        );
      } else {
        const created = await fixedTaskApi.create(token, body);
        setFixedTasks((current) => [created, ...current]);
      }
      setMessage(editingFixedTask ? "الگوی ثابت بروزرسانی شد." : "الگوی ثابت ساخته شد.");
      closeFixedTaskForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ذخیره الگو ناموفق بود");
    }
  }

  async function saveFixedTaskFromValues(values: FixedTaskFormValues) {
    if (!myId || !values.title.trim() || !values.assignedTo) return;
    const { startDate, endDate } = buildDateRange(
      values.recurrence,
      values.nextRunAt,
    );
    const specialistName = findSpecialistName(values.assignedTo);

    const body = {
      title: values.title.trim(),
      assignedTo: values.assignedTo,
      specialistName,
      recurrence: values.recurrence,
      description: values.description?.trim() || undefined,
      isActive: values.isActive,
      startDate,
      endDate,
      ...(values.nextRunAt
        ? { nextRunAt: new Date(values.nextRunAt).toISOString() }
        : {}),
    };

    try {
      if (editingFixedTask) {
        const updated = await fixedTaskApi.update(
          token,
          getId(editingFixedTask),
          myId,
          body,
        );
        setFixedTasks((current) =>
          current.map((item) =>
            getId(item) === getId(editingFixedTask) ? updated : item,
          ),
        );
      } else {
        const created = await fixedTaskApi.create(token, body);
        setFixedTasks((current) => [created, ...current]);
      }
      setMessage(editingFixedTask ? "Ø§Ù„Ú¯ÙˆÛŒ Ø«Ø§Ø¨Øª Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯." : "Ø§Ù„Ú¯ÙˆÛŒ Ø«Ø§Ø¨Øª Ø³Ø§Ø®ØªÙ‡ Ø´Ø¯.");
      closeFixedTaskForm();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Ø°Ø®ÛŒØ±Ù‡ Ø§Ù„Ú¯Ùˆ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯",
      );
    }
  }

  async function toggleFixedTaskActive(fixedTask: FixedTask) {
    if (!myId) return;
    try {
      const updated = await fixedTaskApi.update(token, getId(fixedTask), myId, {
        isActive: !fixedTask.isActive,
      });
      setFixedTasks((current) =>
        current.map((item) => getId(item) === getId(fixedTask) ? updated : item),
      );
      setMessage(updated.isActive ? "الگو فعال شد." : "الگو غیرفعال شد.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "تغییر وضعیت الگو ناموفق بود");
    }
  }

  async function deleteFixedTask(id: string) {
    try {
      await fixedTaskApi.delete(token, id);
      setFixedTasks((current) => current.filter((item) => getId(item) !== id));
      setMessage("الگوی ثابت حذف شد.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف الگو ناموفق بود");
    }
  }

  async function seedFixedTasksFromExcel() {
    if (!window.confirm("ایمپورت کاربران و الگوهای ثابت از فایل اکسل پیکربندی‌شده؟")) return;
    try {
      const result = await fixedTaskApi.seedFromExcel(token);
      setMessage(result?.message ?? "ایمپورت از اکسل با موفقیت انجام شد.");
      await loadManagerAnalytics();
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ایمپورت از اکسل ناموفق بود");
    }
  }

  function onDragEnd({ destination, source, draggableId }: DropResult) {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (destination.droppableId !== source.droppableId) {
      void moveFixedTask(draggableId, destination.droppableId as FixedTaskStatus);
    }
  }

  async function moveFixedTask(id: string, status: FixedTaskStatus) {
    if (!myId) return;
    const previous = fixedTasks;
    setFixedTasks((current) =>
      current.map((item) => getId(item) === id ? { ...item, status } : item),
    );
    try {
      const updated = await fixedTaskApi.updateStatus(token, id, myId, status);
      setFixedTasks((current) =>
        current.map((item) => getId(item) === id ? { ...item, ...updated } : item),
      );
    } catch (error) {
      setFixedTasks(previous);
      setError(error instanceof Error ? error.message : "تغییر وضعیت گزارش ناموفق بود");
    }
  }

  return {
    closeFixedTaskForm,
    deleteFixedTask,
    editingFixedTask,
    fixedReportsTab,
    ftActive,
    ftAssignee,
    ftDescription,
    ftNextRunAt,
    ftRecurrence,
    ftTitle,
    moveFixedTask,
    onDragEnd,
    openFixedTaskForm,
    saveFixedTask,
    saveFixedTaskFromValues,
    seedFixedTasksFromExcel,
    setFixedReportsTab,
    setFtActive,
    setFtAssignee,
    setFtDescription,
    setFtNextRunAt,
    setFtRecurrence,
    setFtTitle,
    showFixedTaskForm,
    toggleFixedTaskActive,
  };
}
