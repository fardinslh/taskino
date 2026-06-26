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
  managerApi,
  type User,
  type FixedTask,
  type FixedTaskStatus,
} from "@/lib/api";
import {
  approvedDurationMinutes,
  elapsedDurationMinutes,
} from "../_lib/fixed-task-timing";
import { isFixedTaskOverdue } from "../_lib/task-helpers";

type FixedTaskFormValues = {
  title: string;
  assignedTo: string;
  recurrence: "daily" | "weekly" | "monthly";
  description?: string;
};

type FixedTaskActivationValues = {
  startDate: string;
  endDate: string;
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
  const [editingFixedTask, setEditingFixedTask] = useState<FixedTask | null>(
    null,
  );
  const [fixedReportsTab, setFixedReportsTab] = useState<
    "templates" | "incomplete"
  >("templates");
  const [ftActive, setFtActive] = useState(false);
  const [ftAssignee, setFtAssignee] = useState("");
  const [ftDescription, setFtDescription] = useState("");
  const [ftNextRunAt, setFtNextRunAt] = useState("");
  const [ftRecurrence, setFtRecurrence] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
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
      isActive: editingFixedTask ? ftActive : true,
      ...(ftNextRunAt
        ? { nextRunAt: new Date(ftNextRunAt).toISOString() }
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
        await loadManagerAnalytics();
      }
      setMessage(
        editingFixedTask ? "الگوی ثابت بروزرسانی شد." : "الگوی ثابت ساخته شد.",
      );
      closeFixedTaskForm();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره الگو ناموفق بود",
      );
    }
  }

  async function saveFixedTaskFromValues(values: FixedTaskFormValues) {
    if (!myId || !values.title.trim() || !values.assignedTo) return;
    const specialistName = findSpecialistName(values.assignedTo);

    const body = {
      title: values.title.trim(),
      assignedTo: values.assignedTo,
      specialistName,
      recurrence: values.recurrence,
      description: values.description?.trim() || undefined,
      isActive: editingFixedTask?.isActive ?? true,
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
        await loadManagerAnalytics();
      }
      setMessage(
        editingFixedTask
          ? "\u0627\u0644\u06af\u0648\u06cc \u062b\u0627\u0628\u062a \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc \u0634\u062f."
          : "\u0627\u0644\u06af\u0648\u06cc \u062b\u0627\u0628\u062a \u0633\u0627\u062e\u062a\u0647 \u0634\u062f.",
      );
      closeFixedTaskForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "\u0630\u062e\u06cc\u0631\u0647 \u0627\u0644\u06af\u0648 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f",
      );
    }
  }

  async function activateFixedTask(
    fixedTask: FixedTask,
    values: FixedTaskActivationValues,
  ) {
    if (!myId) return false;

    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);
    const assignedTo = getId(fixedTask.assignedTo);
    const formatTime = (date: Date) =>
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    try {
      const created = await fixedTaskApi.create(token, {
        title: fixedTask.title,
        assignedTo,
        specialistName:
          fixedTask.specialistName || findSpecialistName(assignedTo),
        recurrence: fixedTask.recurrence,
        description: fixedTask.description?.trim() || undefined,
        isActive: true,
        startDate: startDate.toISOString(),
        startTime: formatTime(startDate),
        endDate: endDate.toISOString(),
        endTime: formatTime(endDate),
        nextRunAt: startDate.toISOString(),
      });
      setFixedTasks((current) => [created, ...current]);
      setMessage(
        "\u0627\u0644\u06af\u0648 \u0641\u0639\u0627\u0644 \u0634\u062f.",
      );
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "\u0641\u0639\u0627\u0644\u200c\u0633\u0627\u0632\u06cc \u0627\u0644\u06af\u0648 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f",
      );
      return false;
    }
  }

  async function toggleFixedTaskActive(fixedTask: FixedTask, active: boolean) {
    if (!myId) return;
    try {
      const updated = await fixedTaskApi.update(token, getId(fixedTask), myId, {
        isActive: active,
      });
      setFixedTasks((current) =>
        current.map((item) =>
          getId(item) === getId(fixedTask) ? updated : item,
        ),
      );
      setMessage(updated.isActive !== false ? "الگو فعال شد." : "الگو غیرفعال شد.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "تغییر وضعیت الگو ناموفق بود",
      );
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
    if (
      !window.confirm(
        "ایمپورت کاربران و الگوهای ثابت از فایل اکسل پیکربندی‌شده؟",
      )
    )
      return;
    try {
      const result = await fixedTaskApi.seedFromExcel(token);
      setMessage(result?.message ?? "ایمپورت از اکسل با موفقیت انجام شد.");
      await loadManagerAnalytics();
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ایمپورت از اکسل ناموفق بود",
      );
    }
  }

  function onDragEnd({ destination, source, draggableId }: DropResult) {
    if (!destination) return;
    if (source.droppableId === "done") return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;
    if (destination.droppableId !== source.droppableId) {
      void moveFixedTask(
        draggableId,
        destination.droppableId as FixedTaskStatus,
      );
    }
  }

  async function moveFixedTask(id: string, status: FixedTaskStatus) {
    if (!myId) return;
    const target = fixedTasks.find((item) => getId(item) === id);
    const assignedId = getId(target?.assignedTo);

    if (assignedId && assignedId !== myId) {
      setError("این گزارش به کاربر دیگری اختصاص داده شده است.");
      return;
    }
    const currentStatus = target?.status ?? "todo";
    if (status === currentStatus) return target;
    if (
      target &&
      isFixedTaskOverdue(target) &&
      (status === "in_progress" || status === "done")
    ) {
      setError("مهلت این گزارش ثابت گذشته است و امکان تغییر وضعیت به در حال انجام یا تکمیل شده وجود ندارد.");
      return;
    }
    const validTransition =
      (currentStatus === "todo" && status === "in_progress") ||
      (currentStatus === "in_progress" && status === "done");
    if (!validTransition) {
      setError("گزارش ثابت باید به‌ترتیب از «در انتظار» به «در حال انجام» و سپس «تکمیل‌شده» منتقل شود.");
      return;
    }
    if (status === "done" && !target?.startedAt) {
      setError("ابتدا زمان‌سنج گزارش را شروع کنید.");
      return;
    }
    const previous = fixedTasks;
    setFixedTasks((current) =>
      current.map((item) => (getId(item) === id ? { ...item, status } : item)),
    );
    try {
      const confirmedDuration = target ? approvedDurationMinutes(target) : null;
      const statusBody =
        status === "done"
          ? {
              actualDurationMinutes:
                confirmedDuration ?? elapsedDurationMinutes(target?.startedAt),
            }
          : undefined;
      const updated =
        status === "in_progress" && !target?.startedAt
          ? await fixedTaskApi.startTimer(token, id)
          : await fixedTaskApi.updateStatus(token, id, status, statusBody);
      setFixedTasks((current) =>
        current.map((item) =>
          getId(item) === id ? { ...item, ...updated } : item,
        ),
      );
      if (status === "done") {
        await loadData();
      }
      return updated;
    } catch (error) {
      setFixedTasks(previous);
      setError(
        error instanceof Error ? error.message : "تغییر وضعیت گزارش ناموفق بود",
      );
    }
  }

  async function reviewFixedTaskTiming(
    id: string,
    status: "approved" | "rejected",
    approvedDurationMinutes?: number,
    taskComment?: string,
  ) {
    try {
      const updated = await managerApi.reviewFixedTaskTiming(
        token,
        id,
        status,
        approvedDurationMinutes,
        taskComment,
      );
      setFixedTasks((current) =>
        current.map((item) => (getId(item) === id ? updated : item)),
      );
      setMessage(status === "approved" ? "زمان گزارش تأیید شد." : "زمان گزارش رد شد.");
      return updated;
    } catch (error) {
      setError(error instanceof Error ? error.message : "بررسی زمان گزارش ناموفق بود");
    }
  }

  return {
    activateFixedTask,
    closeFixedTaskForm,
    toggleFixedTaskActive,
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
    reviewFixedTaskTiming,
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
  };
}
