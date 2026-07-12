"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardList, LoaderCircle, Plus, RefreshCw } from "lucide-react";

import {
  type FixedTask,
  fixedTaskApi,
  getId,
  normalizeList,
  supervisorApi,
} from "@/lib/api";
import {
  FilterBar,
  FixedTaskFormPanel,
  TemplateRow,
  type FixedTaskFormValues,
} from "../../../_components/fixed-task-ui";
import { LandingPageEntrance } from "../../../_components/landing-page-entrance";
import {
  useFeedbackContext,
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../../../_components/taskino-context";
import {
  buildFixedTaskScheduleConfig,
  getFixedTaskScheduleValues,
  initialFixedTaskDateRange,
} from "../../../_lib/fixed-task-schedule";

export default function SupervisorCreateReportsPage() {
  const { activeView } = useNavigationContext();
  const { currentUser, isSupervisor, myId, token } = useSessionContext();
  const { setError, setMessage } = useFeedbackContext();
  const { loadSupervisorData } = useManagementContext();
  const {
    fixedTasks,
    setFixedTasks,
    showFixedTaskForm,
    editingFixedTask,
    openFixedTaskForm,
    closeFixedTaskForm,
    deleteFixedTask,
  } = useFixedTaskContext();

  const form = useForm<FixedTaskFormValues>({
    defaultValues: {
      title: "",
      recurrence: "daily",
      weekdays: [6, 0, 1, 2, 3, 4],
      monthDays: [1],
      assignedTo: "",
      approvedDurationMinutes: undefined,
      description: "",
    },
  });
  const [workFieldUsers, setWorkFieldUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const visibleFixedTasks = useMemo(
    () => fixedTasks.filter((task) => task.isActive === true),
    [fixedTasks],
  );

  const filteredFixedTasks = useMemo(() => {
    const specialistQuery = filterSpecialist.trim().toLowerCase();
    const titleQuery = filterTitle.trim().toLowerCase();

    return visibleFixedTasks.filter((task: any) => {
      if (getId(task.assignedTo) === myId) {
        return false;
      }

      const recurrenceMatch =
        !filterRecurrence || (task.recurrence ?? "daily") === filterRecurrence;
      const specialistMatch =
        !specialistQuery ||
        String(
          [
            task.assignedTo?.firstName,
            task.assignedTo?.lastName,
            task.specialistName,
          ]
            .filter(Boolean)
            .join(" "),
        )
          .toLowerCase()
          .includes(specialistQuery);
      const titleMatch =
        !titleQuery ||
        String(task.title ?? "")
          .toLowerCase()
          .includes(titleQuery);

      return recurrenceMatch && specialistMatch && titleMatch;
    });
  }, [
    filterRecurrence,
    filterSpecialist,
    filterTitle,
    myId,
    visibleFixedTasks,
  ]);

  useEffect(() => {
    if (!showFixedTaskForm) return;
    const recurrence = editingFixedTask?.recurrence ?? "daily";
    const schedule = getFixedTaskScheduleValues(
      recurrence,
      editingFixedTask?.scheduleConfig,
    );
    form.reset({
      title: editingFixedTask?.title ?? "",
      recurrence,
      ...schedule,
      assignedTo: getId(editingFixedTask?.assignedTo),
      approvedDurationMinutes:
        editingFixedTask?.approvedDurationMinutes ?? undefined,
      description: editingFixedTask?.description ?? "",
    });
  }, [editingFixedTask, form, showFixedTaskForm]);

  const loadFixedTaskTemplates = useCallback(async () => {
    if (!token) return;

    setLoadingTemplates(true);
    try {
      const limit = 100;
      const firstResponse = await fixedTaskApi.list(token, { page: 1, limit });
      const firstPageItems = normalizeList(
        firstResponse as FixedTask[] | { data?: FixedTask[] },
      );
      const total =
        firstResponse &&
        typeof firstResponse === "object" &&
        "total" in (firstResponse as Record<string, unknown>)
          ? Number((firstResponse as Record<string, unknown>).total)
          : firstPageItems.length;
      const totalPages = Math.ceil(total / limit);
      const remainingResponses =
        totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                fixedTaskApi.list(token, {
                  page: index + 2,
                  limit,
                }),
              ),
            )
          : [];
      const remainingItems = remainingResponses.flatMap((response) =>
        normalizeList(response as FixedTask[] | { data?: FixedTask[] }),
      );

      setFixedTasks([...firstPageItems, ...remainingItems]);
    } catch (error) {
      setFixedTasks([]);
      setError(
        error instanceof Error
          ? error.message
          : "دریافت گزارش‌های ثابت ناموفق بود",
      );
    } finally {
      setLoadingTemplates(false);
    }
  }, [setError, setFixedTasks, token]);

  const loadWorkFieldUsers = useCallback(async () => {
    if (!token) return;

    setLoadingUsers(true);
    try {
      const response = await supervisorApi.workFieldSpecialists(token);
      setWorkFieldUsers(normalizeList(response as any));
    } catch (error) {
      setWorkFieldUsers([]);
      setError(
        error instanceof Error
          ? error.message
          : "دریافت کاربران حوزه ناموفق بود",
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [setError, token]);

  useEffect(() => {
    if (!isSupervisor || activeView !== "supervisor-create-report" || !token) {
      return;
    }

    queueMicrotask(() => void loadWorkFieldUsers());
    queueMicrotask(() => void loadFixedTaskTemplates());
  }, [
    activeView,
    isSupervisor,
    loadFixedTaskTemplates,
    loadWorkFieldUsers,
    token,
  ]);

  async function reloadSupervisorCreateData() {
    await Promise.all([
      loadSupervisorData(),
      loadWorkFieldUsers(),
      loadFixedTaskTemplates(),
    ]);
  }

  async function saveSupervisorFixedTask(values: FixedTaskFormValues) {
    if (!token || !myId || !values.title.trim() || !values.assignedTo) return;

    const assignee = workFieldUsers.find(
      (user: any) => getId(user) === values.assignedTo,
    );
    const specialistName = [assignee?.firstName, assignee?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const body = {
      title: values.title.trim(),
      assignedTo: values.assignedTo,
      specialistName: specialistName || undefined,
      recurrence: values.recurrence,
      scheduleConfig: buildFixedTaskScheduleConfig(
        values.recurrence,
        values.weekdays,
        values.monthDays,
      ),
      approvedDurationMinutes: values.approvedDurationMinutes,
      description: values.description?.trim() || undefined,
    };

    try {
      if (editingFixedTask) {
        await fixedTaskApi.update(token, getId(editingFixedTask), myId, body);
        setMessage("گزارش ثابت بروزرسانی شد.");
      } else {
        await fixedTaskApi.create(token, {
          ...body,
          ...initialFixedTaskDateRange(values.recurrence),
          startTime: "00:00",
          endTime: "00:00",
        });
        setMessage("گزارش ثابت جدید ساخته شد.");
      }

      closeFixedTaskForm();
      form.reset();
      await reloadSupervisorCreateData();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "ذخیره گزارش ثابت ناموفق بود",
      );
    }
  }

  const clearFilters = () => {
    setFilterRecurrence("");
    setFilterSpecialist("");
    setFilterTitle("");
  };

  if (!isSupervisor || activeView !== "supervisor-create-report") return null;

  return (
    <LandingPageEntrance className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
        <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="font-bold">مدیریت الگوهای ثابت</h2>
              <p className="text-[11px] text-[--text-3]">
                {visibleFixedTasks.length} الگو تعریف شده
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
              onClick={() => void reloadSupervisorCreateData()}
              type="button"
            >
              <RefreshCw size={15} />
            </button>
            <button
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#1f7a8c] to-[#2491a5] px-4 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.98]"
              onClick={() => openFixedTaskForm()}
              type="button"
            >
              <Plus size={15} />
              الگوی جدید
            </button>
          </div>
        </div>

        {showFixedTaskForm && (
          <FixedTaskFormPanel
            form={form}
            editingFixedTask={editingFixedTask}
            users={workFieldUsers}
            currentUser={currentUser}
            onClose={() => {
              closeFixedTaskForm();
              form.reset();
            }}
            onSubmit={saveSupervisorFixedTask}
          />
        )}

        <FilterBar
          filterRecurrence={filterRecurrence}
          filterSpecialist={filterSpecialist}
          filterTitle={filterTitle}
          onRecurrenceChange={setFilterRecurrence}
          onSpecialistChange={setFilterSpecialist}
          onTitleChange={setFilterTitle}
          onClear={clearFilters}
          filteredCount={filteredFixedTasks.length}
        />

        <div className="divide-y divide-[--border]">
          {loadingTemplates ? (
            <div className="flex min-h-56 flex-col items-center justify-center bg-gradient-to-b from-[--surface] to-[--surface-2]/40 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-[#1f7a8c]/10" />
                <LoaderCircle className="animate-spin" size={30} />
              </div>
              <p className="mt-4 font-bold text-[--text]">در حال دریافت الگوهای ثابت</p>
              <p className="mt-1 text-xs text-[--text-3]">لطفاً چند لحظه صبر کنید...</p>
            </div>
          ) : filteredFixedTasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ClipboardList size={32} className="text-[--text-3]" />
              <p className="mt-3 font-semibold text-[--text]">
                {loadingUsers
                  ? "در حال دریافت کاربران..."
                  : "موردی با این فیلترها پیدا نشد"}
              </p>
              <button
                className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white"
                onClick={clearFilters}
                type="button"
              >
                <Plus size={15} />
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            filteredFixedTasks.map((task: any) => (
              <TemplateRow
                key={getId(task)}
                task={task}
                canEdit
                onEdit={() => openFixedTaskForm(task)}
                onDelete={() => void deleteFixedTask(getId(task))}
              />
            ))
          )}
        </div>
      </div>
    </LandingPageEntrance>
  );
}
