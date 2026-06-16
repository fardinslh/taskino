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
  UNAUTHORIZED_EVENT,
  type FixedTask,
  userApi,
  type LeaveRequest,
  type LeaveRequestStatistics,
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
  type MyProgressStats,
  type StatusCounts,
  type UserTaskCount,
} from "@/lib/api";

import {
  VIEW_PATHS,
  type Priority,
  type TaskPeriod,
  type View,
} from "../_lib/task-constants";
import { useFixedTaskActions } from "./use-fixed-task-actions";
import { useTaskinoDerivedData } from "./use-taskino-derived-data";
import { useTaskinoExcel } from "./use-taskino-excel";
import { useTaskinoNotifications } from "./use-taskino-notifications";

type CreateTaskValues = {
  title: string;
  assignee?: string;
  recurrence?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
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

const darkModeStorageKey = "taskino-dark-mode";

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
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskEndTime, setTaskEndTime] = useState("");
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
  const [specialistSearchQuery, setSpecialistSearchQuery] = useState("");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [teamSearchResult, setTeamSearchResult] = useState<User[] | null>(null);
  const [teamSearching, setTeamSearching] = useState(false);

  // API data
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [boardShowAll, setBoardShowAll] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveStatistics, setLeaveStatistics] =
    useState<LeaveRequestStatistics | null>(null);
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
  const [specialistTaskCounts, setSpecialistTaskCounts] =
    useState<StatusCounts | null>(null);
  const [specialistFixedTaskCounts, setSpecialistFixedTaskCounts] =
    useState<StatusCounts | null>(null);
  const [specialistProgressStats, setSpecialistProgressStats] =
    useState<MyProgressStats | null>(null);

  function dedupeFixedTasks(items: FixedTask[]) {
    const seen = new Set<string>();
    const result: FixedTask[] = [];

    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index];
      const id = getId(item);

      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      result.push(item);
    }

    return result.reverse();
  }

  const setFixedTasksDeduped: typeof setFixedTasks = (value) => {
    setFixedTasks((current) =>
      dedupeFixedTasks(typeof value === "function" ? value(current) : value),
    );
  };

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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(darkModeStorageKey) === "true";
  });
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

  useEffect(() => {
    queueMicrotask(() => {
      setSpecialistSearchQuery("");
      setSelectedSpecialistId("");
      setShowNewProjectForm(false);
    });
  }, [pathname]);

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
    specialistSearchQuery,
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
    setFixedTasks: setFixedTasksDeduped,
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
      const userIsSpecialist = currentRole === "specialist";
      const shouldLoadLeaveStats =
        currentRole === "manager" || currentRole === "supervisor";
      const reportParams =
        !userIsManager && !userIsSupervisor && uid
          ? { assignedTo: uid }
          : undefined;
      const [u, t, leaves, statsRes, unreadRes, notifRes, leaveStatsRes] =
        await Promise.all([
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
          shouldLoadLeaveStats
            ? leaveApi.statistics(authToken).catch(() => null)
            : Promise.resolve(null),
        ]);
      const [specialistTaskCountsRes, specialistFixedTaskCountsRes, specialistProgressRes] =
        userIsSpecialist
          ? await Promise.all([
              taskApi.statusCounts(authToken).catch(() => null),
              fixedTaskApi.statusCounts(authToken).catch(() => null),
              userApi.meProgress(authToken).catch(() => null),
            ])
          : [null, null, null];
      const taskList = normalizeList(
        ((t as ManagerAllTasks)?.tasks ?? t) as Task[] | { data?: Task[] },
      );
      setUsers(normalizeList(u));
      setTasks(taskList);
      setLeaveRequests(normalizeList(leaves));
      setLeaveStatistics(leaveStatsRes);
      setSpecialistTaskCounts(specialistTaskCountsRes);
      setSpecialistFixedTaskCounts(specialistFixedTaskCountsRes);
      setSpecialistProgressStats(specialistProgressRes);
      setManagerStats(statsRes);
      setUnreadCount(unreadRes.unreadCount);
      setNotifications(
        normalizeList(notifRes as Notification[] | { data?: Notification[] }),
      );
      const role = (currentUser ?? storedUser)?.roles;
      if (role === "manager") void loadManagerAnalytics(authToken);
      else if (role !== "supervisor" && uid) {
        // Specialist: public per-user endpoint (no role restriction).
        fetchAllSpecialistFixedTasks(authToken, uid, { status: "todo" })
          .then((r) => setFixedTasksDeduped(r))
          .catch(() => setFixedTasksDeduped([]));
      } else if (role === "supervisor") {
        void loadSupervisorData(authToken);
      } else {
        setFixedTasksDeduped([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "دریافت اطلاعات ناموفق بود",
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
    base: Record<string, string | number | boolean | undefined> = {},
  ) {
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const res = await fixedTaskApi
        .bySpecialist(authToken, userId, { ...base, page, limit })
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
          fetchAllFixedTasks(authToken, { status: "todo" }).catch(
            () => [] as FixedTask[],
          ),
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
      setFixedTasksDeduped(recurring as FixedTask[]);
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
      setFixedTasksDeduped(supervisedFixedTasks);
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

  async function loadSelectedSpecialistFixedTasks(
    authToken: string,
    specialistId: string,
  ) {
    if (!specialistId) return [];
    return fetchAllSpecialistFixedTasks(authToken, specialistId, {
      status: "todo",
    });
  }

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
        queueMicrotask(() => setFixedTasksDeduped(supervisorFixedTasks));
      } else {
        void loadLatestManagerAnalytics(token);
      }
      return;
    }

    void loadLatestSpecialistFixedTasks(token, selectedSpecialistId)
      .then((r) => setFixedTasksDeduped(r))
      .catch(() => setFixedTasksDeduped([]));
  }, [
    authHydrated,
    currentUser?.roles,
    selectedSpecialistId,
    supervisorFixedTasks,
    token,
  ]);

  async function createTask(values: CreateTaskValues) {
    const title = values.title.trim();
    if (!myId || !title) return;
    // Backend requires exactly one assignee; fall back to the current user.
    const assignee = values.assignee || myId;
    const body = {
      title,
      assignedTo: [assignee],
      status: "todo",
      ...(values.description?.trim()
        ? { description: values.description.trim() }
        : {}),
      ...(values.recurrence ? { recurrence: values.recurrence } : {}),
      ...(values.startDate
        ? { startDate: new Date(values.startDate).toISOString() }
        : {}),
      ...(values.dueDate
        ? { dueDate: new Date(values.dueDate).toISOString() }
        : {}),
      ...(values.startTime ? { startTime: values.startTime } : {}),
      ...(values.endTime ? { endTime: values.endTime } : {}),
    };
    try {
      await taskApi.create(token, body, values.file ?? undefined);
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
      });
      setTasks((prev) => prev.map((t) => (getId(t) === taskId ? updated : t)));
      if (selectedTask && getId(selectedTask) === taskId)
        setSelectedTask(updated);
      setMessage("گزارش برای شما اساین شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "اساین گزارش ناموفق بود");
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
      setError(err instanceof Error ? err.message : "تغییر وضعیت ناموفق بود");
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
      setError(
        "\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.",
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "\u062c\u0633\u062a\u062c\u0648 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f",
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "\u062f\u0631\u06cc\u0627\u0641\u062a \u0622\u0645\u0627\u0631 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f",
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "\u062f\u0631\u06cc\u0627\u0641\u062a \u062a\u0639\u062f\u0627\u062f \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f",
      );
    }
  }

  async function createLeaveRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      await loadData();
      setMessage("درخواست مرخصی ثبت شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت مرخصی ناموفق بود");
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
      setMessage("مرخصی تأیید شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات مرخصی ناموفق بود");
    }
  }

  async function confirmRejectLeave() {
    if (!myId || !rejectLeaveId || !rejectReason.trim()) return;
    try {
      await leaveApi.reject(token, rejectLeaveId, myId, rejectReason.trim());
      setRejectLeaveId(null);
      setRejectReason("");
      setMessage("مرخصی رد شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "رد مرخصی ناموفق بود");
    }
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      await managerApi.updateUserRole(token, userId, role);
      setMessage("نقش کاربر بروزرسانی شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تغییر نقش ناموفق بود");
    }
  }

  async function approveUser(userId: string) {
    try {
      await userApi.approve(token, userId);
      setMessage("کاربر تأیید شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تأیید کاربر ناموفق بود");
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("حذف این کاربر؟ این عمل قابل بازگشت نیست.")) return;
    try {
      await userApi.delete(token, userId);
      setMessage("کاربر حذف شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف کاربر ناموفق بود");
    }
  }

  async function searchTeamUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parts: string[] = [];
    if (parts.length < 2) {
      setError("نام و نام خانوادگی را با فاصله وارد کنید.");
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
      setMessage("کاربر جدید ساخته شد.");
      setShowNewUserForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت کاربر ناموفق بود");
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
      setMessage("پروفایل ذخیره شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره پروفایل ناموفق بود");
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

  // ─── Login ─────────────────────────────────────────────────────────────────
  const pageContext = {
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
    taskDescription,
    taskStartDate,
    taskDueDate,
    taskStartTime,
    taskEndTime,
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
    specialistSearchQuery,
    selectedSpecialistId,
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
    leaveStatistics,
    excelFiles,
    excelStats,
    excelUploading,
    fixedTasks,
    activeFixedTaskCount,
    incompleteFixedTasks,
    fixedDoneTasks,
    fixedInProgressTasks,
    fixedOpenTasks,
    fixedTodoCount,
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
    specialistTaskCounts,
    specialistFixedTaskCounts,
    specialistProgressStats,
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
    setTaskDescription,
    setTaskStartDate,
    setTaskDueDate,
    setTaskStartTime,
    setTaskEndTime,
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
    setSpecialistSearchQuery,
    setSelectedSpecialistId,
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
    setSpecialistTaskCounts,
    setSpecialistFixedTaskCounts,
    setSpecialistProgressStats,
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
    createTaskFromValues,
    claimTask,
    moveTask,
    updateTask,
    deleteTask,
    taLookupTasks,
    taLookupTasksFromValues,
    taRunCompletionStats,
    taRunCompletionStatsFromValues,
    taRunDateCount,
    taRunDateCountFromValues,
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
    saveFixedTaskFromValues,
    activateFixedTask,
    deactivateFixedTask,
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
