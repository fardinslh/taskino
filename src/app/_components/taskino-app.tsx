"use client";

import type { ReactNode } from "react";

import type { View } from "../_lib/task-constants";
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
  const {
    activeView,
    authHydrated,
    claimTask,
    confirmRejectLeave,
    createTaskFromValues,
    currentUser,
    darkMode,
    deleteTask,
    error,
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
    moveTask,
    notifications,
    overdueTasks,
    popupNotif,
    rejectLeaveId,
    rejectReason,
    selectedTask,
    setDarkMode,
    setError,
    setMessage,
    setPopupNotif,
    setRejectLeaveId,
    setRejectReason,
    setSelectedTask,
    setShowNotifications,
    setSidebarCollapsed,
    setTaskQuery,
    showNotifications,
    sidebarCollapsed,
    statsUsers,
    supervisorFixedTasks,
    supervisorTasks,
    taskQuery,
    tasks,
    token,
    unreadCount,
    updateTask,
    users,
    setActiveView,
  } = controller;

  if (!authHydrated || !token) return null;

  return (
    <TaskinoProvider value={controller}>
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
          onClearSearch={() => setTaskQuery("")}
          onLogout={logout}
          onMarkAllNotificationsRead={() => void markAllNotificationsRead()}
          onMarkNotificationRead={(id) => void markNotificationRead(id)}
          onRefresh={() => void loadData()}
          onSearchChange={setTaskQuery}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          searchQuery={taskQuery}
          showNotifications={showNotifications}
          sidebarCollapsed={sidebarCollapsed}
          unreadCount={unreadCount}
        />

        <div className="flex">
          <TaskinoSidebar
            activeView={activeView}
            currentUser={currentUser}
            isManager={isManager}
            isSupervisor={isSupervisor}
            leaveRequests={leaveRequests}
            onSetActiveView={setActiveView}
            onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
            overdueTasks={overdueTasks}
            sidebarCollapsed={sidebarCollapsed}
            statsUsers={statsUsers}
            supervisorFixedTasks={supervisorFixedTasks}
            supervisorTasks={supervisorTasks}
            tasks={tasks}
          />

          <main
            className="min-w-0 flex-1 space-y-4 overflow-auto p-4"
            onClick={() => showNotifications && setShowNotifications(false)}
          >
            {children}
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

        {selectedTask && (
          <SelectedTaskPanel
            canClaim={isSpecialist}
            canEdit={isManager}
            onClaim={(taskId) => void claimTask(taskId)}
            onClose={() => setSelectedTask(null)}
            onDelete={(taskId) => void deleteTask(taskId)}
            onError={setError}
            onStatusChange={(taskId, status) => void moveTask(taskId, status)}
            onUpdate={(taskId, body) => void updateTask(taskId, body)}
            task={selectedTask}
            token={token}
            users={users}
          />
        )}
      </div>
    </TaskinoProvider>
  );
}
