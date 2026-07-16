import axios, { type AxiosRequestConfig } from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const apiClient = axios.create({ baseURL: apiUrl });
export const UNAUTHORIZED_EVENT = "taskino:unauthorized";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  },
);

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
export type FixedTaskStatus = "todo" | "done";
export type ExtraTaskApprovalStatus = "pending" | "approved" | "rejected";
export type FixedTaskScheduleConfig = {
  weekdays?: number[];
  monthDays?: number[];
};
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
  isExtraTask?: boolean;
  extraTaskApprovalStatus?: ExtraTaskApprovalStatus;
  extraTaskApprovedBy?: string | User | null;
  extraTaskApprovedAt?: string | null;
  taskComment?: string;
  isPublic?: boolean;
  projectType?: "specialist" | "general";
  file?: string;
  completionExcelFile?:
    | string
    | { _id?: string; id?: string; fileName?: string; originalName?: string }
    | null;
  completionFile?:
    | string
    | { _id?: string; id?: string; fileName?: string; originalName?: string }
    | null;
  excelFile?:
    | string
    | { _id?: string; id?: string; fileName?: string; originalName?: string };
  recurrence?: string;
  startDate?: string;
  startTime?: string;
  dueDate?: string;
  endDate?: string;
  endTime?: string;
  doneTime?: string;
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
  recurrence?: "daily" | "weekly" | "hourly" | string;
  leaveType?: "daily" | "hourly" | string;
  type?: "daily" | "hourly" | string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  description?: string;
  details?: string;
  status?: string;
  approvedBy?: string | User;
};

export type LeaveRequestStatistics = {
  total?: number;
  totalRequests?: number;
  pending?: number;
  pendingRequests?: number;
  approved?: number;
  approvedRequests?: number;
  rejected?: number;
  rejectedRequests?: number;
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
  pendingTasks?: number;
};

export type SupervisorStats = {
  recurrence?: string | null;
  supervisedTasks?: number;
  supervisedFixedTasks?: number;
  activeCompletedSupervisedTasks?: number;
  activeCompletedSupervisedFixedTasks?: number;
  mySuccessfulTasks?: number;
  myOnTimeSuccessfulTasks?: number;
  // legacy fields (still referenced by older supervisor views)
  supervisedProjects?: number;
  participatingProjectsDoneTasks?: number;
  supervisorDoneTasks?: number;
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
  doneTasks?: number;
  todo?: number;
  done?: number;
  total?: number;
};

export type TaskStatusRangeBreakdown = {
  total: number;
  done: number;
  todo: number;
  overdueUnfinished: number;
};

export type ManagerTaskStatusRange = TaskStatusRangeBreakdown & {
  tasks: TaskStatusRangeBreakdown;
  fixedTasks: TaskStatusRangeBreakdown;
};

export type StatusCounts = {
  total?: number;
  todo?: number;
  done?: number;
  overdue?: number;
  overdueUnfinished?: number;
  pending?: number;
  completed?: number;
};

export type MyProgressStats = {
  userId?: string;
  taskProgressPercentage?: number;
  fixedTaskProgressPercentage?: number;
  progressPercentage?: number;
  score?: number;
  performanceStatus?: "good" | "normal" | "weak" | "bad";
  completedTasks?: number;
  totalTasks?: number;
  doneTasks?: number;
};

export type ProgressBucket = {
  completed?: number;
  completedTasks?: number;
  done?: number;
  doneTasks?: number;
  progressPercentage?: number;
  total?: number;
  totalTasks?: number;
};

export type DailyProgressEntry = {
  date: string;
  totalTasks?: number;
  completedTasks?: number;
  totalFixedTasks?: number;
  completedFixedTasks?: number;
  taskProgressPercentage?: number;
  fixedTaskProgressPercentage?: number;
  progressPercentage?: number;
  performanceStatus?: "good" | "normal" | "weak" | "bad";
  evaluatedAt?: string;
};

export type MyDailyProgressStats = MyProgressStats & {
  averageProgressPercentage?: number;
  averageTaskProgressPercentage?: number;
  averageFixedTaskProgressPercentage?: number;
  dayCount?: number;
  from?: string;
  to?: string;
  total?: number;
  data?: DailyProgressEntry[];
  fixedTasks?: ProgressBucket;
  projects?: ProgressBucket;
  reports?: ProgressBucket;
  tasks?: ProgressBucket;
};

export type MyWorkSummary = {
  totalTasks?: number;
  completedTasks?: number;
  totalFixedTasks?: number;
  completedFixedTasks?: number;
  score?: number;
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
  doneTasks?: number;
  todo?: number;
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
export type PasswordResetVerifyResponse = {
  resetToken: string;
  changePasswordPath?: string;
  changePasswordUrl?: string;
  expiresIn?: number;
  expiresAt?: string;
};

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
  totalFixedTasks?: number;
  completedFixedTasks?: number;
  progressPercentage?: number;
  performanceStatus?: string;
  performanceEvaluatedAt?: string;
};

export type WorkStatusCounts = {
  total: number;
  done: number;
  todo: number;
  overdueUnfinished: number;
};

export type WorkStatusSummaryUser = {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tasks: WorkStatusCounts;
  fixedTasks: WorkStatusCounts;
};

export type WorkStatusSummary = {
  from: string;
  to: string;
  evaluatedAt?: string;
  users: WorkStatusSummaryUser[];
};

export type ManagerTaskListResponse = {
  from: string;
  to: string;
  evaluatedAt?: string;
  total: number;
  userId?: string;
  data: Task[];
};

export type DailyDurationEntry = {
  date: string;
  expectedMinutes: number;
  actualMinutes: number;
  balance: number;
};

export type DailyDurationBalance = {
  userId: string;
  from: string;
  to: string;
  expectedDailyMinutes?: number;
  totalActualDurationMinutes?: number;
  remainingMinutes?: number;
  entries?: DailyDurationEntry[];
  totalExpected?: number;
  totalActual?: number;
  totalBalance?: number;
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
  specialistName?: string;
  assignedTo?: string | User;
  createdBy?: string | User;
  projectId?: string | Project;
  recurrence: FixedTaskRecurrence;
  scheduleConfig?: FixedTaskScheduleConfig;
  description?: string;
  taskComment?: string | null;
  isActive?: boolean;
  status?: FixedTaskStatus;
  doneTime?: string;
  startedAt?: string | null;
  actualDurationMinutes?: number | null;
  approvedDurationMinutes?: number | null;
  approvedDurationInMinutes?: number | null;
  timingApprovalStatus?: "pending" | "approved" | "rejected";
  timingApprovedBy?: string | User | null;
  timingApprovedAt?: string | null;
  ratingScore?: number | null;
  ratingStatus?: "weak" | "normal" | "good" | null;
  ratingComment?: string | null;
  lastGeneratedAt?: string;
  nextRunAt?: string;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  endDate?: string;
  sourceExcel?: string;
  sourceSheet?: string;
  sourceRow?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedTasks = {
  data: Task[];
  total: number;
  page: number;
  limit: number;
};

export type FixedTaskPayload = {
  title: string;
  assignedTo: string;
  recurrence: FixedTaskRecurrence;
  scheduleConfig?: FixedTaskScheduleConfig;
  specialistName?: string;
  description?: string;
  isActive?: boolean;
  approvedDurationMinutes?: number | null;
  nextRunAt?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
};

export type IncompleteFixedTask = FixedTask & {
  deadline?: string;
  periodStart?: string;
  periodEnd?: string;
  deadlineStatus?: DeadlineStatus;
};

export function getId(
  item?: { _id?: string; id?: string; userId?: string } | string,
) {
  if (!item) return "";
  return typeof item === "string"
    ? item
    : (item._id ?? item.id ?? item.userId ?? "");
}

export type ListResponse<T> = T[] | { data?: T[]; items?: T[]; docs?: T[] };
type Params = Record<string, string | number | undefined>;
type BoolParams = Record<string, string | number | boolean | undefined>;

export type ExcelSeedResult = {
  message?: string;
  usersCreated?: number;
  fixedTasksCreated?: number;
};

export function normalizeList<T>(v: ListResponse<T>) {
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
      return translateErrorMessage(data || fallback);
    }
  }

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join("، ");
    if (message) return translateErrorMessage(message);
  }

  return fallback;
}

function translateErrorMessage(message: string) {
  if (message === "User account is not active") {
    return "حساب شما هنوز توسط مدیر تایید نشده است. لطفا منتظر تایید مدیر بمانید.";
  }
  if (message === "Failed to adjust specialist score") {
    return "تغییر امتیاز متخصص ناموفق بود.";
  }
  if (message === "Failed to approve leave request") {
    return "تایید درخواست مرخصی ناموفق بود.";
  }

  return message;
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
      ...axiosConfig(opts, token),
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
    .filter(([, v]) => v !== undefined)
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
      apiClient.get<ListResponse<User>>(`/users${qs({ page, limit })}`),
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
  meProgress: (token: string) =>
    unwrapAxios(apiClient.get<MyProgressStats>("/users/me/progress")),
  meDailyProgress: (
    token: string,
    params?: { from?: string; to?: string },
  ) =>
    unwrapAxios(
      apiClient.get<MyDailyProgressStats>(
        `/users/me/daily-progress${qs(params)}`,
      ),
      "دریافت عملکرد روزانه ناموفق بود",
    ),
  meWorkSummary: (token: string) =>
    unwrapAxios(apiClient.get<MyWorkSummary>("/users/me/work-summary")),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const taskApi = {
  list: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<Task>>(
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
  createExtra: (
    token: string,
    body: {
      title: string;
      description?: string;
      startDate?: string;
      startTime?: string;
    },
  ) =>
    unwrapAxios(
      apiClient.post<Task>("/tasks/extra", body),
      "ساخت پروژه مازاد ناموفق بود",
    ),
  extraByWorkField: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<PaginatedTasks>(`/tasks/extra/work-field${qs(params)}`),
      "دریافت پروژه‌های مازاد حوزه کاری ناموفق بود",
    ),
  extraByUser: (token: string, userId: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<PaginatedTasks>(
        `/tasks/extra/user/${userId}${qs(params)}`,
      ),
      "دریافت پروژه‌های مازاد کاربر ناموفق بود",
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
      apiClient.patch<Task>(`/tasks/${id}/status`, { status }),
      "تغییر وضعیت ناموفق بود",
    ),
  uploadCompletionFile: (token: string, id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return unwrapAxios<Task>(
      apiClient.patch<Task>(`/tasks/${id}/completion-file`, form),
      "آپلود فایل تکمیل پروژه ناموفق بود",
    );
  },
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
      apiClient.get<ListResponse<Task>>(
        `/tasks/user${qs({ userName, lastName })}`,
      ),
    ),
  bySpecialist: (token: string, userId: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<Task>>(
        `/tasks/specialist/${userId}${qs(params)}`,
      ),
    ),
  publicActive: (token: string) =>
    unwrapAxios(apiClient.get<ListResponse<Task>>("/tasks/public/active")),
  statusCounts: (token: string) =>
    unwrapAxios(apiClient.get<StatusCounts>("/tasks/me/status-counts")),
};

// ─── Manager ─────────────────────────────────────────────────────────────────
export const managerApi = {
  statistics: (token: string) =>
    unwrapAxios(apiClient.get<ManagerStats>("/manager/statistics")),
  users: (token: string, params?: BoolParams) =>
    unwrapAxios(
      apiClient.get<ListResponse<User>>(`/manager/users${qs(params)}`),
    ),
  userDailyProgress: (
    token: string,
    userId: string,
    params: { from: string; to: string },
  ) =>
    unwrapAxios(
      apiClient.get<MyDailyProgressStats>(
        `/manager/users/${encodeURIComponent(userId)}/daily-progress${qs(params)}`,
      ),
      "دریافت عملکرد روزانه کاربر ناموفق بود",
    ),
  updateUserRole: (token: string, userId: string, role: string) =>
    unwrapAxios(
      apiClient.patch(`/manager/users/${userId}/role`, { role }),
      "تغییر نقش ناموفق بود",
    ),
  adjustSpecialistScore: (token: string, userId: string, score: number) =>
    unwrapAxios(
      apiClient.patch<User>(`/manager/users/${userId}/score`, { score }),
      "تغییر امتیاز متخصص ناموفق بود",
    ),
  extraTasks: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<PaginatedTasks>(`/manager/extra-tasks${qs(params)}`),
      "دریافت همه پروژه‌های مازاد ناموفق بود",
    ),
  reviewFixedTaskTiming: (
    token: string,
    id: string,
    status: "approved" | "rejected",
    approvedDurationMinutes?: number,
    taskComment?: string,
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(`/manager/fixed-tasks/${id}/timing-approval`, {
        status,
        ...(approvedDurationMinutes !== undefined
          ? { approvedDurationMinutes }
          : {}),
        ...(taskComment?.trim() ? { taskComment: taskComment.trim() } : {}),
      }),
      "بررسی زمان گزارش ثابت ناموفق بود",
    ),
  taskStatusOverview: (token: string) =>
    unwrapAxios(apiClient.get<TaskStatusOverview>("/manager/tasks/status")),
  taskStatusRange: (token: string, from: string, to: string) =>
    unwrapAxios(
      apiClient.get<ManagerTaskStatusRange>(
        `/manager/tasks/status-range${qs({ from, to })}`,
      ),
    ),
  taskCountsByUsers: (token: string) =>
    unwrapAxios(
      apiClient.get<ListResponse<UserTaskCount>>("/manager/tasks/users/counts"),
    ),
  monthlyPerformance: (token: string, params?: Params) =>
    unwrapAxios<ListResponse<MonthlyPerformance> | MonthlyPerformanceResponse>(
      apiClient.get(`/manager/users/monthly-performance${qs(params)}`),
    ),
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
      apiClient.get<ListResponse<UserProgress>>("/manager/users/progress"),
    ),
  workStatusSummary: (
    token: string,
    params: { userId: string; from: string; to: string },
  ) =>
    unwrapAxios<WorkStatusSummary>(
      apiClient.get(`/manager/users/work-status-summary${qs(params)}`),
      "دریافت گزارش عملکرد کاربر ناموفق بود",
    ),
  overdueTasks: (
    token: string,
    params: { userId?: string; from: string; to: string },
  ) =>
    unwrapAxios<ManagerTaskListResponse>(
      apiClient.get(`/manager/tasks/overdue${qs(params)}`),
      "دریافت پروژه‌های معوق ناموفق بود",
    ),
  doneTasks: (
    token: string,
    params: { userId?: string; from: string; to: string },
  ) =>
    unwrapAxios<ManagerTaskListResponse>(
      apiClient.get(`/manager/tasks/done${qs(params)}`),
      "دریافت پروژه‌های انجام‌شده ناموفق بود",
    ),
  todoTasks: (
    token: string,
    params: { userId?: string; from: string; to: string },
  ) =>
    unwrapAxios<ManagerTaskListResponse>(
      apiClient.get(`/manager/tasks/todo${qs(params)}`),
      "دریافت پروژه‌های در انتظار ناموفق بود",
    ),
  dailyDurationBalance: (
    token: string,
    params: { userId: string; from: string; to: string },
  ) =>
    unwrapAxios<DailyDurationBalance>(
      apiClient.get(`/manager/fixed-tasks/daily-duration-balance${qs(params)}`),
      "دریافت تراز مدت زمان روزانه ناموفق بود",
    ),
  overdueFixedTasks: (
    token: string,
    params: { userId?: string; from: string; to: string },
  ) =>
    unwrapAxios<ListResponse<FixedTask>>(
      apiClient.get(`/manager/fixed-tasks/overdue${qs(params)}`),
      "دریافت گزارش‌های ثابت معوق ناموفق بود",
    ),
  doneFixedTasks: (
    token: string,
    params: { userId?: string; from: string; to: string },
  ) =>
    unwrapAxios<ListResponse<FixedTask>>(
      apiClient.get(`/manager/fixed-tasks/done${qs(params)}`),
      "دریافت گزارش‌های ثابت انجام‌شده ناموفق بود",
    ),
  todoFixedTasks: (token: string, params?: { userId?: string }) =>
    unwrapAxios<ListResponse<FixedTask>>(
      apiClient.get(`/manager/fixed-tasks/todo${qs(params ?? {})}`),
      "دریافت گزارش‌های ثابت در انتظار ناموفق بود",
    ),
  leaveRequests: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<LeaveRequest>>(
        `/manager/leave-requests${qs(params)}`,
      ),
    ),
  approveLeaveRequest: (token: string, id: string) =>
    unwrapAxios(
      apiClient.patch<LeaveRequest>(
        `/manager/leave-requests/${id}/approve`,
      ),
      "تایید درخواست مرخصی ناموفق بود",
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
  members: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<SupervisorMember>>(
        `/supervisor/members${qs(params)}`,
      ),
    ),
  tasks: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<Task>>(`/supervisor/tasks${qs(params)}`),
    ),
  workFieldSpecialists: (token: string) =>
    unwrapAxios(
      apiClient.get<ListResponse<User>>("/supervisor/work-field-specialists"),
    ),
  reviewExtraTask: (
    token: string,
    id: string,
    status: Exclude<ExtraTaskApprovalStatus, "pending">,
  ) =>
    unwrapAxios(
      apiClient.patch<Task>(`/supervisor/extra-tasks/${id}/approval`, {
        status,
      }),
      "بررسی پروژه مازاد ناموفق بود",
    ),
  fixedTasks: (token: string, params?: BoolParams) =>
    unwrapAxios(
      apiClient.get<ListResponse<FixedTask>>(
        `/supervisor/fixed-tasks${qs(params)}`,
      ),
    ),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: (token: string, params?: BoolParams) =>
    unwrapAxios(
      apiClient.get<ListResponse<Notification>>(
        `/notifications/me${qs(params)}`,
      ),
    ),
  unreadCount: (token: string) =>
    unwrapAxios(
      apiClient.get<{ unreadCount: number }>("/notifications/me/unread-count"),
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
  list: (token: string, params?: BoolParams) =>
    unwrapAxios(
      apiClient.get<ListResponse<FixedTask>>(`/fixed-tasks${qs(params)}`),
    ),
  activeByUserId: (token: string, userId: string) =>
    unwrapAxios(
      apiClient.get<ListResponse<FixedTask>>(
        `/fixed-tasks/active${qs({ userId })}`,
      ),
      "دریافت گزارش‌های فعال ناموفق بود",
    ),
  doneByUserIdInRange: (
    token: string,
    userId: string,
    params: { from: string; to: string; page?: number; limit?: number },
  ) =>
    unwrapAxios(
      apiClient.get<ListResponse<FixedTask>>(
        `/fixed-tasks/user/${userId}/done/range${qs(params)}`,
      ),
      "Ø¯Ø±ÛŒØ§ÙØª Ú¯Ø²Ø§Ø±Ø´â€ŒÙ‡Ø§ÛŒ ØªÚ©Ù…ÛŒÙ„â€ŒØ´Ø¯Ù‡ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯",
    ),
  get: (token: string, id: string) =>
    unwrapAxios(apiClient.get<FixedTask>(`/fixed-tasks/${id}`)),
  create: (token: string, body: FixedTaskPayload) =>
    unwrapAxios(
      apiClient.post<FixedTask>("/fixed-tasks", body),
      "ساخت گزارش ثابت ناموفق بود",
    ),
  update: (
    token: string,
    id: string,
    userId: string,
    body: Partial<FixedTaskPayload>,
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(`/fixed-tasks/${id}${qs({ userId })}`, body),
      "بروزرسانی گزارش ثابت ناموفق بود",
    ),
  // Assignee (specialist) may PATCH only the status field — board drag & drop.
  updateStatus: (
    token: string,
    id: string,
    status: FixedTaskStatus,
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(`/fixed-tasks/${id}`, { status }),
      "تغییر وضعیت گزارش ثابت ناموفق بود",
    ),
  rate: (
    token: string,
    id: string,
    body: { score: number; ratingComment?: string },
  ) =>
    unwrapAxios(
      apiClient.patch<FixedTask>(`/fixed-tasks/${id}/rating`, body),
      "ثبت امتیاز گزارش ناموفق بود",
    ),
  delete: (token: string, id: string) =>
    unwrapAxios(
      apiClient.delete(`/fixed-tasks/${id}`),
      "حذف گزارش ثابت ناموفق بود",
    ),
  seedFromExcel: (token: string) =>
    unwrapAxios<ExcelSeedResult>(
      apiClient.post("/fixed-tasks/seed/excel"),
      "ایمپورت از اکسل ناموفق بود",
    ),
  bySpecialist: (token: string, userId: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<FixedTask>>(
        `/fixed-tasks/specialist/${userId}${qs(params)}`,
      ),
    ),
  statusCounts: (token: string) =>
    unwrapAxios(apiClient.get<StatusCounts>("/fixed-tasks/status-counts")),
  scheduledStatusCounts: (token: string) =>
    unwrapAxios(
      apiClient.get<StatusCounts>("/fixed-tasks/me/scheduled-status-counts"),
    ),
};

// ─── Leave Requests ──────────────────────────────────────────────────────────
export const leaveApi = {
  statistics: (token: string) =>
    unwrapAxios(
      apiClient.get<LeaveRequestStatistics>("/leave-requests/statistics"),
    ),
  list: (token: string, params?: Params) =>
    unwrapAxios(
      apiClient.get<ListResponse<LeaveRequest>>(`/leave-requests${qs(params)}`),
    ),
  byUser: (token: string, userId: string) =>
    unwrapAxios(
      apiClient.get<LeaveRequest[]>(`/leave-requests/user/${userId}`),
    ),
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
  list: (token: string, params?: Params) =>
    unwrapAxios(apiClient.get<ListResponse<ExcelFile>>(`/excel${qs(params)}`)),
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
    unwrapAxios(apiClient.get<ExcelStatistics>(`/excel/statistics/${userId}`)),
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
