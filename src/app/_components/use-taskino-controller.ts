"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useEffectEvent, useState } from "react";
import {
  fixedTaskApi,
  getId,
  leaveApi,
  managerApi,
  normalizeList,
  notificationApi,
  supervisorApi,
  taskApi,
  type FixedTask,
  userApi,
  type LeaveRequest,
  type ManagerStats,
  type ManagerAllTasks,
  type UserProgress,
  type MonthlyPerformance,
  type Notification,
  type Project,
  type SupervisorMember,
  type SupervisorStats,
  type Task,
  type TaskStatusOverview,
  type User,
  type UserTaskCount,
} from "@/lib/api";

import {
  VIEW_PATHS,
  type Priority,
  type TaskPeriod,
  type View,
} from "../_lib/task-constants";
import { taskinoPageDependencies } from "./taskino-page-dependencies";
import { useFixedTaskActions } from "./use-fixed-task-actions";
import { useTaskinoDerivedData } from "./use-taskino-derived-data";
import { useTaskinoExcel } from "./use-taskino-excel";
import { useTaskinoNotifications } from "./use-taskino-notifications";
export function useTaskinoController(initialView: View = "dashboard") {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const [token, setToken] = useState("");
  const [authHydrated, setAuthHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskRecurrence, setTaskRecurrence] = useState("");
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  // Tasks-admin view
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
  const [taskQuery, setTaskQuery] = useState("");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [teamSearchResult, setTeamSearchResult] = useState<User[] | null>(null);
  const [teamSearching, setTeamSearching] = useState(false);

  // API data
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [boardShowAll, setBoardShowAll] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([]);

  // Manager analytics state
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

  // Supervisor state
  const [supervisorStats, setSupervisorStats] =
    useState<SupervisorStats | null>(null);
  const [supervisorTasks, setSupervisorTasks] = useState<Task[]>([]);
  const [supervisorFixedTasks, setSupervisorFixedTasks] = useState<FixedTask[]>(
    [],
  );
  const [supervisorMembers, setSupervisorMembers] = useState<
    SupervisorMember[]
  >([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any>(null);

  // UI state
  const [activeViewState, setActiveViewState] = useState<View>(initialView);
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
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskPriorities, setTaskPriorities] = useState<
    Record<string, Priority>
  >({});
  const routeView =
    (Object.entries(VIEW_PATHS).find(([, path]) => path === pathname)?.[0] as
      | View
      | undefined) ?? (pathname === "/" ? "dashboard" : undefined);
  const activeView = routeView ?? activeViewState;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
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

  const {
    activeTasks,
    doneTasks,
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
    supervisorStats,
    taskPriorities,
    taskQuery,
    tasks,
    teamPerformance,
    users,
  });
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
    isManager,
    setError,
    setMessage,
    token,
  });
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
  } = useFixedTaskActions({
    fixedTasks,
    loadData,
    loadManagerAnalytics,
    myId,
    setError,
    setFixedTasks,
    setMessage,
    token,
  });

  useEffect(() => {
    if (!error && !message) return;
    const id = window.setTimeout(() => {
      setError("");
      setMessage("");
    }, 3500);
    return () => window.clearTimeout(id);
  }, [error, message]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoadingData(true);
    setError("");
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("taskino-user") ?? "{}",
      ) as User;
      const uid = myId || getId(storedUser);
      const currentRole = (currentUser ?? storedUser)?.roles;
      const userIsManager = currentRole === "manager";
      const userIsSupervisor = currentRole === "supervisor";
      const reportParams =
        !userIsManager && !userIsSupervisor && uid
          ? { assignedTo: uid }
          : undefined;
      const [u, t, leaves, statsRes, unreadRes, notifRes] = await Promise.all([
        userIsManager
          ? managerApi.users(authToken, { limit: 100 }).catch(() => [])
          : Promise.resolve([] as User[]),
        userIsManager
          ? managerApi
              .allTasks(authToken)
              .catch(() => ({ tasks: [] as Task[] }))
          : userIsSupervisor
            ? Promise.resolve([] as Task[])
            : taskApi.list(authToken, reportParams).catch(() => []),
        uid && !userIsManager && !userIsSupervisor
          ? leaveApi.list(authToken, { limit: 50, user: uid })
          : leaveApi.list(authToken, { limit: 50 }),
        userIsManager
          ? managerApi.statistics(authToken).catch(() => null)
          : Promise.resolve(null),
        notificationApi
          .unreadCount(authToken)
          .catch(() => ({ unreadCount: 0 })),
        notificationApi
          .list(authToken, { isRead: false, limit: 20 })
          .catch(() => []),
      ]);
      const taskList = normalizeList(
        ((t as ManagerAllTasks)?.tasks ?? t) as Task[] | { data?: Task[] },
      );
      setUsers(normalizeList(u));
      setTasks(taskList);
      setLeaveRequests(normalizeList(leaves));
      setManagerStats(statsRes);
      setUnreadCount(unreadRes.unreadCount);
      setNotifications(
        normalizeList(notifRes as Notification[] | { data?: Notification[] }),
      );
      const role = (currentUser ?? storedUser)?.roles;
      if (role === "manager") void loadManagerAnalytics(authToken);
      else if (role !== "supervisor" && uid) {
        // Specialist: public per-user endpoint (no role restriction).
        fetchAllSpecialistFixedTasks(authToken, uid)
          .then((r) => setFixedTasks(r))
          .catch(() => setFixedTasks([]));
      } else {
        setFixedTasks([]);
      }
      if (role === "supervisor") void loadSupervisorData(authToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ø¯Ø±ÛŒØ§ÙØª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯",
      );
    } finally {
      setLoadingData(false);
    }
  }

  // Fetch all fixed tasks across pages (the API caps page size, so loop until we have them all).
  async function fetchAllFixedTasks(
    authToken: string,
    base: Record<string, string | number | boolean | undefined> = {},
  ) {
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const res = await fixedTaskApi
        .list(authToken, { ...base, page, limit })
        .catch(() => null);
      if (!res) break;
      const list = normalizeList(res as FixedTask[] | { data?: FixedTask[] });
      all.push(...list);
      const total =
        res &&
        typeof res === "object" &&
        "total" in (res as Record<string, unknown>)
          ? Number((res as Record<string, unknown>).total)
          : all.length;
      if (list.length === 0 || all.length >= total) break;
    }
    return all;
  }

  // Specialist's own fixed tasks via the public per-user endpoint, across pages.
  async function fetchAllSpecialistFixedTasks(
    authToken: string,
    userId: string,
  ) {
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const res = await fixedTaskApi
        .bySpecialist(authToken, userId, { page, limit })
        .catch(() => null);
      if (!res) break;
      const list = normalizeList(res as FixedTask[] | { data?: FixedTask[] });
      all.push(...list);
      const total =
        res &&
        typeof res === "object" &&
        "total" in (res as Record<string, unknown>)
          ? Number((res as Record<string, unknown>).total)
          : all.length;
      if (list.length === 0 || all.length >= total) break;
    }
    return all;
  }

  async function loadManagerAnalytics(authToken = token) {
    if (!authToken) return;
    try {
      const [taskStatus, userCounts, monthlyPerf, recurring, progress] =
        await Promise.all([
          managerApi.taskStatusOverview(authToken).catch(() => null),
          managerApi.taskCountsByUsers(authToken).catch(() => []),
          managerApi.monthlyPerformance(authToken).catch(() => []),
          fetchAllFixedTasks(authToken).catch(() => [] as FixedTask[]),
          managerApi.usersProgress(authToken).catch(() => []),
        ]);
      setManagerTaskStatus(taskStatus);
      setManagerUserCounts(
        normalizeList(
          userCounts as UserTaskCount[] | { data?: UserTaskCount[] },
        ),
      );
      const monthlyRaw = monthlyPerf as any;
      setManagerMonthlyPerf(
        monthlyRaw?.users
          ? monthlyRaw.users
          : normalizeList(
              monthlyRaw as
                | MonthlyPerformance[]
                | { data?: MonthlyPerformance[] },
            ),
      );
      setFixedTasks(recurring as FixedTask[]);
      setManagerUserProgress(
        normalizeList(progress as UserProgress[] | { data?: UserProgress[] }),
      );
    } catch {}
  }

  async function loadSupervisorData(authToken = token) {
    if (!authToken) return;
    try {
      const [stats, membersResponse, tasksResponse, fixedTasksResponse] =
        await Promise.all([
          supervisorApi.statistics(authToken).catch(() => null),
          supervisorApi
            .members(authToken, { page: 1, limit: 100 })
            .catch(() => []),
          supervisorApi
            .tasks(authToken, { page: 1, limit: 100 })
            .catch(() => []),
          supervisorApi
            .fixedTasks(authToken, { page: 1, limit: 100 })
            .catch(() => []),
        ]);
      const members = normalizeList(
        membersResponse as SupervisorMember[] | { data?: SupervisorMember[] },
      );
      const supervisedTasks = normalizeList(
        tasksResponse as Task[] | { data?: Task[] },
      );
      const supervisedFixedTasks = normalizeList(
        fixedTasksResponse as FixedTask[] | { data?: FixedTask[] },
      );
      const now = Date.now();
      const overdue = supervisedTasks.filter(
        (task) =>
          task.status !== "done" &&
          !!task.dueDate &&
          new Date(task.dueDate).getTime() < now,
      );
      const completedWork = members.reduce(
        (sum, member) =>
          sum +
          (member.completedTasks ?? 0) +
          (member.completedFixedTasks ?? 0),
        0,
      );
      const totalWork = members.reduce(
        (sum, member) =>
          sum + (member.totalTasks ?? 0) + (member.totalFixedTasks ?? 0),
        0,
      );

      setSupervisorStats(stats);
      setSupervisorMembers(members);
      setSupervisorTasks(supervisedTasks);
      setSupervisorFixedTasks(supervisedFixedTasks);
      setTasks(supervisedTasks);
      setFixedTasks(supervisedFixedTasks);
      setOverdueTasks(overdue);
      setManagerUserProgress(members as UserProgress[]);
      setUsers(
        members.map((member) => ({
          _id: member.userId,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          mobile: member.mobile,
          roles: member.role,
          isActive: member.isActive,
          score: member.score,
          performanceStatus: member.performanceStatus,
          progressPercentage: member.progressPercentage,
        })),
      );
      setTeamPerformance({
        members,
        memberCount: members.length,
        completionRate: totalWork
          ? Math.round((completedWork / totalWork) * 100)
          : 0,
      });
    } catch {}
  }

  const loadLatestData = useEffectEvent(loadData);

  useEffect(() => {
    queueMicrotask(() => void loadLatestData());
  }, [token]);

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId || !taskTitle.trim()) return;
    // Backend requires exactly one assignee; fall back to the current user.
    const assignee = taskAssignee || myId;
    const body = {
      title: taskTitle.trim(),
      assignedTo: [assignee],
      status: "todo",
      ...(taskRecurrence ? { recurrence: taskRecurrence } : {}),
    };
    try {
      await taskApi.create(token, body, taskFile ?? undefined);
      setTaskTitle("");
      setTaskAssignee("");
      setTaskProjectId("");
      setTaskRecurrence("");
      setTaskFile(null);
      setShowNewProjectForm(false);
      setMessage("Ú¯Ø²Ø§Ø±Ø´ Ø¬Ø¯ÛŒØ¯ Ø³Ø§Ø®ØªÙ‡ Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø³Ø§Ø®Øª Ú¯Ø²Ø§Ø±Ø´ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function claimTask(taskId: string) {
    if (!myId) return;
    try {
      const updated = await taskApi.update(token, taskId, {
        assignedTo: [myId],
      });
      setTasks((prev) => prev.map((t) => (getId(t) === taskId ? updated : t)));
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask(updated);
      setMessage("Ú¯Ø²Ø§Ø±Ø´ Ø¨Ø±Ø§ÛŒ Ø´Ù…Ø§ Ø§Ø³Ø§ÛŒÙ† Ø´Ø¯.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø§Ø³Ø§ÛŒÙ† Ú¯Ø²Ø§Ø±Ø´ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function moveTask(taskId: string, newStatus: string) {
    try {
      await taskApi.updateStatus(token, taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) =>
          getId(t) === taskId ? { ...t, status: newStatus } : t,
        ),
      );
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask((prev) =>
          prev ? { ...prev, status: newStatus } : prev,
        );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ØªØºÛŒÛŒØ± ÙˆØ¶Ø¹ÛŒØª Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
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
      setMessage("Ú¯Ø²Ø§Ø±Ø´ Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ú¯Ø²Ø§Ø±Ø´ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯",
      );
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await taskApi.delete(token, taskId);
      setTasks((prev) => prev.filter((t) => getId(t) !== taskId));
      setSelectedTask(null);
      setMessage("Ú¯Ø²Ø§Ø±Ø´ Ø­Ø°Ù Ø´Ø¯.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø­Ø°Ù Ú¯Ø²Ø§Ø±Ø´ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function taLookupTasks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taLookupFirst.trim() || !taLookupLast.trim()) {
      setError("Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.");
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
      setError(err instanceof Error ? err.message : "Ø¬Ø³ØªØ¬Ùˆ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
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
      setError(err instanceof Error ? err.message : "Ø¯Ø±ÛŒØ§ÙØª Ø¢Ù…Ø§Ø± Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
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
      setError(err instanceof Error ? err.message : "Ø¯Ø±ÛŒØ§ÙØª ØªØ¹Ø¯Ø§Ø¯ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function createLeaveRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      await loadData();
      setMessage("Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ù…Ø±Ø®ØµÛŒ Ø«Ø¨Øª Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø«Ø¨Øª Ù…Ø±Ø®ØµÛŒ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function handleLeaveAction(id: string, action: "approve" | "reject") {
    if (!myId) return;
    if (action === "reject") {
      setRejectLeaveId(id);
      return;
    }
    try {
      await leaveApi.approve(token, id, myId);
      setMessage("Ù…Ø±Ø®ØµÛŒ ØªØ£ÛŒÛŒØ¯ Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø¹Ù…Ù„ÛŒØ§Øª Ù…Ø±Ø®ØµÛŒ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function confirmRejectLeave() {
    if (!myId || !rejectLeaveId || !rejectReason.trim()) return;
    try {
      await leaveApi.reject(token, rejectLeaveId, myId, rejectReason.trim());
      setRejectLeaveId(null);
      setRejectReason("");
      setMessage("Ù…Ø±Ø®ØµÛŒ Ø±Ø¯ Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø±Ø¯ Ù…Ø±Ø®ØµÛŒ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      await managerApi.updateUserRole(token, userId, role);
      setMessage("Ù†Ù‚Ø´ Ú©Ø§Ø±Ø¨Ø± Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ØªØºÛŒÛŒØ± Ù†Ù‚Ø´ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function approveUser(userId: string) {
    try {
      await userApi.approve(token, userId);
      setMessage("Ú©Ø§Ø±Ø¨Ø± ØªØ£ÛŒÛŒØ¯ Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ØªØ£ÛŒÛŒØ¯ Ú©Ø§Ø±Ø¨Ø± Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Ø­Ø°Ù Ø§ÛŒÙ† Ú©Ø§Ø±Ø¨Ø±ØŸ Ø§ÛŒÙ† Ø¹Ù…Ù„ Ù‚Ø§Ø¨Ù„ Ø¨Ø§Ø²Ú¯Ø´Øª Ù†ÛŒØ³Øª.")) return;
    try {
      await userApi.delete(token, userId);
      setMessage("Ú©Ø§Ø±Ø¨Ø± Ø­Ø°Ù Ø´Ø¯.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø­Ø°Ù Ú©Ø§Ø±Ø¨Ø± Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function searchTeamUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parts: string[] = [];
    if (parts.length < 2) {
      setError("Ù†Ø§Ù… Ùˆ Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø±Ø§ Ø¨Ø§ ÙØ§ØµÙ„Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.");
      return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    setTeamSearching(true);
    try {
      const found = await managerApi.findUserByName(token, firstName, lastName);
      setTeamSearchResult(found ? [found] : []);
    } catch {
      setTeamSearchResult([]);
    } finally {
      setTeamSearching(false);
    }
  }

  function clearTeamSearch() {
    setTeamSearchResult(null);
  }

  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const created = await userApi.create(token, {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        workField: "operations",
      });
      // Role can't be set at creation; apply it afterwards if non-default.
      if (false) {
        const newId = getId(created);
        if (newId)
          await managerApi
            .updateUserRole(token, newId, "specialist")
            .catch(() => {});
      }
      setMessage("Ú©Ø§Ø±Ø¨Ø± Ø¬Ø¯ÛŒØ¯ Ø³Ø§Ø®ØªÙ‡ Ø´Ø¯.");
      setShowNewUserForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø³Ø§Ø®Øª Ú©Ø§Ø±Ø¨Ø± Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      const updated = await userApi.update(token, myId, {
        firstName: currentUser?.firstName ?? "",
        lastName: currentUser?.lastName ?? "",
        email: currentUser?.email ?? "",
      });
      setCurrentUser(updated);
      localStorage.setItem("taskino-user", JSON.stringify(updated));
      setMessage("Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯");
    }
  }

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
    setSupervisorTasks([]);
    setSupervisorFixedTasks([]);
    setSupervisorMembers([]);
    setOverdueTasks([]);
    setTeamPerformance(null);
    setActiveViewState("dashboard");
    localStorage.removeItem("taskino-token");
    localStorage.removeItem("taskino-user");
    router.push("/login");
  }

  // â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageContext = {
    ...taskinoPageDependencies,
    token,
    authHydrated,
    currentUser,
    loadingData,
    error,
    message,
    users,
    tasks,
    projects,
    taskTitle,
    taskAssignee,
    taskProjectId,
    taskRecurrence,
    taskFile,
    showNewProjectForm,
    taLookupFirst,
    taLookupLast,
    taLookupResult,
    taCompletionExpert,
    taCompletionResult,
    taCountUser,
    taCountStart,
    taCountEnd,
    taCountResult,
    taskQuery,
    showNewUserForm,
    teamSearchResult,
    teamSearching,
    managerStats,
    notifications,
    unreadCount,
    popupNotif,
    rejectLeaveId,
    rejectReason,
    boardShowAll,
    leaveRequests,
    excelFiles,
    excelStats,
    excelUploading,
    fixedTasks,
    incompleteFixedTasks,
    fixedReportsTab,
    showFixedTaskForm,
    editingFixedTask,
    ftTitle,
    ftAssignee,
    ftRecurrence,
    ftDescription,
    ftActive,
    ftNextRunAt,
    managerTaskStatus,
    managerUserCounts,
    managerMonthlyPerf,
    managerUserProgress,
    supervisorStats,
    supervisorTasks,
    supervisorFixedTasks,
    supervisorMembers,
    overdueTasks,
    teamPerformance,
    activeView,
    selectedProjectFilter,
    selectedStatusFilter,
    selectedAssigneeFilter,
    selectedPriorityFilter,
    selectedPeriodFilter,
    showNotifications,
    sidebarCollapsed,
    darkMode,
    selectedTask,
    taskPriorities,
    setToken,
    setAuthHydrated,
    setCurrentUser,
    setLoadingData,
    setError,
    setMessage,
    setUsers,
    setTasks,
    setProjects,
    setTaskTitle,
    setTaskAssignee,
    setTaskProjectId,
    setTaskRecurrence,
    setTaskFile,
    setShowNewProjectForm,
    setTaLookupFirst,
    setTaLookupLast,
    setTaLookupResult,
    setTaCompletionExpert,
    setTaCompletionResult,
    setTaCountUser,
    setTaCountStart,
    setTaCountEnd,
    setTaCountResult,
    setTaskQuery,
    setShowNewUserForm,
    setTeamSearchResult,
    setTeamSearching,
    setManagerStats,
    setNotifications,
    setUnreadCount,
    setPopupNotif,
    setRejectLeaveId,
    setRejectReason,
    setBoardShowAll,
    setLeaveRequests,
    setFixedTasks,
    setFixedReportsTab,
    setFtTitle,
    setFtAssignee,
    setFtRecurrence,
    setFtDescription,
    setFtActive,
    setFtNextRunAt,
    setManagerTaskStatus,
    setManagerUserCounts,
    setManagerMonthlyPerf,
    setManagerUserProgress,
    setSupervisorStats,
    setSupervisorTasks,
    setSupervisorFixedTasks,
    setSupervisorMembers,
    setOverdueTasks,
    setTeamPerformance,
    setActiveView,
    setActiveViewState,
    setSelectedProjectFilter,
    setSelectedStatusFilter,
    setSelectedAssigneeFilter,
    setSelectedPriorityFilter,
    setSelectedPeriodFilter,
    setShowNotifications,
    setSidebarCollapsed,
    setDarkMode,
    setSelectedTask,
    setTaskPriorities,
    myId,
    isManager,
    isSupervisor,
    isSpecialist,
    doneTasks,
    activeTasks,
    inProgressTasks,
    todoCount,
    progress,
    statsProjects,
    statsUsers,
    supervisorInProgressReports,
    supervisorProjectDoneReports,
    supervisorOwnDoneReports,
    teamAssignees,
    teamAssigneeCount,
    filteredTasks,
    filteredFixedTemplates,
    loadData,
    loadManagerAnalytics,
    loadSupervisorData,
    createTask,
    claimTask,
    moveTask,
    updateTask,
    deleteTask,
    taLookupTasks,
    taRunCompletionStats,
    taRunDateCount,
    markNotificationRead,
    markAllNotificationsRead,
    createLeaveRequest,
    handleLeaveAction,
    confirmRejectLeave,
    updateUserRole,
    approveUser,
    deleteUser,
    searchTeamUser,
    clearTeamSearch,
    createUser,
    saveProfile,
    loadExcelData,
    handleExcelUpload,
    downloadExcelFile,
    processExcelFile,
    deleteExcelFile,
    openFixedTaskForm,
    closeFixedTaskForm,
    saveFixedTask,
    toggleFixedTaskActive,
    deleteFixedTask,
    seedFixedTasksFromExcel,
    exportTasksToExcel,
    onDragEnd,
    moveFixedTask,
    logout,
  };

  return pageContext;
}

export type TaskinoController = ReturnType<typeof useTaskinoController>;


