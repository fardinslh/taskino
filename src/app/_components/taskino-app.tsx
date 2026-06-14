"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart2,
  Bell,
  CalendarDays,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Flag,
  MessageSquare,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  ListFilter,
  Loader2,
  LogOut,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  excelApi,
  fixedTaskApi,
  getId,
  leaveApi,
  managerApi,
  normalizeList,
  notificationApi,
  supervisorApi,
  taskApi,
  type FixedTask,
  type FixedTaskStatus,
  type IncompleteFixedTask,
  userApi,
  type ExcelFile,
  type ExcelStatistics,
  type LeaveRequest,
  type ManagerStats,
  type ManagerAllTasks,
  type UserProgress,
  type MemberPerformance,
  type MonthlyPerformance,
  type Notification,
  type Project,
  type ProjectReport,
  type SupervisorStats,
  type Task,
  type TaskStatusOverview,
  type User,
  type UserTaskCount,
} from "@/lib/api";

import { TaskPanel } from "./task-panel";
import { AssigneeStack, EmptyState, Field, FilterChip, Select, SideItem, SkeletonCard, Toast } from "./shared";
import { COLUMNS, PRIORITY, PROJECT_COVERS, TASK_PERIODS, VIEW_PATHS, type Priority, type TaskPeriod, type View } from "../_lib/task-constants";
import { formatDate, initials, isFixedTaskInPeriod, isTaskInPeriod, isUnassignedTask, recurrenceLabel, statusLabel, userName, workFieldLabel } from "../_lib/task-helpers";
import { useAppDispatch } from "../_store/hooks";
import { setPageContext, type TaskinoPageContext } from "../_store/taskino-context-slice";
// ─── Main Component ───────────────────────────────────────────────────────────
type TaskinoAppProps = {
  initialView?: View;
  children?: ReactNode;
};

export function TaskinoApp({ initialView = "dashboard", children }: TaskinoAppProps) {
  const dispatch = useAppDispatch();
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
  const [taCompletionResult, setTaCompletionResult] = useState<Record<string, unknown> | null>(null);
  const [taCountUser, setTaCountUser] = useState("");
  const [taCountStart, setTaCountStart] = useState("");
  const [taCountEnd, setTaCountEnd] = useState("");
  const [taCountResult, setTaCountResult] = useState<Record<string, unknown> | null>(null);
  const [taskQuery, setTaskQuery] = useState("");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [teamSearchResult, setTeamSearchResult] = useState<User[] | null>(null);
  const [teamSearching, setTeamSearching] = useState(false);

  // API data
  const [managerStats, setManagerStats] = useState<ManagerStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotif, setPopupNotif] = useState<Notification | null>(null);
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [boardShowAll, setBoardShowAll] = useState(false);
  const seenNotifRef = useRef<Set<string>>(new Set());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [excelStats, setExcelStats] = useState<ExcelStatistics | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([]);
  const [incompleteFixedTasks, setIncompleteFixedTasks] = useState<IncompleteFixedTask[]>([]);
  const [fixedReportsTab, setFixedReportsTab] = useState<"templates" | "incomplete">("templates");
  const [showFixedTaskForm, setShowFixedTaskForm] = useState(false);
  const [editingFixedTask, setEditingFixedTask] = useState<FixedTask | null>(null);
  const [ftTitle, setFtTitle] = useState("");
  const [ftAssignee, setFtAssignee] = useState("");
  const [ftRecurrence, setFtRecurrence] = useState<"daily" | "weekly" | "monthly">("daily");
  const [ftDescription, setFtDescription] = useState("");
  const [ftProjectId, setFtProjectId] = useState("");
  const [ftActive, setFtActive] = useState(false);
  const [ftNextRunAt, setFtNextRunAt] = useState("");

  // Manager analytics state
  const [managerTaskStatus, setManagerTaskStatus] = useState<TaskStatusOverview | null>(null);
  const [managerUserCounts, setManagerUserCounts] = useState<UserTaskCount[]>([]);
  const [managerMonthlyPerf, setManagerMonthlyPerf] = useState<MonthlyPerformance[]>([]);
  const [managerUserProgress, setManagerUserProgress] = useState<UserProgress[]>([]);

  // Supervisor state
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStats | null>(null);
  const [supervisorProjects, setSupervisorProjects] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [selectedSupervisorProjectId, setSelectedSupervisorProjectId] = useState<string>("");
  const [supervisorProjectReport, setSupervisorProjectReport] = useState<ProjectReport | null>(null);
  const [supervisorProjectMembersPerf, setSupervisorProjectMembersPerf] = useState<MemberPerformance[]>([]);
  const [loadingSupervisorProject, setLoadingSupervisorProject] = useState(false);

  // UI state
  const [activeViewState, setActiveViewState] = useState<View>(initialView);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<Priority | "">("");
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<TaskPeriod | "">("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskPriorities, setTaskPriorities] = useState<Record<string, Priority>>({});
  const routeView = (Object.entries(VIEW_PATHS).find(([, path]) => path === pathname)?.[0] as View | undefined)
    ?? (pathname === "/" ? "dashboard" : undefined);
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

  const myId = getId(currentUser ?? undefined);
  const isManager = currentUser?.roles === "manager";
  const isSupervisor = currentUser?.roles === "supervisor";
  const isSpecialist = currentUser?.roles === "specialist";
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const activeTasks = managerStats?.openTasks ?? tasks.filter((t) => t.status !== "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const todoCount = tasks.filter((t) => (t.status ?? "todo") === "todo").length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const statsProjects = managerStats?.activeProjects ?? projects.length;
  const statsUsers = managerStats?.activeUsers ?? users.length;
  const supervisorInProgressReports = supervisorStats?.supervisedProjectsInProgressTasks ?? supervisorStats?.inProgressTasks ?? 0;
  const supervisorProjectDoneReports = supervisorStats?.participatingProjectsDoneTasks ?? supervisorStats?.successfulTasksInProjects ?? 0;
  const supervisorOwnDoneReports = supervisorStats?.supervisorDoneTasks ?? supervisorStats?.successfulTasksAssignedToSupervisor ?? 0;
  const teamAssignees = Array.isArray(teamPerformance?.assignees)
    ? teamPerformance.assignees
    : Array.isArray(teamPerformance?.members)
    ? teamPerformance.members
    : [];
  const teamAssigneeCount = teamPerformance?.assigneeCount ?? teamPerformance?.membersCount ?? teamAssignees.length;

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (selectedProjectFilter) {
      list = list.filter((t) => getId(t.projectId) === selectedProjectFilter);
    }
    if (selectedStatusFilter) {
      list = list.filter((t) => (t.status ?? "todo") === selectedStatusFilter);
    }
    if (selectedAssigneeFilter) {
      list = list.filter((t) => (t.assignedTo ?? []).some((u) => getId(u) === selectedAssigneeFilter));
    }
    if (selectedPriorityFilter) {
      list = list.filter((t) => taskPriorities[getId(t)] === selectedPriorityFilter);
    }
    if (selectedPeriodFilter) {
      list = list.filter((t) => isTaskInPeriod(t, selectedPeriodFilter));
    }
    const q = taskQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => `${t.title} ${(t.assignedTo ?? []).map(userName).join(" ")} ${statusLabel(t.status)}`.toLowerCase().includes(q));
  }, [taskPriorities, taskQuery, tasks, selectedAssigneeFilter, selectedPeriodFilter, selectedPriorityFilter, selectedProjectFilter, selectedStatusFilter]);

  const filteredFixedTemplates = useMemo(() => {
    let list = fixedTasks;
    if (selectedAssigneeFilter) {
      list = list.filter((item) => getId(item.assignedTo) === selectedAssigneeFilter);
    }
    if (selectedPeriodFilter) {
      list = list.filter((item) => (item.recurrence ?? "daily") === selectedPeriodFilter);
    }
    const q = taskQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => `${item.title} ${userName(item.assignedTo)} ${recurrenceLabel(item.recurrence)}`.toLowerCase().includes(q));
  }, [fixedTasks, selectedAssigneeFilter, selectedPeriodFilter, taskQuery]);

  useEffect(() => {
    if (!error && !message) return;
    const id = window.setTimeout(() => { setError(""); setMessage(""); }, 3500);
    return () => window.clearTimeout(id);
  }, [error, message]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoadingData(true);
    setError("");
    try {
      const storedUser = JSON.parse(localStorage.getItem("taskino-user") ?? "{}") as User;
      const uid = myId || getId(storedUser);
      const currentRole = (currentUser ?? storedUser)?.roles;
      const userIsManager = currentRole === "manager";
      const userIsSupervisor = currentRole === "supervisor";
      const reportParams = !userIsManager && !userIsSupervisor && uid ? { assignedTo: uid } : undefined;
      const [u, t, leaves, statsRes, unreadRes, notifRes] = await Promise.all([
        userIsManager ? managerApi.users(authToken, { limit: 100 }).catch(() => []) : Promise.resolve([] as User[]),
        userIsManager
          ? managerApi.allTasks(authToken).catch(() => ({ tasks: [] as Task[] }))
          : taskApi.list(authToken, reportParams).catch(() => []),
        uid && !userIsManager && !userIsSupervisor
          ? leaveApi.list(authToken, { limit: 50, user: uid })
          : leaveApi.list(authToken, { limit: 50 }),
        userIsManager ? managerApi.statistics(authToken).catch(() => null) : Promise.resolve(null),
        notificationApi.unreadCount(authToken).catch(() => ({ unreadCount: 0 })),
        notificationApi.list(authToken, { isRead: false, limit: 20 }).catch(() => []),
      ]);
      const taskList = normalizeList((((t as ManagerAllTasks)?.tasks) ?? t) as Task[] | { data?: Task[] });
      setUsers(normalizeList(u));
      setTasks(taskList);
      setLeaveRequests(normalizeList(leaves));
      setManagerStats(statsRes);
      setUnreadCount(unreadRes.unreadCount);
      setNotifications(normalizeList(notifRes as Notification[] | { data?: Notification[] }));
      const role = (currentUser ?? storedUser)?.roles;
      if (role === "manager") void loadManagerAnalytics(authToken);
      else if (role === "supervisor") {
        // GET /fixed-tasks is allowed for manager/supervisor only (specialist → 403).
        fetchAllFixedTasks(authToken, uid ? { assignedTo: uid } : {})
          .then((r) => setFixedTasks(r))
          .catch(() => {});
      } else if (uid) {
        // Specialist: public per-user endpoint (no role restriction).
        fetchAllSpecialistFixedTasks(authToken, uid)
          .then((r) => setFixedTasks(r))
          .catch(() => setFixedTasks([]));
      } else {
        setFixedTasks([]);
      }
      if (role === "supervisor") void loadSupervisorData(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت اطلاعات ناموفق بود");
    } finally {
      setLoadingData(false);
    }
  }

  // Fetch all fixed tasks across pages (the API caps page size, so loop until we have them all).
  async function fetchAllFixedTasks(authToken: string, base: Record<string, string | number | boolean | undefined> = {}) {
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const res = await fixedTaskApi.list(authToken, { ...base, page, limit }).catch(() => null);
      if (!res) break;
      const list = normalizeList(res as FixedTask[] | { data?: FixedTask[] });
      all.push(...list);
      const total = (res && typeof res === "object" && "total" in (res as Record<string, unknown>))
        ? Number((res as Record<string, unknown>).total) : all.length;
      if (list.length === 0 || all.length >= total) break;
    }
    return all;
  }

  // Specialist's own fixed tasks via the public per-user endpoint, across pages.
  async function fetchAllSpecialistFixedTasks(authToken: string, userId: string) {
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const res = await fixedTaskApi.bySpecialist(authToken, userId, { page, limit }).catch(() => null);
      if (!res) break;
      const list = normalizeList(res as FixedTask[] | { data?: FixedTask[] });
      all.push(...list);
      const total = (res && typeof res === "object" && "total" in (res as Record<string, unknown>))
        ? Number((res as Record<string, unknown>).total) : all.length;
      if (list.length === 0 || all.length >= total) break;
    }
    return all;
  }

  async function loadManagerAnalytics(authToken = token) {
    if (!authToken) return;
    try {
      const [taskStatus, userCounts, monthlyPerf, recurring, progress] = await Promise.all([
        managerApi.taskStatusOverview(authToken).catch(() => null),
        managerApi.taskCountsByUsers(authToken).catch(() => []),
        managerApi.monthlyPerformance(authToken).catch(() => []),
        fetchAllFixedTasks(authToken).catch(() => [] as FixedTask[]),
        managerApi.usersProgress(authToken).catch(() => []),
      ]);
      setManagerTaskStatus(taskStatus);
      setManagerUserCounts(normalizeList(userCounts as UserTaskCount[] | { data?: UserTaskCount[] }));
      const monthlyRaw = monthlyPerf as any;
      setManagerMonthlyPerf(monthlyRaw?.users ? monthlyRaw.users : normalizeList(monthlyRaw as MonthlyPerformance[] | { data?: MonthlyPerformance[] }));
      setFixedTasks(recurring as FixedTask[]);
      setManagerUserProgress(normalizeList(progress as UserProgress[] | { data?: UserProgress[] }));
    } catch {}
  }

  async function loadSupervisorData(authToken = token) {
    if (!authToken) return;
    try {
      const [stats, progress] = await Promise.all([
        supervisorApi.statistics(authToken).catch(() => null),
        managerApi.usersProgress(authToken).catch(() => []),
      ]);
      setSupervisorStats(stats);
      setManagerUserProgress(normalizeList(progress as UserProgress[] | { data?: UserProgress[] }));
    } catch {}
  }

  async function loadSupervisorProject(projectId: string, authToken = token) {
    if (!authToken || !projectId) return;
    setLoadingSupervisorProject(true);
    try {
      const [report, membersPerf] = await Promise.all([
        supervisorApi.projectReport(authToken, projectId).catch(() => null),
        supervisorApi.projectAssigneePerformance(authToken, projectId).catch(() => null),
      ]);
      setSupervisorProjectReport(report);
      const raw = membersPerf as any;
      setSupervisorProjectMembersPerf(
        raw?.members ? raw.members : Array.isArray(raw) || raw?.data ? normalizeList(raw as MemberPerformance[] | { data?: MemberPerformance[] }) : raw ? [raw] : [],
      );
    } catch {} finally {
      setLoadingSupervisorProject(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadData());
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
      if (taskFile) await taskApi.createWithFile(token, body, taskFile);
      else await taskApi.create(token, body);
      setTaskTitle(""); setTaskAssignee(""); setTaskProjectId(""); setTaskRecurrence(""); setTaskFile(null); setShowNewProjectForm(false);
      setMessage("گزارش جدید ساخته شد."); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "ساخت گزارش ناموفق بود"); }
  }

  async function claimTask(taskId: string) {
    if (!myId) return;
    try {
      const updated = await taskApi.update(token, taskId, { assignedTo: [myId] });
      setTasks((prev) => prev.map((t) => getId(t) === taskId ? updated : t));
      if (selectedTask && getId(selectedTask) === taskId) setSelectedTask(updated);
      setMessage("گزارش برای شما اساین شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "اساین گزارش ناموفق بود");
    }
  }

  async function moveTask(taskId: string, newStatus: string) {
    try {
      await taskApi.updateStatus(token, taskId, newStatus);
      setTasks((prev) => prev.map((t) => getId(t) === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask && getId(selectedTask) === taskId) setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) { setError(err instanceof Error ? err.message : "تغییر وضعیت ناموفق بود"); }
  }

  async function updateTask(taskId: string, body: Record<string, unknown>) {
    try {
      const updated = await taskApi.update(token, taskId, body);
      setTasks((prev) => prev.map((t) => getId(t) === taskId ? { ...t, ...updated } : t));
      if (selectedTask && getId(selectedTask) === taskId) setSelectedTask((prev) => prev ? { ...prev, ...updated } : prev);
      setMessage("گزارش بروزرسانی شد.");
    } catch (err) { setError(err instanceof Error ? err.message : "بروزرسانی گزارش ناموفق بود"); }
  }

  async function deleteTask(taskId: string) {
    try {
      await taskApi.delete(token, taskId);
      setTasks((prev) => prev.filter((t) => getId(t) !== taskId));
      setSelectedTask(null);
      setMessage("گزارش حذف شد.");
    } catch (err) { setError(err instanceof Error ? err.message : "حذف گزارش ناموفق بود"); }
  }

  async function taLookupTasks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taLookupFirst.trim() || !taLookupLast.trim()) { setError("نام و نام خانوادگی را وارد کنید."); return; }
    try {
      const res = await taskApi.byUserName(token, taLookupFirst.trim(), taLookupLast.trim());
      setTaLookupResult(normalizeList(res));
    } catch (err) { setTaLookupResult([]); setError(err instanceof Error ? err.message : "جستجو ناموفق بود"); }
  }

  async function taRunCompletionStats(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId || !taCompletionExpert) return;
    try {
      const res = await taskApi.completionStats(token, { managerId: myId, expertId: taCompletionExpert });
      setTaCompletionResult(res);
    } catch (err) { setError(err instanceof Error ? err.message : "دریافت آمار ناموفق بود"); }
  }

  async function taRunDateCount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taCountUser || !taCountStart || !taCountEnd) return;
    try {
      const res = await taskApi.dateCount(token, { userId: taCountUser, startdate: taCountStart, enddate: taCountEnd });
      setTaCountResult(res);
    } catch (err) { setError(err instanceof Error ? err.message : "دریافت تعداد ناموفق بود"); }
  }

  async function markNotificationRead(id: string) {
    try {
      await notificationApi.markRead(token, id);
      setNotifications((prev) => prev.filter((n) => getId(n) !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { setError(err instanceof Error ? err.message : "خطا در خواندن اعلان"); }
  }

  async function markAllNotificationsRead() {
    try {
      await notificationApi.markAllRead(token);
      setNotifications([]);
      setUnreadCount(0);
      setMessage("همه اعلان‌ها خوانده شد.");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا در خواندن اعلان‌ها"); }
  }

  async function createLeaveRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      await loadData();
      setMessage("درخواست مرخصی ثبت شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "ثبت مرخصی ناموفق بود"); }
  }

  async function handleLeaveAction(id: string, action: "approve" | "reject") {
    if (!myId) return;
    if (action === "reject") { setRejectReason("عدم تأیید مدیر"); setRejectLeaveId(id); return; }
    try {
      await leaveApi.approve(token, id, myId);
      setMessage("مرخصی تأیید شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "عملیات مرخصی ناموفق بود"); }
  }

  async function confirmRejectLeave() {
    if (!myId || !rejectLeaveId) return;
    if (!rejectReason.trim()) { setError("برای رد درخواست، دلیل الزامی است."); return; }
    try {
      await leaveApi.reject(token, rejectLeaveId, myId, rejectReason.trim());
      setRejectLeaveId(null); setRejectReason("");
      setMessage("مرخصی رد شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "رد مرخصی ناموفق بود"); }
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      await managerApi.updateUserRole(token, userId, role);
      setMessage("نقش کاربر بروزرسانی شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "تغییر نقش ناموفق بود"); }
  }

  async function approveUser(userId: string) {
    try {
      await userApi.approve(token, userId);
      setMessage("کاربر تأیید شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "تأیید کاربر ناموفق بود"); }
  }


  async function deleteUser(userId: string) {
    if (!window.confirm("حذف این کاربر؟ این عمل قابل بازگشت نیست.")) return;
    try {
      await userApi.delete(token, userId);
      setMessage("کاربر حذف شد.");
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "حذف کاربر ناموفق بود"); }
  }

  async function searchTeamUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parts: string[] = [];
    if (parts.length < 2) { setError("نام و نام خانوادگی را با فاصله وارد کنید."); return; }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    setTeamSearching(true);
    try {
      const found = await managerApi.findUserByName(token, firstName, lastName);
      setTeamSearchResult(found ? [found] : []);
    } catch {
      setTeamSearchResult([]);
    } finally { setTeamSearching(false); }
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
        if (newId) await managerApi.updateUserRole(token, newId, "specialist").catch(() => {});
      }
      setMessage("کاربر جدید ساخته شد.");
      setShowNewUserForm(false);
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "ساخت کاربر ناموفق بود"); }
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
    } catch (err) { setError(err instanceof Error ? err.message : "ذخیره پروفایل ناموفق بود"); }
  }

  async function loadExcelData(authToken = token) {
    if (!authToken || !myId) return;
    try {
      const [files, stats] = await Promise.all([
        excelApi.list(authToken, { limit: 50, createdBy: myId }),
        excelApi.statistics(authToken, myId),
      ]);
      setExcelFiles(normalizeList(files));
      setExcelStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دریافت فایل‌های اکسل ناموفق بود");
    }
  }

  useEffect(() => {
    if (token && activeView === "excel") queueMicrotask(() => void loadExcelData());
  }, [token, activeView]);

  // Poll for new notifications and show a center popup for fresh ones (e.g. new assignment).
  useEffect(() => {
    if (!token) return;
    const seen = seenNotifRef.current;
    let seeded = false;
    const poll = async () => {
      const res = await notificationApi.list(token, { isRead: false, limit: 20 }).catch(() => null);
      if (!res) return;
      const list = normalizeList(res as Notification[] | { data?: Notification[] });
      setNotifications(list);
      setUnreadCount(list.length);
      if (!seeded) { list.forEach((n) => seen.add(getId(n))); seeded = true; return; }
      const fresh = list.filter((n) => !seen.has(getId(n)));
      fresh.forEach((n) => seen.add(getId(n)));
      if (fresh.length && !isManager) {
        const assign = fresh.find((n) => (n.type ?? "").includes("assign")) ?? fresh[0];
        setPopupNotif(assign);
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), 20000);
    return () => window.clearInterval(id);
  }, [token, isManager]);


  async function handleExcelUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !myId) return;
    setExcelUploading(true);
    try {
      await excelApi.upload(token, file, myId, "import");
      setMessage("فایل اکسل آپلود شد.");
      await loadExcelData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود فایل ناموفق بود");
    } finally {
      setExcelUploading(false);
      e.target.value = "";
    }
  }

  async function downloadExcelFile(record: ExcelFile) {
    try {
      await excelApi.download(token, getId(record), record.originalName || record.fileName || "file.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "دانلود فایل ناموفق بود");
    }
  }

  async function processExcelFile(id: string) {
    try {
      await excelApi.process(token, id);
      setMessage("فایل پردازش شد.");
      await loadExcelData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "پردازش فایل ناموفق بود");
    }
  }

  async function deleteExcelFile(id: string) {
    try {
      await excelApi.delete(token, id);
      setMessage("فایل حذف شد.");
      await loadExcelData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف فایل ناموفق بود");
    }
  }

  function openFixedTaskForm(ft?: FixedTask) {
    if (ft) {
      setEditingFixedTask(ft);
      setFtTitle(ft.title);
      setFtAssignee(getId(ft.assignedTo));
      setFtRecurrence(ft.recurrence);
      setFtDescription(ft.description ?? "");
      setFtProjectId(getId(ft.projectId));
      setFtActive(ft.isActive !== false);
      setFtNextRunAt(ft.nextRunAt ? ft.nextRunAt.slice(0, 16) : "");
    } else {
      setEditingFixedTask(null);
      setFtTitle(""); setFtAssignee(""); setFtRecurrence("daily");
      setFtDescription(""); setFtProjectId("");
      setFtActive(false); setFtNextRunAt("");
    }
    setShowFixedTaskForm(true);
  }

  function closeFixedTaskForm() {
    setShowFixedTaskForm(false);
    setEditingFixedTask(null);
  }

  async function saveFixedTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ftTitle.trim() || !ftAssignee) return;
    const body = {
      title: ftTitle.trim(),
      assignedTo: ftAssignee,
      recurrence: ftRecurrence,
      description: ftDescription.trim() || undefined,
      projectId: ftProjectId || undefined,
      isActive: ftActive,
      ...(ftNextRunAt ? { nextRunAt: new Date(ftNextRunAt).toISOString() } : {}),
    };
    try {
      if (editingFixedTask) {
        const updated = await fixedTaskApi.update(token, getId(editingFixedTask), body);
        setFixedTasks((prev) => prev.map((ft) => getId(ft) === getId(editingFixedTask) ? updated : ft));
        setMessage("الگوی ثابت بروزرسانی شد.");
      } else {
        const created = await fixedTaskApi.create(token, body);
        setFixedTasks((prev) => [created, ...prev]);
        setMessage("الگوی ثابت ساخته شد.");
      }
      closeFixedTaskForm();
    } catch (err) { setError(err instanceof Error ? err.message : "ذخیره الگو ناموفق بود"); }
  }

  async function toggleFixedTaskActive(ft: FixedTask) {
    try {
      const updated = await fixedTaskApi.update(token, getId(ft), { isActive: !ft.isActive });
      setFixedTasks((prev) => prev.map((item) => getId(item) === getId(ft) ? updated : item));
      setMessage(updated.isActive ? "الگو فعال شد." : "الگو غیرفعال شد.");
    } catch (err) { setError(err instanceof Error ? err.message : "تغییر وضعیت الگو ناموفق بود"); }
  }

  async function deleteFixedTask(id: string) {
    try {
      await fixedTaskApi.delete(token, id);
      setFixedTasks((prev) => prev.filter((ft) => getId(ft) !== id));
      setMessage("الگوی ثابت حذف شد.");
    } catch (err) { setError(err instanceof Error ? err.message : "حذف الگو ناموفق بود"); }
  }

  async function seedFixedTasksFromExcel() {
    if (!window.confirm("ایمپورت کاربران و الگوهای ثابت از فایل اکسلِ پیکربندی‌شده؟")) return;
    try {
      const res = await fixedTaskApi.seedFromExcel(token);
      setMessage(res?.message ?? "ایمپورت از اکسل با موفقیت انجام شد.");
      await loadManagerAnalytics();
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "ایمپورت از اکسل ناموفق بود"); }
  }

  async function exportTasksToExcel() {
    if (!tasks.length) return;
    try {
      const data = tasks.map((t) => ({
        title: t.title,
        status: statusLabel(t.status),
        assignees: (t.assignedTo ?? []).map(userName).join(", "),
        dueDate: t.dueDate ?? "",
      }));
      await excelApi.generateExport(token, {
        data,
        columns: ["title", "status", "assignees", "dueDate"],
        sheetName: "Reports",
      }, "reports-export.xlsx");
      setMessage("خروجی اکسل گزارش‌ها دانلود شد.");
      await loadExcelData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خروجی اکسل ناموفق بود");
    }
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (destination.droppableId !== source.droppableId) {
      void moveFixedTask(draggableId, destination.droppableId as FixedTaskStatus);
    }
  }

  // Specialist drags a fixed report between columns → assignee-only status PATCH.
  async function moveFixedTask(id: string, status: FixedTaskStatus) {
    const prev = fixedTasks;
    setFixedTasks((list) => list.map((ft) => getId(ft) === id ? { ...ft, status } : ft));
    try {
      const updated = await fixedTaskApi.updateStatus(token, id, status);
      setFixedTasks((list) => list.map((ft) => getId(ft) === id ? { ...ft, ...updated } : ft));
    } catch (err) {
      setFixedTasks(prev);
      setError(err instanceof Error ? err.message : "تغییر وضعیت گزارش ناموفق بود");
    }
  }

  function logout() {
    setToken(""); setCurrentUser(null); setUsers([]); setTasks([]); setProjects([]);
    setNotifications([]); setUnreadCount(0); setLeaveRequests([]); setManagerStats(null);
    setExcelFiles([]); setExcelStats(null);
    setShowNotifications(false); setActiveViewState("dashboard");
    localStorage.removeItem("taskino-token"); localStorage.removeItem("taskino-user");
    router.push("/login");
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  const pageContext: TaskinoPageContext = {
    Activity, AlertCircle, AlertTriangle, Award, BarChart2, Bell, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, ClipboardList, Clock, Download, FileSpreadsheet, Flag, FolderKanban, GripVertical, LayoutDashboard, ListFilter, Loader2, LogOut, MessageSquare, Moon, MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Sun, Target, Trash2, TrendingUp, Upload, UserPlus, UsersRound, X, Zap,
    DragDropContext, Draggable, Droppable,
    AssigneeStack, EmptyState, Field, FilterChip, Select, SideItem, SkeletonCard, Toast, TaskPanel,
    COLUMNS, PRIORITY, PROJECT_COVERS, TASK_PERIODS, VIEW_PATHS,
    excelApi, fixedTaskApi, getId, leaveApi, managerApi, normalizeList, notificationApi, supervisorApi, taskApi, userApi,
    formatDate, initials, isFixedTaskInPeriod, isTaskInPeriod, isUnassignedTask, recurrenceLabel, statusLabel, userName, workFieldLabel,
    token, authHydrated, currentUser, loadingData, error, message, users, tasks, projects, taskTitle, taskAssignee, taskProjectId, taskRecurrence, taskFile, showNewProjectForm,
    taLookupFirst, taLookupLast, taLookupResult, taCompletionExpert, taCompletionResult, taCountUser, taCountStart, taCountEnd, taCountResult, taskQuery, showNewUserForm,
    teamSearchResult, teamSearching,
    managerStats, notifications, unreadCount, popupNotif, rejectLeaveId, rejectReason, boardShowAll, seenNotifRef, leaveRequests, excelFiles, excelStats, excelUploading,
    fixedTasks, incompleteFixedTasks, fixedReportsTab, showFixedTaskForm, editingFixedTask, ftTitle, ftAssignee, ftRecurrence, ftDescription, ftProjectId, ftActive, ftNextRunAt,
    managerTaskStatus, managerUserCounts, managerMonthlyPerf, managerUserProgress, supervisorStats, supervisorProjects, overdueTasks, teamPerformance, selectedSupervisorProjectId, supervisorProjectReport, supervisorProjectMembersPerf, loadingSupervisorProject,
    activeView, selectedProjectFilter, selectedStatusFilter, selectedAssigneeFilter, selectedPriorityFilter, selectedPeriodFilter, showNotifications, sidebarCollapsed, darkMode, selectedTask, taskPriorities,
    setToken, setAuthHydrated, setCurrentUser, setLoadingData, setError, setMessage, setUsers, setTasks, setProjects, setTaskTitle, setTaskAssignee, setTaskProjectId, setTaskRecurrence, setTaskFile, setShowNewProjectForm,
    setTaLookupFirst, setTaLookupLast, setTaLookupResult, setTaCompletionExpert, setTaCompletionResult, setTaCountUser, setTaCountStart, setTaCountEnd, setTaCountResult, setTaskQuery, setShowNewUserForm,
    setTeamSearchResult, setTeamSearching,
    setManagerStats, setNotifications, setUnreadCount, setPopupNotif, setRejectLeaveId, setRejectReason, setBoardShowAll, setLeaveRequests, setExcelFiles, setExcelStats, setExcelUploading,
    setFixedTasks, setIncompleteFixedTasks, setFixedReportsTab, setShowFixedTaskForm, setEditingFixedTask, setFtTitle, setFtAssignee, setFtRecurrence, setFtDescription, setFtProjectId, setFtActive, setFtNextRunAt,
    setManagerTaskStatus, setManagerUserCounts, setManagerMonthlyPerf, setManagerUserProgress, setSupervisorStats, setSupervisorProjects, setOverdueTasks, setTeamPerformance, setSelectedSupervisorProjectId, setSupervisorProjectReport, setSupervisorProjectMembersPerf, setLoadingSupervisorProject,
    setActiveView, setActiveViewState, setSelectedProjectFilter, setSelectedStatusFilter, setSelectedAssigneeFilter, setSelectedPriorityFilter, setSelectedPeriodFilter, setShowNotifications, setSidebarCollapsed, setDarkMode, setSelectedTask, setTaskPriorities,
    myId, isManager, isSupervisor, isSpecialist, doneTasks, activeTasks, inProgressTasks, todoCount, progress, statsProjects, statsUsers, supervisorInProgressReports, supervisorProjectDoneReports, supervisorOwnDoneReports, teamAssignees, teamAssigneeCount,
    filteredTasks, filteredFixedTemplates,
    loadData, loadManagerAnalytics, loadSupervisorData, loadSupervisorProject, createTask, claimTask, moveTask, updateTask, deleteTask, taLookupTasks, taRunCompletionStats, taRunDateCount, markNotificationRead, markAllNotificationsRead, createLeaveRequest, handleLeaveAction, confirmRejectLeave, updateUserRole, approveUser, deleteUser, searchTeamUser, clearTeamSearch, createUser, saveProfile, loadExcelData, handleExcelUpload, downloadExcelFile, processExcelFile, deleteExcelFile, openFixedTaskForm, closeFixedTaskForm, saveFixedTask, toggleFixedTaskActive, deleteFixedTask, seedFixedTasksFromExcel, exportTasksToExcel, onDragEnd, moveFixedTask, logout,
  };

  useEffect(() => {
    dispatch(setPageContext(pageContext));
  });

  if (!authHydrated) return null;

  if (!token) return null;

  const sideW = sidebarCollapsed ? 64 : 248;

  return (
    <div className="min-h-screen bg-[--bg] text-[--text]">
      <Toast message={error || message} type={error ? "error" : "success"} onClose={() => error ? setError("") : setMessage("")} />

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-[--border] bg-[--surface]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f7a8c] text-white shadow-sm">
              <Sparkles size={15} />
            </div>
            {!sidebarCollapsed && <span className="font-bold tracking-tight">مدیریت واحد بهبود عملیات و برنامه ریزی</span>}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--text-3]" size={15} />
              <input
                className="h-9 w-52 rounded-lg border border-[--border] bg-[--surface-2] pr-9 pl-3 text-sm outline-none transition-all placeholder:text-[--text-3] focus:w-72 focus:border-[#1f7a8c] focus:bg-[--surface] focus:ring-2 focus:ring-[#1f7a8c]/15"
                onChange={(e) => setTaskQuery(e.target.value)} placeholder="جستجوی گزارش…" value={taskQuery}
              />
              {taskQuery && <button className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-3] hover:text-[--text-2]" onClick={() => setTaskQuery("")} type="button"><X size={13} /></button>}
            </div>

            <div className="relative">
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]"
                onClick={() => setShowNotifications(!showNotifications)} type="button"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute left-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-[--border] bg-[--surface] shadow-xl">
                  <div className="flex items-center justify-between border-b border-[--border] px-4 py-3">
                    <span className="text-sm font-bold">اعلان‌ها</span>
                    {unreadCount > 0 && (
                      <button className="text-xs font-semibold text-[#1f7a8c] hover:underline" onClick={() => void markAllNotificationsRead()} type="button">
                        همه خوانده شد
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[--text-3]">اعلان جدیدی نیست</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={getId(n)}
                          className="flex w-full flex-col gap-0.5 border-b border-[--border] px-4 py-3 text-right transition hover:bg-[--surface-2]"
                          onClick={() => void markNotificationRead(getId(n))} type="button"
                        >
                          <span className="text-sm font-semibold">{n.title}</span>
                          <span className="text-xs text-[--text-3] line-clamp-2">{n.message}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]"
              onClick={() => setDarkMode(!darkMode)} type="button"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface] px-3 text-sm font-medium text-[--text-2] transition hover:bg-[--surface-2] disabled:opacity-50"
              onClick={() => loadData()} disabled={loadingData} type="button"
            >
              {loadingData ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
              <span className="hidden sm:inline">بروزرسانی</span>
            </button>

            <button
              className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface] px-2.5 text-sm font-medium text-[--text] transition hover:bg-[--surface-2]"
              onClick={logout} type="button"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f7a8c] text-[10px] font-bold text-white">
                {initials(currentUser ?? undefined)}
              </span>
              <span className="hidden max-w-[90px] truncate sm:block text-xs">{userName(currentUser ?? undefined)}</span>
              <LogOut size={14} className="text-[--text-3]" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ─ Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className="sticky top-[53px] h-[calc(100vh-53px)] shrink-0 overflow-y-auto overflow-x-hidden border-l border-[--border] bg-[--surface] transition-all duration-200"
          style={{ width: sideW }}
        >
          {/* Collapse toggle */}
          <div className="flex items-center justify-between border-b border-[--border] px-3 py-2">
            {!sidebarCollapsed && <span className="text-xs font-semibold text-[--text-3]">منو</span>}
            <button
              className="mr-auto flex h-7 w-7 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2] hover:text-[--text]"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} type="button"
            >
              {sidebarCollapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>

          <nav className="space-y-0.5 p-2">
            {isSupervisor ? (
              <>
                <SideItem active={activeView === "dashboard"} icon={LayoutDashboard} label="داشبورد" collapsed={sidebarCollapsed} onClick={() => setActiveView("dashboard")} />
                <SideItem active={activeView === "supervisor-projects"} icon={FolderKanban} label="پروژه‌های من" meta={supervisorProjects.length} collapsed={sidebarCollapsed} onClick={() => setActiveView("supervisor-projects")} />
                <SideItem active={activeView === "supervisor-team"} icon={UsersRound} label="عملکرد تیم" collapsed={sidebarCollapsed} onClick={() => setActiveView("supervisor-team")} />
                <SideItem active={activeView === "leave"} icon={CalendarDays} label="مرخصی" meta={leaveRequests.filter((lr) => lr.status === "pending").length || undefined} collapsed={sidebarCollapsed} onClick={() => setActiveView("leave")} />
                <SideItem active={activeView === "tasks"} icon={ClipboardList} label="گزارش‌ها" meta={tasks.length || overdueTasks.length || undefined} collapsed={sidebarCollapsed} onClick={() => setActiveView("tasks")} />
                <div className="my-1.5 border-t border-[--border]" />
                <SideItem active={activeView === "settings"} icon={Settings} label="تنظیمات" collapsed={sidebarCollapsed} onClick={() => setActiveView("settings")} />
              </>
            ) : isManager ? (
              <>
                <SideItem active={activeView === "dashboard"} icon={LayoutDashboard} label="داشبورد" collapsed={sidebarCollapsed} onClick={() => setActiveView("dashboard")} />
                <SideItem active={activeView === "tasks"} icon={ClipboardList} label="گزارش‌ها" meta={tasks.length} collapsed={sidebarCollapsed} onClick={() => setActiveView("tasks")} />
                <SideItem active={activeView === "tasks-admin"} icon={ClipboardList} label="پروژه‌ها" collapsed={sidebarCollapsed} onClick={() => setActiveView("tasks-admin")} />
                <SideItem active={activeView === "analytics"} icon={BarChart2} label="آنالیتیکس" collapsed={sidebarCollapsed} onClick={() => setActiveView("analytics")} />
                <SideItem active={activeView === "team"} icon={UsersRound} label="تیم" meta={statsUsers} collapsed={sidebarCollapsed} onClick={() => setActiveView("team")} />
                <SideItem active={activeView === "leave"} icon={CalendarDays} label="مرخصی" meta={leaveRequests.filter((lr) => lr.status === "pending").length || undefined} collapsed={sidebarCollapsed} onClick={() => setActiveView("leave")} />
                <div className="my-1.5 border-t border-[--border]" />
                <SideItem active={activeView === "settings"} icon={Settings} label="تنظیمات" collapsed={sidebarCollapsed} onClick={() => setActiveView("settings")} />
              </>
            ) : (
              <>
                <SideItem active={activeView === "dashboard"} icon={LayoutDashboard} label="داشبورد" collapsed={sidebarCollapsed} onClick={() => setActiveView("dashboard")} />
                <SideItem active={activeView === "tasks"} icon={ClipboardList} label="گزارش‌ها" meta={tasks.length} collapsed={sidebarCollapsed} onClick={() => setActiveView("tasks")} />
                <SideItem active={activeView === "tasks-admin"} icon={FolderKanban} label="پروژه‌ها" meta={tasks.filter((t) => t.excelFile).length || undefined} collapsed={sidebarCollapsed} onClick={() => setActiveView("tasks-admin")} />
                <SideItem active={activeView === "leave"} icon={CalendarDays} label="مرخصی" meta={leaveRequests.length || undefined} collapsed={sidebarCollapsed} onClick={() => setActiveView("leave")} />
                <div className="my-1.5 border-t border-[--border]" />
                <SideItem active={activeView === "settings"} icon={Settings} label="تنظیمات" collapsed={sidebarCollapsed} onClick={() => setActiveView("settings")} />
              </>
            )}
          </nav>

          {!sidebarCollapsed && (
            <>
              {/* User card */}
              <div className="mx-2 mt-2 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white">
                    {initials(currentUser ?? undefined)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{userName(currentUser ?? undefined)}</p>
                    <p className="truncate text-xs text-[--text-3]">{currentUser?.mobile ?? currentUser?.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[--surface] px-2.5 py-1.5 text-xs font-medium text-[--text-2]">
                  <ShieldCheck size={12} />
                  {currentUser?.roles || "specialist"}
                </div>
              </div>

              {/* Quick task — only for manager */}
              {isManager && (
                <div className="mx-2 mt-2 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <Zap size={13} className="text-[#1f7a8c]" />
                    <span className="text-xs font-semibold text-[--text]">افزودن گزارش به تیم</span>
                  </div>
                  <form className="space-y-2" onSubmit={createTask}>
                    <Field label="" name="taskTitle" id="quick-task-title" value={taskTitle} onChange={setTaskTitle} required placeholder="عنوان گزارش…" />
                    <Select label="" value={taskRecurrence} onChange={setTaskRecurrence} options={TASK_PERIODS} placeholder="دوره گزارش (اختیاری)" />
                    <Select label="" value={taskAssignee} onChange={setTaskAssignee} options={users.map((u) => [getId(u), userName(u)])} placeholder="بدون مسئول" />
                    <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1f7a8c] text-xs font-semibold text-white transition hover:bg-[#196b7b] active:scale-[0.98] disabled:opacity-60" disabled={!taskTitle.trim()} type="submit">
                      <Plus size={14} /> افزودن گزارش
                    </button>
                  </form>
                </div>
              )}

              {/* Progress mini — hidden for manager */}
              {!isManager && (
                <div className="mx-2 my-2 rounded-xl border border-[--border] bg-[--surface-2] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[--text-2]">پیشرفت</span>
                    <span className="text-sm font-bold text-[--text]">{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[--border]">
                    <div className="h-full rounded-full bg-gradient-to-l from-[#1f7a8c] to-[#2a9db2] transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-center">
                    {[{ l: "باز", v: todoCount, c: "text-[--text]" }, { l: "جاری", v: inProgressTasks, c: "text-[#1f7a8c]" }, { l: "تمام", v: doneTasks, c: "text-emerald-500" }].map((s) => (
                      <div key={s.l} className="rounded-lg bg-[--surface] py-1.5">
                        <p className={`text-base font-bold ${s.c}`}>{s.v}</p>
                        <p className="text-[10px] text-[--text-3]">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* ─ Main ─────────────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 space-y-4 overflow-auto p-4" onClick={() => showNotifications && setShowNotifications(false)}>
          {children}

        </main>
      </div>

      {/* Reject leave — reason modal */}
      {rejectLeaveId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRejectLeaveId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-[--border] bg-[--surface] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <X size={18} className="text-red-500" />
              <h3 className="text-base font-bold text-[--text]">رد درخواست مرخصی</h3>
            </div>
            <p className="mt-1 text-xs text-[--text-3]">دلیل رد را وارد کنید (الزامی).</p>
            <textarea
              autoFocus
              className="mt-3 h-24 w-full resize-none rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثلاً: ظرفیت مرخصی تکمیل است"
            />
            <div className="mt-4 flex gap-2">
              <button className="h-10 flex-1 rounded-lg bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50" disabled={!rejectReason.trim()} onClick={() => void confirmRejectLeave()} type="button">رد درخواست</button>
              <button className="h-10 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold" onClick={() => setRejectLeaveId(null)} type="button">انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Center popup for a fresh notification */}
      {popupNotif && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setPopupNotif(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-[--border] bg-[--surface] p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]">
              <Bell size={26} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[--text]">{popupNotif.title || "اعلان جدید"}</h3>
            {popupNotif.message && <p className="mt-2 text-sm leading-relaxed text-[--text-2]">{popupNotif.message}</p>}
            <div className="mt-5 flex gap-2">
              <button
                className="h-10 flex-1 rounded-lg bg-[#1f7a8c] text-sm font-semibold text-white transition hover:bg-[#196b7b]"
                onClick={() => { const id = getId(popupNotif); setPopupNotif(null); void markNotificationRead(id); }}
                type="button"
              >باشه، دیدم</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          users={users}
          canEditAssignments={isManager}
          canComment={isManager}
          canClaim={isSpecialist && isUnassignedTask(selectedTask)}
          onDownloadExcel={() => {
            const ex = selectedTask.excelFile;
            const exId = typeof ex === "string" ? ex : getId(ex);
            if (!exId) return;
            const fname = (typeof ex === "object" ? (ex.originalName || ex.fileName) : undefined) || selectedTask.file || "file.xlsx";
            void excelApi.download(token, exId, fname).catch((err) => setError(err instanceof Error ? err.message : "دانلود ناموفق بود"));
          }}
          onCommentChange={(c) => void updateTask(getId(selectedTask), { taskComment: c })}
          onClaim={() => void claimTask(getId(selectedTask))}
          onStatusChange={(s) => void moveTask(getId(selectedTask), s)}
          onDescriptionChange={(d) => void updateTask(getId(selectedTask), { description: d })}
          onAssign={(userId) => {
            const current = (selectedTask.assignedTo ?? []).map((u) => typeof u === "string" ? u : getId(u));
            if (!current.includes(userId)) void updateTask(getId(selectedTask), { assignedTo: [...current, userId] });
          }}
          onUnassign={(userId) => {
            const current = (selectedTask.assignedTo ?? []).map((u) => typeof u === "string" ? u : getId(u));
            void updateTask(getId(selectedTask), { assignedTo: current.filter((id) => id !== userId) });
          }}
          onDelete={() => void deleteTask(getId(selectedTask))}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
