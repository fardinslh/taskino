"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import {
  fixedTaskApi,
  getId,
  taskApi,
  type Notification,
} from "@/lib/api";
import type { View } from "../_lib/task-constants";
import { notificationTarget } from "../_lib/task-helpers";
import { AiAssistant } from "./ai-assistant";
import { SelectedFixedTaskPanel } from "./selected-fixed-task-panel";
import { SelectedTaskPanel } from "./selected-task-panel";
import { TaskinoProvider, useTaskinoProviderValue } from "./taskino-context";
import { NotificationDialog, RejectLeaveDialog } from "./taskino-dialogs";
import { TaskinoHeader } from "./taskino-header";
import { TaskinoSidebar } from "./taskino-sidebar";
import { Toast } from "./shared";

type TaskinoAppProps = {
  initialView?: View;
  children?: ReactNode;
};

export function TaskinoApp({
  initialView = "dashboard",
  children,
}: TaskinoAppProps) {
  const controller = useTaskinoProviderValue(initialView);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    activeView,
    activeFixedTaskCount,
    authHydrated,
    claimTask,
    confirmRejectLeave,
    currentUser,
    darkMode,
    deleteTask,
    error,
    fixedTasks,
    isManager,
    isSpecialist,
    isSupervisor,
    leaveRequests,
    loadData,
    loadingData,
    logout,
    markAllNotificationsRead,
    markNotificationRead,
    message,
    myId,
    notifications,
    overdueTasks,
    popupNotif,
    rejectLeaveId,
    rejectReason,
    selectedFixedTask,
    selectedTask,
    setDarkMode,
    setError,
    setMessage,
    setPopupNotif,
    setRejectLeaveId,
    setRejectReason,
    setSelectedFixedTask,
    setSelectedTask,
    setFixedTasks,
    setShowNotifications,
    setSidebarCollapsed,
    showNotifications,
    sidebarCollapsed,
    statsUsers,
    supervisorStats,
    supervisorTasks,
    tasks,
    token,
    unreadCount,
    updateTask,
    uploadTaskCompletionFile,
    users,
    setActiveView,
  } = controller;
  const selectedFixedTaskAssigneeId = getId(selectedFixedTask?.assignedTo);
  const selectedTaskAssigneeIds = (selectedTask?.assignedTo ?? []).map((user) =>
    getId(user),
  );
  const canUploadTaskCompletionFile =
    isSpecialist ||
    (isSupervisor &&
      activeView === "supervisor-my-projects" &&
      selectedTaskAssigneeIds.includes(myId));
  const canSupervisorEditFixedTask =
    isSupervisor &&
    !!selectedFixedTask &&
    !!selectedFixedTaskAssigneeId &&
    selectedFixedTaskAssigneeId !== myId;

  function findTaskByTitle(title?: string) {
    if (!title) return null;
    const normalizedTitle = title.trim().toLowerCase();
    return (
      tasks.find((task) => task.title.trim().toLowerCase() === normalizedTitle) ??
      null
    );
  }

  function findFixedTaskByTitle(title?: string) {
    if (!title) return null;
    const normalizedTitle = title.trim().toLowerCase();
    return (
      fixedTasks.find(
        (task) => task.title.trim().toLowerCase() === normalizedTitle,
      ) ?? null
    );
  }

  async function openNotificationTarget(notification: Notification) {
    setShowNotifications(false);

    const target = notificationTarget(notification);
    let opened = false;

    try {
      if (target?.kind === "fixedTask") {
        const localTask =
          (target.id
            ? fixedTasks.find((task) => getId(task) === target.id)
            : null) ?? findFixedTaskByTitle(target.title);
        const fetchedTask =
          !localTask && target.id
            ? await fixedTaskApi.get(token, target.id).catch(() => null)
            : null;
        const task = localTask ?? fetchedTask;

        if (task) {
          setSelectedTask(null);
          setSelectedFixedTask(task);
          opened = true;
        }
      } else if (target?.kind === "task") {
        const localTask =
          (target.id
            ? tasks.find((task) => getId(task) === target.id)
            : null) ?? findTaskByTitle(target.title);
        const fetchedTask =
          !localTask && target.id
            ? await taskApi.get(token, target.id).catch(() => null)
            : null;
        const task = localTask ?? fetchedTask;

        if (task) {
          setSelectedFixedTask(null);
          setSelectedTask(task);
          opened = true;
        }
      }

      if (target && !opened) {
        setError("گزارش مربوط به این اعلان پیدا نشد.");
      }
    } finally {
      void markNotificationRead(getId(notification));
    }
  }

  async function rateSelectedFixedTask(
    taskId: string,
    score: number,
    ratingComment?: string,
  ) {
    const ratedTask = await fixedTaskApi.rate(token, taskId, {
      ...(ratingComment ? { ratingComment } : {}),
      score,
    });

    setFixedTasks((current) =>
      current.map((task) => (getId(task) === taskId ? ratedTask : task)),
    );
    setSelectedFixedTask(ratedTask);
    setMessage("امتیاز گزارش ثبت شد.");
  }

  return (
    <TaskinoProvider value={controller}>
      <MotionConfig reducedMotion="user">
      {!authHydrated || !token ? null : (
      <div className="min-h-screen bg-[--bg] text-[--text]">
        <Toast
          message={error || message}
          onClose={() => (error ? setError("") : setMessage(""))}
          type={error ? "error" : "success"}
        />

        <TaskinoHeader
          currentUser={currentUser}
          darkMode={darkMode}
          loadingData={loadingData}
          notifications={notifications}
          onLogout={logout}
          onMarkAllNotificationsRead={() => void markAllNotificationsRead()}
          onNotificationClick={(notification) =>
            void openNotificationTarget(notification)
          }
          onRefresh={() => void loadData()}
          onToggleMobileSidebar={() => setMobileSidebarOpen((value) => !value)}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          showNotifications={showNotifications}
          sidebarCollapsed={sidebarCollapsed}
          unreadCount={unreadCount}
        />

        <div className="flex">
          <TaskinoSidebar
            activeView={activeView}
            activeFixedTaskCount={activeFixedTaskCount}
            currentUser={currentUser}
            isManager={isManager}
            isSupervisor={isSupervisor}
            leaveRequests={leaveRequests}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onSetActiveView={(view) => {
              setMobileSidebarOpen(false);
              setActiveView(view);
            }}
            onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
            overdueTasks={overdueTasks}
            sidebarCollapsed={sidebarCollapsed}
            statsUsers={statsUsers}
            supervisorStats={supervisorStats}
            supervisorTasks={supervisorTasks}
            tasks={tasks}
          />

          <main
            className="min-w-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-4"
            onClick={() => showNotifications && setShowNotifications(false)}
          >
            <motion.div
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              key={activeView}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {rejectLeaveId && (
          <RejectLeaveDialog
            onCancel={() => {
              setRejectLeaveId(null);
              setRejectReason("");
            }}
            onConfirm={() => void confirmRejectLeave()}
            onReasonChange={setRejectReason}
            reason={rejectReason}
          />
        )}

        {popupNotif && (
          <NotificationDialog
            notification={popupNotif}
            onClose={() => setPopupNotif(null)}
            onRead={(id) => {
              setPopupNotif(null);
              void markNotificationRead(id);
            }}
          />
        )}

        <AnimatePresence>
          {selectedTask && (
            <SelectedTaskPanel
            canClaim={isSpecialist}
            canDownloadCompletionFile={isManager || isSupervisor}
            canEdit={isManager}
            onClaim={(taskId) => void claimTask(taskId)}
            onClose={() => setSelectedTask(null)}
            onDelete={(taskId) => void deleteTask(taskId)}
            onError={setError}
            onUpdate={(taskId, body) => void updateTask(taskId, body)}
            onUploadCompletionFile={
              canUploadTaskCompletionFile
                ? (taskId, file) => void uploadTaskCompletionFile(taskId, file)
                : undefined
            }
            task={selectedTask}
            token={token}
            users={users}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedFixedTask && (
            <SelectedFixedTaskPanel
            canChangeStatus={isSpecialist}
            canDeleteTemplate={isManager}
            canEditTemplate={isManager || canSupervisorEditFixedTask}
            canRate={isManager}
            onClose={() => setSelectedFixedTask(null)}
            onDelete={(taskId) => void controller.deleteFixedTask(taskId)}
            onEdit={(task) => {
              setSelectedFixedTask(null);
              setActiveView(
                isSupervisor ? "supervisor-create-report" : "fixed-reports",
              );
              controller.openFixedTaskForm(task);
            }}
            onStatusChange={async (taskId, status) => {
              const updated = await controller.moveFixedTask(taskId, status);
              if (updated) setSelectedFixedTask(updated);
            }}
            onRate={rateSelectedFixedTask}
            task={selectedFixedTask}
            />
          )}
        </AnimatePresence>
        <AiAssistant token={token} />
      </div>
      )}
      </MotionConfig>
    </TaskinoProvider>
  );
}
