"use client";

import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

import {
  useTaskinoController,
  type TaskinoController,
} from "./use-taskino-controller";

const sessionKeys = [
  "token",
  "authHydrated",
  "currentUser",
  "setCurrentUser",
  "myId",
  "isManager",
  "isSupervisor",
  "isSpecialist",
  "logout",
] as const;

const feedbackKeys = [
  "loadingData",
  "error",
  "message",
  "setError",
  "setMessage",
  "loadData",
] as const;

const navigationKeys = [
  "activeView",
  "setActiveView",
  "taskQuery",
  "setTaskQuery",
  "specialistSearchQuery",
  "setSpecialistSearchQuery",
  "selectedSpecialistId",
  "setSelectedSpecialistId",
  "selectedAssigneeFilter",
  "setSelectedAssigneeFilter",
  "boardShowAll",
  "setBoardShowAll",
  "selectedPeriodFilter",
  "setSelectedPeriodFilter",
  "selectedStatusFilter",
  "setSelectedStatusFilter",
  "setSelectedTask",
  "setSelectedFixedTask",
  "showNewProjectForm",
  "setShowNewProjectForm",
] as const;

const taskKeys = [
  "tasks",
  "projects",
  "taskTitle",
  "taskAssignee",
  "taskDescription",
  "taskStartDate",
  "taskDueDate",
  "taskStartTime",
  "taskEndTime",
  "taskFile",
  "setTaskTitle",
  "setTaskAssignee",
  "setTaskDescription",
  "setTaskStartDate",
  "setTaskDueDate",
  "setTaskStartTime",
  "setTaskEndTime",
  "setTaskFile",
  "createTask",
  "createTaskFromValues",
  "claimTask",
  "deleteTask",
  "moveTask",
  "uploadTaskCompletionFile",
  "taLookupFirst",
  "taLookupLast",
  "taLookupResult",
  "taCompletionExpert",
  "taCompletionResult",
  "taCountUser",
  "taCountStart",
  "taCountEnd",
  "taCountResult",
  "setTaLookupFirst",
  "setTaLookupLast",
  "setTaCompletionExpert",
  "setTaCountUser",
  "setTaCountStart",
  "setTaCountEnd",
  "taLookupTasks",
  "taLookupTasksFromValues",
  "taRunCompletionStats",
  "taRunCompletionStatsFromValues",
  "taRunDateCount",
  "taRunDateCountFromValues",
  "doneTasks",
  "activeTasks",
  "inProgressTasks",
  "todoCount",
  "progress",
  "filteredTasks",
  "specialistTaskCounts",
  "specialistFixedTaskCounts",
  "specialistProgressStats",
  "specialistWorkSummary",
] as const;

const managementKeys = [
  "users",
  "managerStats",
  "managerTaskStatus",
  "managerTaskStatusRange",
  "managerUserCounts",
  "managerMonthlyPerf",
  "managerUserProgress",
  "loadManagerAnalytics",
  "leaveRequests",
  "leaveStatistics",
  "handleLeaveAction",
  "updateUserRole",
  "approveUser",
  "deleteUser",
  "showNewUserForm",
  "setShowNewUserForm",
  "teamSearchResult",
  "setTeamSearchResult",
  "teamSearching",
  "setTeamSearching",
  "supervisorStats",
  "supervisorTasks",
  "supervisorFixedTasks",
  "supervisorMembers",
  "overdueTasks",
  "teamPerformance",
  "loadSupervisorData",
  "statsUsers",
  "supervisorInProgressReports",
  "supervisorProjectDoneReports",
  "supervisorOwnDoneReports",
  "teamAssignees",
  "teamAssigneeCount",
] as const;

const fixedTaskKeys = [
  "fixedTasks",
  "activeFixedTaskCount",
  "incompleteFixedTasks",
  "fixedDoneTasks",
  "fixedInProgressTasks",
  "fixedOpenTasks",
  "fixedTodoCount",
  "filteredFixedTemplates",
  "fixedReportsTab",
  "setFixedReportsTab",
  "selectedFixedTask",
  "setFixedTasks",
  "showFixedTaskForm",
  "editingFixedTask",
  "ftTitle",
  "setFtTitle",
  "ftAssignee",
  "setFtAssignee",
  "ftRecurrence",
  "setFtRecurrence",
  "ftDescription",
  "setFtDescription",
  "ftActive",
  "setFtActive",
  "ftNextRunAt",
  "setFtNextRunAt",
  "openFixedTaskForm",
  "closeFixedTaskForm",
  "saveFixedTask",
  "saveFixedTaskFromValues",
  "activateFixedTask",
  "toggleFixedTaskActive",
  "deleteFixedTask",
  "seedFixedTasksFromExcel",
  "onDragEnd",
  "moveFixedTask",
] as const;

const excelKeys = [
  "excelFiles",
  "excelStats",
  "excelUploading",
  "handleExcelUpload",
  "downloadExcelFile",
  "processExcelFile",
  "deleteExcelFile",
  "exportTasksToExcel",
] as const;

type ContextValue<Keys extends readonly (keyof TaskinoController)[]> = Pick<
  TaskinoController,
  Keys[number]
>;

type SessionContextValue = ContextValue<typeof sessionKeys>;
type FeedbackContextValue = ContextValue<typeof feedbackKeys>;
type NavigationContextValue = ContextValue<typeof navigationKeys>;
type TaskContextValue = ContextValue<typeof taskKeys>;
type ManagementContextValue = ContextValue<typeof managementKeys>;
type FixedTaskContextValue = ContextValue<typeof fixedTaskKeys>;
type ExcelContextValue = ContextValue<typeof excelKeys>;

const SessionContext = createContext<SessionContextValue | null>(null);
const FeedbackContext = createContext<FeedbackContextValue | null>(null);
const NavigationContext = createContext<NavigationContextValue | null>(null);
const TaskContext = createContext<TaskContextValue | null>(null);
const ManagementContext = createContext<ManagementContextValue | null>(null);
const FixedTaskContext = createContext<FixedTaskContextValue | null>(null);
const ExcelContext = createContext<ExcelContextValue | null>(null);

function pickContext<
  Keys extends readonly (keyof TaskinoController)[],
>(
  source: TaskinoController,
  keys: Keys,
): ContextValue<Keys> {
  return Object.fromEntries(
    keys.map((key) => [key, source[key]]),
  ) as ContextValue<Keys>;
}

function useRequiredContext<Value>(
  context: React.Context<Value | null>,
  name: string,
) {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${name} must be used inside TaskinoProvider`);
  }
  return value;
}

export function TaskinoProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TaskinoController;
}) {
  return (
    <SessionContext.Provider value={pickContext(value, sessionKeys)}>
      <FeedbackContext.Provider value={pickContext(value, feedbackKeys)}>
        <NavigationContext.Provider value={pickContext(value, navigationKeys)}>
          <TaskContext.Provider value={pickContext(value, taskKeys)}>
            <ManagementContext.Provider value={pickContext(value, managementKeys)}>
              <FixedTaskContext.Provider value={pickContext(value, fixedTaskKeys)}>
                <ExcelContext.Provider value={pickContext(value, excelKeys)}>
                  {children}
                </ExcelContext.Provider>
              </FixedTaskContext.Provider>
            </ManagementContext.Provider>
          </TaskContext.Provider>
        </NavigationContext.Provider>
      </FeedbackContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useRequiredContext(SessionContext, "useSessionContext");
}

export function useFeedbackContext() {
  return useRequiredContext(FeedbackContext, "useFeedbackContext");
}

export function useNavigationContext() {
  return useRequiredContext(NavigationContext, "useNavigationContext");
}

export function useTaskContext() {
  return useRequiredContext(TaskContext, "useTaskContext");
}

export function useManagementContext() {
  return useRequiredContext(ManagementContext, "useManagementContext");
}

export function useFixedTaskContext() {
  return useRequiredContext(FixedTaskContext, "useFixedTaskContext");
}

export function useExcelContext() {
  return useRequiredContext(ExcelContext, "useExcelContext");
}

export function useTaskinoProviderValue(
  initialView?: Parameters<typeof useTaskinoController>[0],
) {
  return useTaskinoController(initialView);
}
