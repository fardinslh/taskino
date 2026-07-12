"use client";

import { useMemo, useState } from "react";

import {
  getId,
  type FixedTask,
  type ManagerStats,
  type Project,
  type SupervisorStats,
  type Task,
  type User,
} from "@/lib/api";
import type { Priority, TaskPeriod } from "../_lib/task-constants";
import {
  isFixedTaskOverdue,
  isFixedTaskStartedTodayOrLater,
  isTaskInPeriod,
  recurrenceLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

type TeamPerformance = {
  assigneeCount?: number;
  assignees?: unknown[];
  members?: unknown[];
  membersCount?: number;
};

type DerivedDataInput = {
  currentUser: User | null;
  fixedTasks: FixedTask[];
  managerStats: ManagerStats | null;
  projects: Project[];
  selectedAssigneeFilter: string;
  selectedPeriodFilter: TaskPeriod | "";
  selectedPriorityFilter: Priority | "";
  selectedProjectFilter: string;
  selectedStatusFilter: string;
  specialistSearchQuery: string;
  supervisorStats: SupervisorStats | null;
  taskPriorities: Record<string, Priority>;
  taskQuery: string;
  tasks: Task[];
  teamPerformance: TeamPerformance | null;
  users: User[];
};

export function useTaskinoDerivedData({
  currentUser,
  fixedTasks,
  managerStats,
  projects,
  selectedAssigneeFilter,
  selectedPeriodFilter,
  selectedPriorityFilter,
  selectedProjectFilter,
  selectedStatusFilter,
  specialistSearchQuery,
  supervisorStats,
  taskPriorities,
  taskQuery,
  tasks,
  teamPerformance,
  users,
}: DerivedDataInput) {
  const [currentTime] = useState(() => Date.now());
  const myId = getId(currentUser ?? undefined);
  const isManager = currentUser?.roles === "manager";
  const isSupervisor = currentUser?.roles === "supervisor";
  const isSpecialist = currentUser?.roles === "specialist";
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const activeTasks =
    managerStats?.openTasks ??
    tasks.filter((task) => task.status !== "done").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const todoCount = tasks.filter(
    (task) => (task.status ?? "todo") === "todo",
  ).length;
  const progress = tasks.length
    ? Math.round((doneTasks / tasks.length) * 100)
    : 0;
  const activeFixedTasks = fixedTasks.filter(
    (item) =>
      item.isActive !== false &&
      (isManager || !myId || getId(item.assignedTo) === myId) &&
      (!isManager && !isSpecialist || !isFixedTaskOverdue(item)) &&
      (!isManager || isFixedTaskStartedTodayOrLater(item)),
  );
  const fixedDoneTasks = activeFixedTasks.filter(
    (item) => item.status === "done",
  ).length;
  const fixedOpenTasks = activeFixedTasks.filter(
    (item) => (item.status ?? "todo") !== "done",
  ).length;
  const fixedInProgressTasks = activeFixedTasks.filter(
    (item) => item.status === "in_progress",
  ).length;
  const fixedTodoCount = activeFixedTasks.filter(
    (item) => (item.status ?? "todo") === "todo",
  ).length;
  const statsProjects = managerStats?.activeProjects ?? projects.length;
  const statsUsers = managerStats?.activeUsers ?? users.length;
  const supervisorInProgressReports =
    (supervisorStats?.supervisedInProgressTasks ?? 0) +
    (supervisorStats?.supervisedInProgressFixedTasks ?? 0);
  const supervisorProjectDoneReports =
    supervisorStats?.myOnTimeSuccessfulTasks ??
    supervisorStats?.participatingProjectsDoneTasks ??
    supervisorStats?.successfulTasksInProjects ??
    0;
  const supervisorOwnDoneReports =
    supervisorStats?.mySuccessfulTasks ??
    supervisorStats?.supervisorDoneTasks ??
    supervisorStats?.successfulTasksAssignedToSupervisor ??
    0;
  const teamAssignees = Array.isArray(teamPerformance?.assignees)
    ? teamPerformance.assignees
    : Array.isArray(teamPerformance?.members)
      ? teamPerformance.members
      : [];
  const teamAssigneeCount =
    teamPerformance?.assigneeCount ??
    teamPerformance?.membersCount ??
    teamAssignees.length;
  const incompleteFixedTasks = useMemo(
    () =>
      activeFixedTasks
        .filter((item) => item.status !== "done")
        .map((item) => {
          const deadline = item.endDate ?? item.nextRunAt;
          return {
            ...item,
            deadline,
            deadlineStatus:
              deadline && new Date(deadline).getTime() < currentTime
                ? "overdue"
                : "within_deadline",
          };
        }),
    [activeFixedTasks, currentTime],
  );

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (selectedProjectFilter) {
      list = list.filter(
        (task) => getId(task.projectId) === selectedProjectFilter,
      );
    }
    if (selectedStatusFilter) {
      list = list.filter(
        (task) => (task.status ?? "todo") === selectedStatusFilter,
      );
    }
    if (selectedAssigneeFilter) {
      list = list.filter((task) =>
        (task.assignedTo ?? []).some(
          (user) => getId(user) === selectedAssigneeFilter,
        ),
      );
    }
    if (selectedPriorityFilter) {
      list = list.filter(
        (task) => taskPriorities[getId(task)] === selectedPriorityFilter,
      );
    }
    if (selectedPeriodFilter) {
      list = list.filter((task) =>
        isTaskInPeriod(task, selectedPeriodFilter),
      );
    }

    const query = taskQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((task) =>
      `${task.title} ${(task.assignedTo ?? []).map(userName).join(" ")} ${statusLabel(task.status)}`
        .toLowerCase()
        .includes(query),
    );
  }, [
    selectedAssigneeFilter,
    selectedPeriodFilter,
    selectedPriorityFilter,
    selectedProjectFilter,
    selectedStatusFilter,
    taskPriorities,
    taskQuery,
    tasks,
  ]);

  const filteredFixedTemplates = useMemo(() => {
    let list = activeFixedTasks;
    if (selectedAssigneeFilter) {
      list = list.filter(
        (item) => getId(item.assignedTo) === selectedAssigneeFilter,
      );
    }
    if (selectedPeriodFilter) {
      list = list.filter(
        (item) => (item.recurrence ?? "daily") === selectedPeriodFilter,
      );
    }
    if (selectedStatusFilter) {
      list = list.filter(
        (item) => (item.status ?? "todo") === selectedStatusFilter,
      );
    }
    const specialistQuery = specialistSearchQuery.trim().toLowerCase();
    if (specialistQuery) {
      list = list.filter((item) =>
        userName(item.assignedTo).trim().toLowerCase().includes(specialistQuery),
      );
    }

    const query = taskQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((item) =>
      `${item.title} ${userName(item.assignedTo)} ${recurrenceLabel(item.recurrence)}`
        .toLowerCase()
        .includes(query),
    );
  }, [
    activeFixedTasks,
    selectedAssigneeFilter,
    selectedPeriodFilter,
    selectedStatusFilter,
    specialistSearchQuery,
    taskQuery,
  ]);

  const activeFixedTaskCount = activeFixedTasks.length;

  return {
    activeTasks,
    activeFixedTaskCount,
    doneTasks,
    fixedDoneTasks,
    fixedInProgressTasks,
    fixedOpenTasks,
    fixedTodoCount,
    filteredFixedTemplates,
    filteredTasks,
    incompleteFixedTasks,
    inProgressTasks,
    isManager,
    isSpecialist,
    isSupervisor,
    myId,
    progress,
    statsProjects,
    statsUsers,
    supervisorInProgressReports,
    supervisorOwnDoneReports,
    supervisorProjectDoneReports,
    teamAssigneeCount,
    teamAssignees,
    todoCount,
  };
}
