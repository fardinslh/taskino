"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  fixedTaskApi,
  getId,
  leaveApi,
  managerApi,
  normalizeList,
  notificationApi,
  supervisorApi,
  taskApi,
  userApi,
  type FixedTask,
  type LeaveRequest,
  type LeaveRequestStatistics,
  type ManagerAllTasks,
  type ManagerStats,
  type ManagerTaskStatusRange,
  type MonthlyPerformance,
  type MyProgressStats,
  type MyWorkSummary,
  type Notification,
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

type DataLoaderInput = {
  token: string;
  currentUser: User | null;
  myId: string;
  setLoadingData: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setLeaveRequests: Dispatch<SetStateAction<LeaveRequest[]>>;
  setLeaveStatistics: Dispatch<SetStateAction<LeaveRequestStatistics | null>>;
  setSpecialistTaskCounts: Dispatch<SetStateAction<StatusCounts | null>>;
  setSpecialistFixedTaskCounts: Dispatch<SetStateAction<StatusCounts | null>>;
  setSpecialistProgressStats: Dispatch<SetStateAction<MyProgressStats | null>>;
  setSpecialistWorkSummary: Dispatch<SetStateAction<MyWorkSummary | null>>;
  setManagerStats: Dispatch<SetStateAction<ManagerStats | null>>;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setFixedTasks: Dispatch<SetStateAction<FixedTask[]>>;
  setManagerTaskStatus: Dispatch<SetStateAction<TaskStatusOverview | null>>;
  setManagerTaskStatusRange: Dispatch<SetStateAction<ManagerTaskStatusRange | null>>;
  setManagerUserCounts: Dispatch<SetStateAction<UserTaskCount[]>>;
  setManagerMonthlyPerf: Dispatch<SetStateAction<MonthlyPerformance[]>>;
  setManagerUserProgress: Dispatch<SetStateAction<UserProgress[]>>;
  setSupervisorStats: Dispatch<SetStateAction<SupervisorStats | null>>;
  setSupervisorTaskStatistics: Dispatch<
    SetStateAction<SupervisorTaskStatistics | null>
  >;
  setSupervisorMembers: Dispatch<SetStateAction<SupervisorMember[]>>;
  setSupervisorTasks: Dispatch<SetStateAction<Task[]>>;
  setSupervisorFixedTasks: Dispatch<SetStateAction<FixedTask[]>>;
  setOverdueTasks: Dispatch<SetStateAction<Task[]>>;
  setTeamPerformance: Dispatch<SetStateAction<any>>;
};

export function useDataLoader({
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
  setManagerTaskStatusRange,
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
}: DataLoaderInput) {
  function dedupeFixedTasks(items: FixedTask[]) {
    return items.filter((item, index, list) => {
      const id = getId(item);
      return !!id && list.findIndex((entry) => getId(entry) === id) === index;
    });
  }

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
      if (list.length === 0 || list.length < limit || all.length >= total)
        break;
    }
    return all;
  }

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
      if (list.length === 0 || list.length < limit || all.length >= total)
        break;
    }
    return all;
  }

  async function fetchActiveFixedTasksByUserId(
    authToken: string,
    userId: string,
  ) {
    if (!userId.trim()) return [];
    const response = await fixedTaskApi.activeByUserId(authToken, userId).catch(
      () => null,
    );
    if (!response) return [];
    return normalizeList(response as FixedTask[] | { data?: FixedTask[] });
  }

  async function fetchDoneFixedTasksByUserId(
    authToken: string,
    userId: string,
  ) {
    if (!userId.trim()) return [];
    const all: FixedTask[] = [];
    const limit = 100;
    for (let page = 1; page <= 50; page++) {
      const response = await fixedTaskApi
        .doneByUserId(authToken, userId, { page, limit })
        .catch(() => null);
      if (!response) break;
      const list = normalizeList(
        response as FixedTask[] | { data?: FixedTask[] },
      );
      all.push(...list);
      const total =
        response &&
        typeof response === "object" &&
        "total" in (response as Record<string, unknown>)
          ? Number((response as Record<string, unknown>).total)
          : all.length;
      if (list.length === 0 || list.length < limit || all.length >= total) {
        break;
      }
    }
    return all;
  }

  async function fetchBoardFixedTasksByUserId(
    authToken: string,
    userId: string,
  ) {
    const [active, done] = await Promise.all([
      fetchActiveFixedTasksByUserId(authToken, userId),
      fetchDoneFixedTasksByUserId(authToken, userId),
    ]);
    return dedupeFixedTasks([...active, ...done]);
  }

  async function loadManagerAnalytics(authToken = token) {
    if (!authToken) return;
    try {
      const now = new Date();
      const dateParam = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const from = dateParam(new Date(now.getFullYear(), now.getMonth(), 1));
      const to = dateParam(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const [taskStatus, statusRange, userCounts, monthlyPerf, recurring, progress] =
        await Promise.all([
          managerApi.taskStatusOverview(authToken).catch(() => null),
          managerApi.taskStatusRange(authToken, from, to).catch(() => null),
          managerApi.taskCountsByUsers(authToken).catch(() => []),
          managerApi.monthlyPerformance(authToken).catch(() => []),
          fetchAllFixedTasks(authToken).catch(() => [] as FixedTask[]),
          managerApi.usersProgress(authToken).catch(() => []),
        ]);
      setManagerTaskStatus(taskStatus);
      setManagerTaskStatusRange(statusRange);
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
      setFixedTasks(dedupeFixedTasks(recurring as FixedTask[]));
      setManagerUserProgress(
        normalizeList(progress as UserProgress[] | { data?: UserProgress[] }),
      );
    } catch {}
  }

  async function loadSupervisorData(authToken = token) {
    if (!authToken) return;
    try {
      const [
        stats,
        taskStats,
        membersResponse,
        tasksResponse,
        fixedTasksResponse,
      ] = await Promise.all([
        supervisorApi.statistics(authToken).catch(() => null),
        supervisorApi.taskStatistics(authToken).catch(() => null),
        supervisorApi
          .members(authToken, { page: 1, limit: 100 })
          .catch(() => []),
        supervisorApi.tasks(authToken, { page: 1, limit: 100 }).catch(() => []),
        supervisorApi
          .fixedTasks(authToken, { page: 1, limit: 100 })
          .catch(() => []),
      ]);
      setSupervisorTaskStatistics(taskStats);
      const members = normalizeList(
        membersResponse as SupervisorMember[] | { data?: SupervisorMember[] },
      );
      const supervisedTasks = normalizeList(
        tasksResponse as Task[] | { data?: Task[] },
      );
      const memberIds = members
        .map((member) => member.userId ?? getId(member))
        .filter((id): id is string => !!id);
      const doneFixedTaskLists = await Promise.all(
        memberIds.map((memberId) =>
          fetchDoneFixedTasksByUserId(authToken, memberId).catch(
            () => [] as FixedTask[],
          ),
        ),
      );
      const supervisedFixedTasks = dedupeFixedTasks([
        ...normalizeList(
          fixedTasksResponse as FixedTask[] | { data?: FixedTask[] },
        ),
        ...doneFixedTaskLists.flat(),
      ]);
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
      setOverdueTasks(overdue);
      setManagerUserProgress(members as UserProgress[]);
      setUsers(
        members
          .filter(
            (member) =>
              (member.userId ?? getId(member)) !== currentUser?._id,
          )
          .map((member) => ({
            _id: member.userId ?? getId(member),
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            mobile: member.mobile,
            roles: member.role,
            workField: currentUser?.workField,
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
      const userHasPersonalTaskBoard =
        currentRole === "specialist" || currentRole === "supervisor";
      const shouldLoadLeaveStats = currentRole === "manager";
      const [u, t, leaves, statsRes, unreadRes, notifRes, leaveStatsRes] =
        await Promise.all([
          userIsManager
            ? managerApi.users(authToken, { limit: 100 }).catch(() => [])
            : Promise.resolve([] as User[]),
          userIsManager
            ? managerApi
                .allTasks(authToken)
                .catch(() => ({ tasks: [] as Task[] }))
            : taskApi.list(authToken).catch(() => []),
          userIsManager
            ? managerApi.leaveRequests(authToken, { page: 1, limit: 50 })
            : uid && !userIsSupervisor
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
      const [
        specialistTaskCountsRes,
        specialistFixedTaskCountsRes,
        specialistProgressRes,
        specialistWorkSummaryRes,
      ] = userHasPersonalTaskBoard
        ? await Promise.all([
            taskApi.statusCounts(authToken).catch(() => null),
            userIsSpecialist
              ? Promise.resolve(null)
              : Promise.resolve(null),
            userApi.meProgress(authToken).catch(() => null),
            Promise.resolve(null),
          ])
        : [null, null, null, null];
      const publicTaskResponses =
        userIsManager
          ? []
          : [await taskApi.publicActive(authToken).catch(() => [])];
      const taskList = normalizeList(
        [
          ...normalizeList(
            ((t as ManagerAllTasks)?.tasks ?? t) as
              | Task[]
              | { data?: Task[] },
          ),
          ...publicTaskResponses.flatMap((response) =>
            normalizeList(response as Task[] | { data?: Task[] }),
          ),
        ],
      )
        .filter((task, index, list) => {
          const taskId = getId(task);
          return !!taskId && list.findIndex((item) => getId(item) === taskId) === index;
        })
        .filter((task) => {
          if (userIsManager || !uid) return true;
          const assignedTo = task.assignedTo;
          const rawAssignedTo = assignedTo as unknown;
          const assignedList = Array.isArray(assignedTo) ? assignedTo : [];
          const isAssignedToMe = assignedList.some(
            (assignee) => getId(assignee) === uid,
          );
          const isGeneralProject =
            task.isPublic ||
            task.projectType === "general" ||
            (typeof rawAssignedTo === "string" && rawAssignedTo === "");

          return isAssignedToMe || isGeneralProject;
        })
        .map((task) => ({
          ...task,
          assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
        }));
      if (currentRole !== "supervisor") {
        setUsers(normalizeList(u));
      }
      setTasks(taskList);
      setLeaveRequests(normalizeList(leaves));
      setLeaveStatistics(leaveStatsRes);
      setSpecialistTaskCounts(specialistTaskCountsRes);
      setSpecialistFixedTaskCounts(specialistFixedTaskCountsRes);
      setSpecialistProgressStats(specialistProgressRes);
      setSpecialistWorkSummary(specialistWorkSummaryRes);
      setManagerStats(statsRes);
      setUnreadCount(unreadRes.unreadCount);
      setNotifications(
        normalizeList(notifRes as Notification[] | { data?: Notification[] }),
      );
      const role = (currentUser ?? storedUser)?.roles;
      if (role === "manager") void loadManagerAnalytics(authToken);
      else if (role === "supervisor" && uid) {
        void loadSupervisorData(authToken);
        fetchBoardFixedTasksByUserId(authToken, uid)
          .then((r) => setFixedTasks(r))
          .catch(() => setFixedTasks([]));
      } else if (uid) {
        fetchBoardFixedTasksByUserId(authToken, uid)
          .then((r) => {
            setFixedTasks(r);
            if (userIsSpecialist) {
              const counts = r.reduce<StatusCounts>(
                (acc, item) => {
                  const status = item.status ?? "todo";
                  acc.total = (acc.total ?? 0) + 1;
                  if (status === "todo") {
                    acc.todo = (acc.todo ?? 0) + 1;
                    acc.pending = (acc.pending ?? 0) + 1;
                  } else if (status === "in_progress") {
                    acc.inProgress = (acc.inProgress ?? 0) + 1;
                    acc.in_progress = (acc.in_progress ?? 0) + 1;
                  } else if (status === "done") {
                    acc.done = (acc.done ?? 0) + 1;
                    acc.completed = (acc.completed ?? 0) + 1;
                  }
                  return acc;
                },
                { total: 0, todo: 0, pending: 0, inProgress: 0, in_progress: 0, done: 0, completed: 0 },
              );
              setSpecialistFixedTaskCounts(counts);
            }
          })
          .catch(() => setFixedTasks([]));
      } else {
        setFixedTasks([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "دریافت اطلاعات ناموفق بود",
      );
    } finally {
      setLoadingData(false);
    }
  }

  async function loadSelectedSpecialistFixedTasks(
    authToken: string,
    specialistId: string,
  ) {
    if (!specialistId) return [];
    const [specialistTasks, specialistDoneTasks] = await Promise.all([
      fetchAllSpecialistFixedTasks(authToken, specialistId),
      fetchDoneFixedTasksByUserId(authToken, specialistId),
    ]);
    return dedupeFixedTasks([...specialistTasks, ...specialistDoneTasks]);
  }

  return {
    loadData,
    loadManagerAnalytics,
    loadSupervisorData,
    loadSelectedSpecialistFixedTasks,
  };
}
