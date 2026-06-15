import axios, { type AxiosRequestConfig } from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const apiClient = axios.create({ baseURL: apiUrl });

apiClient.interceptors.request.use((config) => {
  const headers = config.headers ?? {};
  const hasAuthHeader = Object.keys(headers).some(
    (key) => key.toLowerCase() === "authorization",
  );

  if (!hasAuthHeader && typeof window !== "undefined") {
    const token = localStorage.getItem("taskino-token");
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  config.headers = headers;
  return config;
});

export type User = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  roles?: string;
  workField?: WorkField;
  isActive?: boolean;
  score?: number;
  performanceStatus?: string;
  progressPercentage?: number;
};

export type WorkField =
  | "it"
  | "human_resources"
  | "finance"
  | "sales"
  | "operations";
export type FixedTaskRecurrence = "daily" | "weekly" | "monthly";
export type FixedTaskStatus = "todo" | "in_progress" | "done";
export type DeadlineStatus = "overdue" | "within_deadline";

export type Task = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  createdBy?: string | User;
  assignedTo?: Array<string | User>;
  projectId?: string | Project;
  status?: string;
  taskComment?: string;
  isPublic?: boolean;
  file?: string;
  excelFile?:
    | string
    | { _id?: string; id?: string; fileName?: string; originalName?: string };
  recurrence?: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Project = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  owner?: string | User;
  members?: Array<string | User>;
  tasks?: Array<string | Task>;
  status?: string;
  workField?: WorkField;
  supervisorId?: string | User;
  assigneeId?: string | User;
  isArchived?: boolean;
  isActive?: boolean;
  isPublic?: boolean;
};

export type Notification = {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  link?: string;
  createdAt?: string;
};

export type LeaveRequest = {
  _id?: string;
  id?: string;
  user?: string | User;
  startDate: string;
  endDate: string;
  reason?: string;
  status?: string;
  approvedBy?: string | User;
};

export type ManagerStats = {
  openTasks: number;
  activeUsers: number;
  activeProjects?: number;
};

export type ProjectProgress = {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  progressPercentage: number;
};

export type ProjectProgressItem = {
  projectId?: string;
  projectName?: string;
  title?: string;
  progressPercentage?: number;
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  pendingTasks?: number;
};

export type SupervisorStats = {
  recurrence?: string | null;
  supervisedTasks?: number;
  supervisedFixedTasks?: number;
  supervisedInProgressTasks?: number;
  supervisedInProgressFixedTasks?: number;
  myInProgressTasks?: number;
  myInProgressFixedTasks?: number;
  mySuccessfulTasks?: number;
  myOnTimeSuccessfulTasks?: number;
  // legacy fields (still referenced by older supervisor views)
  supervisedProjects?: number;
  supervisedProjectsInProgressTasks?: number;
  participatingProjectsDoneTasks?: number;
  supervisorDoneTasks?: number;
  inProgressTasks?: number;
  successfulTasksInProjects?: number;
  successfulTasksAssignedToSupervisor?: number;
};

export type SupervisorMember = {
  _id?: string;
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  role?: string;
  isActive?: boolean;
  score?: number;
  progressPercentage?: number;
  performanceStatus?: string;
  performanceEvaluatedAt?: string;
  assignedTasks?: number;
  completedTasks?: number;
  assignedFixedTasks?: number;
  completedFixedTasks?: number;
  totalTasks?: number;
  totalFixedTasks?: number;
};

export type MemberPerformance = {
  userId?: string;
  _id?: string;
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  taskCount?: number;
  totalTasks?: number;
  completedCount?: number;
  completedTasks?: number;
  todoTasks?: number;
  inProgressTasks?: number;
  doneTasks?: number;
  pendingTasks?: number;
  overdueTasks?: number;
  projectsCount?: number;
  projects?: string[];
  email?: string;
  mobile?: string;
  isActive?: boolean;
  completionRate?: number;
  score?: number;
};

export type ProjectReport = {
  totalTasks?: number;
  todoTasks?: number;
  inProgressTasks?: number;
  doneTasks?: number;
  overdueTasks?: number;
  overdueCount?: number;
  memberCount?: number;
  assigneeCount?: number;
  completionRate?: number;
};

export type TaskStatusOverview = {
  totalTasks?: number;
  todoTasks?: number;
  inProgressTasks?: number;
  doneTasks?: number;
  todo?: number;
  inProgress?: number;
  in_progress?: number;
  done?: number;
  total?: number;
};

export type UserTaskCount = {
  userId?: string;
  _id?: string;
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  totalTasks?: number;
  todoTasks?: number;
  inProgressTasks?: number;
  doneTasks?: number;
  todo?: number;
  inProgress?: number;
  in_progress?: number;
  done?: number;
  total?: number;
};

export type MonthlyPerformance = {
  userId?: string;
  _id?: string;
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  month?: number;
  year?: number;
  email?: string;
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  pendingTasks?: number;
  completionRate?: number;
  score?: number;
};

export type MonthlyPerformanceResponse = {
  month?: number;
  year?: number;
  projectId?: string;
  users?: MonthlyPerformance[];
};

export type AuthResponse = { user: User; accessToken: string };

export type ManagerAllTasks = {
  recurrence?: string | null;
  total?: number;
  totalTasks?: number;
  totalFixedTasks?: number;
  tasks?: Task[];
  fixedTasks?: FixedTask[];
};

export type UserProgress = {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  totalTasks?: number;
  completedTasks?: number;
  onTimeTasks?: number;
  inProgressTasks?: number;
  totalFixedTasks?: number;
  completedFixedTasks?: number;
  inProgressFixedTasks?: number;
  progressPercentage?: number;
  performanceStatus?: string;
  performanceEvaluatedAt?: string;
};

export type ProjectMember = {
  _id?: string;
  id?: string;
  project?: string | Project;
  user?: string | User;
  role?: string;
  isActive?: boolean;
};

export type ExcelFile = {
  _id?: string;
  id?: string;
  fileName?: string;
  originalName?: string;
  type?: string;
  status?: string;
  totalRows?: number;
  successRows?: number;
  errorRows?: number;
  createdAt?: string;
};

export type ExcelStatistics = {
  totalImports: number;
  totalExports: number;
  completedImports: number;
  failedImports: number;
  totalFiles: number;
};

export type FixedTask = {
  _id?: string;
  id?: string;
  title: string;
  assignedTo?: string | User;
  createdBy?: string | User;
  projectId?: string | Project;
  recurrence: FixedTaskRecurrence;
  description?: string;
  isActive?: boolean;
  status?: FixedTaskStatus;
  doneTime?: string;
  lastGeneratedAt?: string;
  nextRunAt?: string;
  startTime?: string;
  endTime?: string;
  endDate?: string;
  sourceExcel?: string;
  sourceSheet?: string;
  sourceRow?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type IncompleteFixedTask = FixedTask & {
  deadline?: string;
  periodStart?: string;
  periodEnd?: string;
  deadlineStatus?: DeadlineStatus;
};

export function getId(item?: { _id?: string; id?: string } | string) {
  if (!item) return "";
  return typeof item === "string" ? item : (item._id ?? item.id ?? "");
}

export function normalizeList<T>(
  v: T[] | { data?: T[]; items?: T[]; docs?: T[] },
) {
  if (Array.isArray(v)) return v;
  return v.data ?? v.items ?? v.docs ?? [];
}

function requestHeaders(headers?: HeadersInit) {
  const normalized: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    normalized[key] = value;
  });
  return normalized;
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "string") {
    try {
      return extractErrorMessage(JSON.parse(data), fallback);
    } catch {
      return data || fallback;
    }
  }

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join("، ");
    if (message) return message;
  }

  return fallback;
}

async function axiosErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "اتصال به بک‌اند برقرار نشد.";

  let data: unknown = error.response.data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    data = await data.text();
  }

  return extractErrorMessage(data, fallback);
}

function axiosConfig(opts: RequestInit, token?: string): AxiosRequestConfig {
  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers = requestHeaders(opts.headers);

  if (
    !isFormData &&
    !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
  ) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  return {
    method: opts.method ?? "GET",
    headers,
    data: opts.body ?? undefined,
    signal: opts.signal ?? undefined,
    withCredentials: opts.credentials === "include",
  };
}

export async function request<T>(
  path: string,
  opts: RequestInit = {},
  token?: string,
  fallbackMessage = "درخواست ناموفق بود",
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      ...axiosConfig(opts),
    });
    return response.data;
  } catch (error) {
    throw new Error(await axiosErrorMessage(error, fallbackMessage));
  }
}

export async function downloadBlob(
  path: string,
  filename: string,
  opts: RequestInit = {},
) {
  let blob: Blob;
  try {
    const response = await apiClient.request<Blob>({
      url: path,
      ...axiosConfig(opts),
      responseType: "blob",
    });
    blob = response.data;
  } catch (error) {
    throw new Error(await axiosErrorMessage(error, "دانلود ناموفق بود"));
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function unwrapAxios<T>(
  promise: Promise<{ data: T }>,
  fallbackMessage = "درخواست ناموفق بود",
) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw new Error(await axiosErrorMessage(error, fallbackMessage));
  }
}

function qs(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return q ? `?${q}` : "";
}

function toFormData(body: Record<string, unknown>, file?: File) {
  const form = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, String(item)));
      return;
    }
    form.append(key, String(value));
  });
  if (file) form.append("file", file);
  return form;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: { mobile: string; password: string }) =>
    unwrapAxios(
      apiClient.post<AuthResponse>("/auth/login", body),
      "ورود ناموفق بود",
    ),
  register: (body: Record<string, string>) =>
    unwrapAxios(
      apiClient.post<AuthResponse>("/auth/register", body),
      "ثبت‌نام ناموفق بود",
    ),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const userApi = {
  list: (token: string, page = 1, limit = 50) =>
    unwrapAxios(
      apiClient.get<User[] | { data?: User[] }>(`/users${qs({ page, limit })}`),
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<User>(`/users/${id}`)),
  create: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(apiClient.post<User>("/users", body), "ساخت کاربر ناموفق بود"),
  update: (token: string, id: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.patch<User>(`/users/${id}`, body),
      "بروزرسانی کاربر ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(apiClient.delete(`/users/${id}`), "حذف کاربر ناموفق بود"),
  approve: (token: string, id: string) =>
    unwrapAxios(
      apiClient.patch(`/users/${id}/approve`),
      "تایید کاربر ناموفق بود",
    ),
  increaseScore: (token: string, body: { userId: string; score: number }) =>
    unwrapAxios(
      apiClient.post("/users/increase-score", body),
      "افزایش امتیاز ناموفق بود",
    ),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const taskApi = {
  list: (token: string, params?: Record<string, string | number | undefined>) =>
    unwrapAxios(
      apiClient.get<Task[] | { data?: Task[] }>(
        `/tasks${qs({ page: 1, limit: 50, ...params })}`,
      ),
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<Task>(`/tasks/${id}`)),
  create: (token: string, body: Record<string, unknown>, file?: File) =>
    unwrapAxios(
      apiClient.post<Task>("/tasks", toFormData(body, file)),
      "ساخت گزارش ناموفق بود",
    ),
  update: (token: string, id: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.patch<Task>(`/tasks/${id}`, body),
      "بروزرسانی گزارش ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(apiClient.delete(`/tasks/${id}`), "حذف گزارش ناموفق بود"),
  updateStatus: (token: string, id: string, status: string) =>
    unwrapAxios(
      apiClient.patch(`/tasks/${id}/status`, { status }),
      "تغییر وضعیت ناموفق بود",
    ),
  completionStats: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.post<Record<string, unknown>>("/tasks/completion-stats", body),
      "دریافت آمار ناموفق بود",
    ),
  dateCount: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.post<Record<string, unknown>>("/tasks/date-count", body),
      "دریافت تعداد ناموفق بود",
    ),
  byUserName: (token: string, userName: string, lastName: string) =>
    unwrapAxios(
      apiClient.get<Task[] | { data?: Task[] }>(
        `/tasks/user${qs({ userName, lastName })}`,
      ),
    ),
  bySpecialist: (
    token: string,
    userId: string,
    params?: Record<string, string | number | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<Task[] | { data?: Task[] }>(
        `/tasks/specialist/${userId}${qs(params)}`,
      ),
    ),
};

// ─── Manager ─────────────────────────────────────────────────────────────────
export const managerApi = {
  statistics: (token: string) =>
    unwrapAxios(apiClient.get<ManagerStats>("/manager/statistics")),
  users: (
    token: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<User[] | { data?: User[] }>(`/manager/users${qs(params)}`),
    ),
  updateUserRole: (token: string, userId: string, role: string) =>
    unwrapAxios(
      apiClient.patch(`/manager/users/${userId}/role`, { role }),
      "تغییر نقش ناموفق بود",
    ),
  taskStatusOverview: (token: string) =>
    unwrapAxios(apiClient.get<TaskStatusOverview>("/manager/tasks/status")),
  taskCountsByUsers: (token: string) =>
    unwrapAxios(
      apiClient.get<UserTaskCount[] | { data?: UserTaskCount[] }>(
        "/manager/tasks/users/counts",
      ),
    ),
  monthlyPerformance: (
    token: string,
    params?: Record<string, string | number | undefined>,
  ) =>
    unwrapAxios<
      | MonthlyPerformance[]
      | { data?: MonthlyPerformance[] }
      | MonthlyPerformanceResponse
    >(apiClient.get(`/manager/users/monthly-performance${qs(params)}`)),
  allTasks: (token: string, recurrence?: string) =>
    unwrapAxios(
      apiClient.get<ManagerAllTasks>(
        `/manager/tasks${qs(recurrence ? { recurrence } : {})}`,
      ),
    ),
  findUserByName: (token: string, firstName: string, lastName: string) =>
    unwrapAxios(
      apiClient.get<User>(
        `/manager/users/by-name${qs({ firstName, lastName })}`,
      ),
    ),
  usersProgress: (token: string) =>
    unwrapAxios(
      apiClient.get<UserProgress[] | { data?: UserProgress[] }>(
        "/manager/users/progress",
      ),
    ),
};

// ─── Supervisor ───────────────────────────────────────────────────────────────
export const supervisorApi = {
  statistics: (token: string, recurrence?: FixedTaskRecurrence) =>
    unwrapAxios(
      apiClient.get<SupervisorStats>(
        `/supervisor/statistics${qs(recurrence ? { recurrence } : {})}`,
      ),
    ),
  members: (
    token: string,
    params?: Record<string, string | number | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<SupervisorMember[] | { data?: SupervisorMember[] }>(
        `/supervisor/members${qs(params)}`,
      ),
    ),
  tasks: (
    token: string,
    params?: Record<string, string | number | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<Task[] | { data?: Task[] }>(
        `/supervisor/tasks${qs(params)}`,
      ),
    ),
  fixedTasks: (
    token: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<FixedTask[] | { data?: FixedTask[] }>(
        `/supervisor/fixed-tasks${qs(params)}`,
      ),
    ),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: (
    token: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<Notification[] | { data?: Notification[] }>(
        `/notifications/me${qs(params)}`,
      ),
    ),
  unreadCount: (token: string) =>
    unwrapAxios(
      apiClient.get<{ unreadCount: number }>(
        "/notifications/me/unread-count",
      ),
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<Notification>(`/notifications/${id}`)),
  markRead: (token: string, id: string) =>
    unwrapAxios(
      apiClient.patch(`/notifications/${id}`, { isRead: true }),
      "خواندن نوتیفیکیشن ناموفق بود",
    ),
  markAllRead: (token: string) =>
    unwrapAxios(
      apiClient.patch("/notifications/me/read-all"),
      "خواندن همه نوتیفیکیشن‌ها ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(
      apiClient.delete(`/notifications/${id}`),
      "حذف نوتیفیکیشن ناموفق بود",
    ),
  deleteRead: (token: string) =>
    unwrapAxios(
      apiClient.delete("/notifications/me/read"),
      "حذف نوتیفیکیشن‌های خوانده‌شده ناموفق بود",
    ),
};

// ─── Fixed Tasks ─────────────────────────────────────────────────────────────
export const fixedTaskApi = {
  list: (
    token: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<FixedTask[] | { data?: FixedTask[] }>(
        `/fixed-tasks${qs(params)}`,
      ),
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<FixedTask>(`/fixed-tasks/${id}`)),
  create: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.post<FixedTask>("/fixed-tasks", body),
      "ساخت گزارش ثابت ناموفق بود",
    ),
  update: (
    token: string,
    id: string,
    userId: string,
    body: Record<string, unknown>,
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(`/fixed-tasks/${id}${qs({ userId })}`, body),
      "بروزرسانی گزارش ثابت ناموفق بود",
    ),
  // Assignee (specialist) may PATCH only the status field — board drag & drop.
  updateStatus: (
    token: string,
    id: string,
    userId: string,
    status: FixedTaskStatus,
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(
        `/fixed-tasks/${id}${qs({ userId })}`,
        { status },
      ),
      "تغییر وضعیت گزارش ثابت ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(
      apiClient.delete(`/fixed-tasks/${id}`),
      "حذف گزارش ثابت ناموفق بود",
    ),
  seedFromExcel: (token: string) =>
    unwrapAxios<{
      message?: string;
      usersCreated?: number;
      fixedTasksCreated?: number;
    }>(
      apiClient.post("/fixed-tasks/seed/excel"),
      "ایمپورت از اکسل ناموفق بود",
    ),
  bySpecialist: (
    token: string,
    userId: string,
    params?: Record<string, string | number | undefined>,
  ) =>
    unwrapAxios(
      apiClient.get<FixedTask[] | { data?: FixedTask[] }>(
        `/fixed-tasks/specialist/${userId}${qs(params)}`,
      ),
    ),
};

// ─── Leave Requests ──────────────────────────────────────────────────────────
export const leaveApi = {
  list: (token: string, params?: Record<string, string | number | undefined>) =>
    unwrapAxios(
      apiClient.get<LeaveRequest[] | { data?: LeaveRequest[] }>(
        `/leave-requests${qs(params)}`,
      ),
    ),
  byUser: (token: string, userId: string) =>
    unwrapAxios(apiClient.get<LeaveRequest[]>(`/leave-requests/user/${userId}`)),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<LeaveRequest>(`/leave-requests/${id}`)),
  create: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.post<LeaveRequest>("/leave-requests", body),
      "ثبت مرخصی ناموفق بود",
    ),
  update: (token: string, id: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.patch<LeaveRequest>(`/leave-requests/${id}`, body),
      "بروزرسانی مرخصی ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(
      apiClient.delete(`/leave-requests/${id}`),
      "حذف مرخصی ناموفق بود",
    ),
  approve: (token: string, id: string, approvedBy: string) =>
    unwrapAxios(
      apiClient.post(`/leave-requests/${id}/approve`, { approvedBy }),
      "تایید مرخصی ناموفق بود",
    ),
  reject: (
    token: string,
    id: string,
    approvedBy: string,
    rejectionReason: string,
  ) =>
    unwrapAxios(
      apiClient.post(`/leave-requests/${id}/reject`, {
        approvedBy,
        rejectionReason,
      }),
      "رد مرخصی ناموفق بود",
    ),
};

// ─── Excel ───────────────────────────────────────────────────────────────────
export const excelApi = {
  list: (token: string, params?: Record<string, string | number | undefined>) =>
    unwrapAxios(
      apiClient.get<ExcelFile[] | { data?: ExcelFile[] }>(`/excel${qs(params)}`),
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<ExcelFile>(`/excel/${id}`)),
  create: (token: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.post<ExcelFile>("/excel", body),
      "ساخت فایل اکسل ناموفق بود",
    ),
  update: (token: string, id: string, body: Record<string, unknown>) =>
    unwrapAxios(
      apiClient.patch<ExcelFile>(`/excel/${id}`, body),
      "بروزرسانی فایل اکسل ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(apiClient.delete(`/excel/${id}`), "حذف فایل اکسل ناموفق بود"),
  upload: async (
    token: string,
    file: File,
    createdBy: string,
    type: "import" | "export" = "import",
  ) => {
    const form = new FormData();
    form.append("file", file);
    return unwrapAxios<ExcelFile>(
      apiClient.post(
        `/excel/upload?createdBy=${encodeURIComponent(createdBy)}&type=${type}`,
        form,
      ),
      "آپلود ناموفق بود",
    );
  },
  download: (token: string, id: string, filename: string) =>
    downloadBlob(`/excel/${id}/download`, filename),
  process: (token: string, id: string) =>
    unwrapAxios(
      apiClient.post(`/excel/${id}/process`),
      "پردازش فایل اکسل ناموفق بود",
    ),
  statistics: (token: string, userId: string) =>
    unwrapAxios(
      apiClient.get<ExcelStatistics>(`/excel/statistics/${userId}`),
    ),
  generateExport: (
    token: string,
    body: Record<string, unknown>,
    filename = "export.xlsx",
  ) =>
    downloadBlob("/excel/export/generate", filename, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
