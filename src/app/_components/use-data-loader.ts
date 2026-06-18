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

  async function loadManagerAnalytics(authToken = token) {
    if (!authToken) return;
    try {
      const [taskStatus, userCounts, monthlyPerf, recurring, progress] =
        await Promise.all([
          managerApi.taskStatusOverview(authToken).catch(() => null),
          managerApi.taskCountsByUsers(authToken).catch(() => []),
          managerApi.monthlyPerformance(authToken).catch(() => []),
          fetchAllFixedTasks(authToken, {
            status: "todo",
            startDate: "",
            endDate: "",
          }).catch(() => [] as FixedTask[]),
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
      setOverdueTasks(overdue);
      setManagerUserProgress(members as UserProgress[]);
      setUsers(
        members
          .filter((member) => member.userId !== currentUser?._id)
          .map((member) => ({
            _id: member.userId,
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
      const [
        specialistTaskCountsRes,
        specialistFixedTaskCountsRes,
        specialistProgressRes,
        specialistWorkSummaryRes,
      ] = userHasPersonalTaskBoard
        ? await Promise.all([
            taskApi.statusCounts(authToken).catch(() => null),
            userIsSpecialist
              ? fixedTaskApi.statusCounts(authToken).catch(() => null)
              : Promise.resolve(null),
            userIsSpecialist
              ? userApi.meProgress(authToken).catch(() => null)
              : Promise.resolve(null),
            userIsSpecialist
              ? userApi.meWorkSummary(authToken).catch(() => null)
              : Promise.resolve(null),
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
        fetchAllFixedTasks(authToken, {
          status: "todo",
          startDate: "",
          endDate: "",
        })
          .then((r) => setFixedTasks(r))
          .catch(() => setFixedTasks([]));
      } else if (uid) {
        fetchAllSpecialistFixedTasks(authToken, uid, { status: "todo" })
          .then((r) => setFixedTasks(r))
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
    return fetchAllSpecialistFixedTasks(authToken, specialistId, {
      status: "todo",
    });
  }

  return {
    loadData,
    loadManagerAnalytics,
    loadSupervisorData,
    loadSelectedSpecialistFixedTasks,
  };
}
