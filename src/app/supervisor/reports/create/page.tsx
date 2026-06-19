"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardList, Plus, RefreshCw } from "lucide-react";

import {
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
import {
  useFeedbackContext,
  useFixedTaskContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../../../_components/taskino-context";

export default function SupervisorCreateReportsPage() {
  const { activeView } = useNavigationContext();
  const { currentUser, isSupervisor, myId, token } = useSessionContext();
  const { setError, setMessage } = useFeedbackContext();
  const { loadSupervisorData } = useManagementContext();
  const {
    fixedTasks,
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
      assignedTo: "",
      description: "",
    },
  });
  const [workFieldUsers, setWorkFieldUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterRecurrence, setFilterRecurrence] = useState("");
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const visibleFixedTasks = useMemo(() => fixedTasks, [fixedTasks]);

  const filteredFixedTasks = useMemo(() => {
    const specialistQuery = filterSpecialist.trim().toLowerCase();
    const titleQuery = filterTitle.trim().toLowerCase();

    return visibleFixedTasks.filter((task: any) => {
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
  }, [filterRecurrence, filterSpecialist, filterTitle, visibleFixedTasks]);

  useEffect(() => {
    if (!showFixedTaskForm) return;
    form.reset({
      title: editingFixedTask?.title ?? "",
      recurrence: editingFixedTask?.recurrence ?? "daily",
      assignedTo: getId(editingFixedTask?.assignedTo),
      description: editingFixedTask?.description ?? "",
    });
  }, [editingFixedTask, form, showFixedTaskForm]);

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
  }, [activeView, isSupervisor, loadWorkFieldUsers, token]);

  async function reloadSupervisorCreateData() {
    await Promise.all([loadSupervisorData(), loadWorkFieldUsers()]);
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
      description: values.description?.trim() || undefined,
      isActive: editingFixedTask?.isActive ?? false,
    };

    try {
      if (editingFixedTask) {
        await fixedTaskApi.update(token, getId(editingFixedTask), myId, body);
        setMessage("گزارش ثابت بروزرسانی شد.");
      } else {
        await fixedTaskApi.create(token, body);
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
    <section className="space-y-4">
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
          totalCount={visibleFixedTasks.length}
        />

        <div className="divide-y divide-[--border]">
          {filteredFixedTasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ClipboardList size={32} className="text-[--text-3]" />
              <p className="mt-3 font-semibold text-[--text]">
                {loadingUsers
                  ? "در حال دریافت کاربران و گزارش‌ها..."
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
                onEdit={() => openFixedTaskForm(task)}
                onDelete={() => void deleteFixedTask(getId(task))}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
