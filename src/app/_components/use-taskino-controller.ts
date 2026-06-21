"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import {
  getId,
  UNAUTHORIZED_EVENT,
  type FixedTask,
  type LeaveRequest,
  type LeaveRequestStatistics,
  type ManagerStats,
  type MonthlyPerformance,
  type MyProgressStats,
  type MyWorkSummary,
  type Notification,
  type Project,
  type StatusCounts,
  type SupervisorMember,
  type SupervisorStats,
  type SupervisorTaskStatistics,
  type Task,
  type TaskStatusOverview,
  type User,
  type UserProgress,
  type UserTaskCount,
} from "@/lib/api";

import {
  VIEW_PATHS,
  type Priority,
  type TaskPeriod,
  type View,
} from "../_lib/task-constants";
import { useDataLoader } from "./use-data-loader";
import { useFixedTaskActions } from "./use-fixed-task-actions";
import { useLeaveActions } from "./use-leave-actions";
import { useTaskActions } from "./use-task-actions";
import { useTaskinoDerivedData } from "./use-taskino-derived-data";
import { useTaskinoExcel } from "./use-taskino-excel";
import { useTaskinoNotifications } from "./use-taskino-notifications";
import { useTeamActions } from "./use-team-actions";

const darkModeStorageKey = "taskino-dark-mode";

export function useTaskinoController(initialView: View = "dashboard") {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  // ─── Shared state ──────────────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [authHydrated, setAuthHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveStatistics, setLeaveStatistics] =
    useState<LeaveRequestStatistics | null>(null);
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([]);
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [managerTaskStatus, setManagerTaskStatus] =
    useState<TaskStatusOverview | null>(null);
  const [managerUserCounts, setManagerUserCounts] = useState<UserTaskCount[]>(
    [],
  );
  const [managerMonthlyPerf, setManagerMonthlyPerf] = useState<
    MonthlyPerformance[]
  >([]);
  const [managerUserProgress, setManagerUserProgress] = useState<
    UserProgress[]
  >([]);
  const [supervisorStats, setSupervisorStats] =
    useState<SupervisorStats | null>(null);
  const [supervisorTaskStatistics, setSupervisorTaskStatistics] =
    useState<SupervisorTaskStatistics | null>(null);
  const [supervisorTasks, setSupervisorTasks] = useState<Task[]>([]);
  const [supervisorFixedTasks, setSupervisorFixedTasks] = useState<FixedTask[]>(
    [],
  );
  const [supervisorMembers, setSupervisorMembers] = useState<
    SupervisorMember[]
  >([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [specialistTaskCounts, setSpecialistTaskCounts] =
    useState<StatusCounts | null>(null);
  const [specialistFixedTaskCounts, setSpecialistFixedTaskCounts] =
    useState<StatusCounts | null>(null);
  const [specialistProgressStats, setSpecialistProgressStats] =
    useState<MyProgressStats | null>(null);
  const [specialistWorkSummary, setSpecialistWorkSummary] =
    useState<MyWorkSummary | null>(null);

  // ─── UI / navigation state ─────────────────────────────────────────────────
  const [activeViewState, setActiveViewState] = useState<View>(initialView);
  const [taskQuery, setTaskQuery] = useState("");
  const [specialistSearchQuery, setSpecialistSearchQuery] = useState("");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [boardShowAll, setBoardShowAll] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<
    Priority | ""
  >("");
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<
    TaskPeriod | ""
  >("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(darkModeStorageKey) === "true";
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedFixedTask, setSelectedFixedTask] = useState<FixedTask | null>(
    null,
  );
  const [taskPriorities, setTaskPriorities] = useState<
    Record<string, Priority>
  >({});

  const routeView =
    (Object.entries(VIEW_PATHS).find(([, path]) => path === pathname)?.[0] as
      | View
      | undefined) ?? (pathname === "/" ? "dashboard" : undefined);
  const activeView = routeView ?? activeViewState;
  const myId = getId(currentUser ?? undefined);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(darkModeStorageKey, String(darkMode));
  }, [darkMode]);

  function setActiveView(view: View) {
    setActiveViewState(view);
    router.push(VIEW_PATHS[view]);
  }

  useEffect(() => {
    queueMicrotask(() => {
      const t = localStorage.getItem("taskino-token") ?? "";
      const u = localStorage.getItem("taskino-user");
      if (t) setToken(t);
      if (u) setCurrentUser(JSON.parse(u) as User);
      setAuthHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!token && !isAuthRoute) router.replace("/login");
    if (token && isAuthRoute) router.replace(VIEW_PATHS[activeView]);
  }, [activeView, authHydrated, isAuthRoute, router, token]);

  // ─── Notifications (defined early so setters are available for data loader) ─
  const {
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    popupNotif,
    resetNotifications,
    setNotifications,
    setPopupNotif,
    setShowNotifications,
    setUnreadCount,
    showNotifications,
    unreadCount,
  } = useTaskinoNotifications({
    isManager: currentUser?.roles === "manager",
    setError,
    setMessage,
    token,
  });

  // ─── Data loader ───────────────────────────────────────────────────────────
  const {
    loadData,
    loadManagerAnalytics,
    loadSupervisorData,
    loadSelectedSpecialistFixedTasks,
  } = useDataLoader({
    token,
    currentUser,
    myId,
    setLoadingData,
    setError,
    setUsers,
    setTasks,
    setLeaveRequests,
    setLeaveStatistics,
    setSpecialistTaskCounts,
    setSpecialistFixedTaskCounts,
    setSpecialistProgressStats,
    setSpecialistWorkSummary,
    setManagerStats,
    setUnreadCount,
    setNotifications,
    setFixedTasks,
    setManagerTaskStatus,
    setManagerUserCounts,
    setManagerMonthlyPerf,
    setManagerUserProgress,
    setSupervisorStats,
    setSupervisorTaskStatistics,
    setSupervisorMembers,
    setSupervisorTasks,
    setSupervisorFixedTasks,
    setOverdueTasks,
    setTeamPerformance,
  });

  // ─── Task actions ──────────────────────────────────────────────────────────
  const taskActions = useTaskActions({
    token,
    myId,
    tasks,
    selectedTask,
    setTasks,
    setSelectedTask,
    setError,
    setMessage,
    loadData,
  });

  // ─── Leave actions ─────────────────────────────────────────────────────────
  const leaveActions = useLeaveActions({
    token,
    myId,
    isManager: currentUser?.roles === "manager",
    setError,
    setMessage,
    loadData,
  });

  // ─── Team / user management actions ───────────────────────────────────────
  const teamActions = useTeamActions({
    token,
    myId,
    currentUser,
    setCurrentUser,
    setError,
    setMessage,
    loadData,
  });

  // ─── Excel ─────────────────────────────────────────────────────────────────
  const {
    deleteExcelFile,
    downloadExcelFile,
    excelFiles,
    excelStats,
    excelUploading,
    exportTasksToExcel,
    handleExcelUpload,
    loadExcelData,
    processExcelFile,
    resetExcelData,
  } = useTaskinoExcel({
    activeView,
    myId,
    setError,
    setMessage,
    tasks,
    token,
  });

  // ─── Fixed task actions ────────────────────────────────────────────────────
  const {
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
    activateFixedTask,
    deactivateFixedTask,
  } = useFixedTaskActions({
    fixedTasks,
    loadData,
    loadManagerAnalytics,
    myId,
    users,
    setError,
    setFixedTasks,
    setMessage,
    token,
  });

  // ─── Derived data ──────────────────────────────────────────────────────────
  const {
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
    progress,
    statsProjects,
    statsUsers,
    supervisorInProgressReports,
    supervisorOwnDoneReports,
    supervisorProjectDoneReports,
    teamAssigneeCount,
    teamAssignees,
    todoCount,
  } = useTaskinoDerivedData({
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
  });

  // ─── Side effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!error && !message) return;
    const id = window.setTimeout(() => {
      setError("");
      setMessage("");
    }, 3500);
    return () => window.clearTimeout(id);
  }, [error, message]);

  useEffect(() => {
    queueMicrotask(() => {
      setSpecialistSearchQuery("");
      setSelectedSpecialistId("");
      taskActions.setShowNewProjectForm(false);
    });
  }, [pathname]);

  const loadLatestData = useEffectEvent(loadData);
  const loadLatestManagerAnalytics = useEffectEvent(loadManagerAnalytics);
  const loadLatestSpecialistFixedTasks = useEffectEvent(
    loadSelectedSpecialistFixedTasks,
  );

  useEffect(() => {
    queueMicrotask(() => void loadLatestData());
  }, [token]);

  useEffect(() => {
    if (!authHydrated || !token) return;
    const role = currentUser?.roles;
    if (role !== "supervisor" && role !== "manager") return;

    if (!selectedSpecialistId) {
      if (role === "supervisor") {
        if (activeView === "supervisor-create-report") {
          queueMicrotask(() => setFixedTasks(supervisorFixedTasks));
        } else if (!myId) {
          queueMicrotask(() => setFixedTasks(supervisorFixedTasks));
        } else {
          void loadLatestSpecialistFixedTasks(token, myId)
            .then((r) => setFixedTasks(r))
            .catch(() => setFixedTasks(supervisorFixedTasks));
        }
      } else {
        void loadLatestManagerAnalytics(token);
      }
      return;
    }

    void loadLatestSpecialistFixedTasks(token, selectedSpecialistId)
      .then((r) => setFixedTasks(r))
      .catch(() => setFixedTasks([]));
  }, [
    authHydrated,
    activeView,
    currentUser?.roles,
    myId,
    selectedSpecialistId,
    supervisorFixedTasks,
    token,
  ]);

  // ─── Logout ────────────────────────────────────────────────────────────────
  function logout() {
    setToken("");
    setCurrentUser(null);
    setUsers([]);
    setTasks([]);
    setProjects([]);
    resetNotifications();
    setLeaveRequests([]);
    setManagerStats(null);
    resetExcelData();
    setSupervisorStats(null);
    setSupervisorTaskStatistics(null);
    setSupervisorTasks([]);
    setSupervisorFixedTasks([]);
    setSupervisorMembers([]);
    setOverdueTasks([]);
    setTeamPerformance(null);
    setSpecialistTaskCounts(null);
    setSpecialistFixedTaskCounts(null);
    setSpecialistProgressStats(null);
    setActiveViewState("dashboard");
    localStorage.removeItem("taskino-token");
    localStorage.removeItem("taskino-user");
    router.push("/login");
  }

  const handleUnauthorized = useEffectEvent(() => {
    logout();
  });

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  // ─── Page context ──────────────────────────────────────────────────────────
  return {
    // Session
    token,
    authHydrated,
    currentUser,
    myId,
    isManager,
    isSupervisor,
    isSpecialist,
    setToken,
    setAuthHydrated,
    setCurrentUser,
    logout,

    // Feedback
    loadingData,
    error,
    message,
    setLoadingData,
    setError,
    setMessage,

    // Navigation / UI
    activeView,
    setActiveView,
    setActiveViewState,
    taskQuery,
    setTaskQuery,
    specialistSearchQuery,
    setSpecialistSearchQuery,
    selectedSpecialistId,
    setSelectedSpecialistId,
    boardShowAll,
    setBoardShowAll,
    selectedProjectFilter,
    setSelectedProjectFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedAssigneeFilter,
    setSelectedAssigneeFilter,
    selectedPriorityFilter,
    setSelectedPriorityFilter,
    selectedPeriodFilter,
    setSelectedPeriodFilter,
    sidebarCollapsed,
    setSidebarCollapsed,
    darkMode,
    setDarkMode,
    selectedTask,
    setSelectedTask,
    selectedFixedTask,
    setSelectedFixedTask,
    taskPriorities,
    setTaskPriorities,

    // Data
    users,
    tasks,
    projects,
    leaveRequests,
    leaveStatistics,
    fixedTasks,
    managerStats,
    managerTaskStatus,
    managerUserCounts,
    managerMonthlyPerf,
    managerUserProgress,
    supervisorStats,
    supervisorTaskStatistics,
    supervisorTasks,
    supervisorFixedTasks,
    supervisorMembers,
    overdueTasks,
    teamPerformance,
    specialistTaskCounts,
    specialistFixedTaskCounts,
    specialistProgressStats,
    specialistWorkSummary,
    setUsers,
    setTasks,
    setProjects,
    setLeaveRequests,
    setFixedTasks,
    setManagerStats,
    setManagerTaskStatus,
    setManagerUserCounts,
    setManagerMonthlyPerf,
    setManagerUserProgress,
    setSupervisorStats,
    setSupervisorTaskStatistics,
    setSupervisorTasks,
    setSupervisorFixedTasks,
    setSupervisorMembers,
    setOverdueTasks,
    setTeamPerformance,
    setSpecialistTaskCounts,
    setSpecialistFixedTaskCounts,
    setSpecialistProgressStats,
    setSpecialistWorkSummary,

    // Derived
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
    progress,
    statsProjects,
    statsUsers,
    supervisorInProgressReports,
    supervisorOwnDoneReports,
    supervisorProjectDoneReports,
    teamAssigneeCount,
    teamAssignees,
    todoCount,

    // Data loading
    loadData,
    loadManagerAnalytics,
    loadSupervisorData,

    // Task actions
    ...taskActions,

    // Leave actions
    ...leaveActions,

    // Team actions
    ...teamActions,

    // Notifications
    notifications,
    unreadCount,
    popupNotif,
    showNotifications,
    setNotifications,
    setUnreadCount,
    setPopupNotif,
    setShowNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Excel
    excelFiles,
    excelStats,
    excelUploading,
    loadExcelData,
    handleExcelUpload,
    downloadExcelFile,
    processExcelFile,
    deleteExcelFile,
    exportTasksToExcel,

    // Fixed task actions
    fixedReportsTab,
    setFixedReportsTab,
    showFixedTaskForm,
    editingFixedTask,
    ftTitle,
    setFtTitle,
    ftAssignee,
    setFtAssignee,
    ftRecurrence,
    setFtRecurrence,
    ftDescription,
    setFtDescription,
    ftActive,
    setFtActive,
    ftNextRunAt,
    setFtNextRunAt,
    openFixedTaskForm,
    closeFixedTaskForm,
    saveFixedTask,
    saveFixedTaskFromValues,
    activateFixedTask,
    deactivateFixedTask,
    deleteFixedTask,
    seedFixedTasksFromExcel,
    onDragEnd,
    moveFixedTask,
  };
}

export type TaskinoController = ReturnType<typeof useTaskinoController>;
