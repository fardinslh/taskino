"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { getId } from "@/lib/api";
import type { View } from "../_lib/task-constants";
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
    setShowNotifications,
    setSidebarCollapsed,
    setTaskQuery,
    showNotifications,
    sidebarCollapsed,
    statsUsers,
    supervisorStats,
    supervisorTasks,
    taskQuery,
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
          onClearSearch={() => setTaskQuery("")}
          onLogout={logout}
          onMarkAllNotificationsRead={() => void markAllNotificationsRead()}
          onMarkNotificationRead={(id) => void markNotificationRead(id)}
          onRefresh={() => void loadData()}
          onSearchChange={setTaskQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen((value) => !value)}
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
              animate={{ opacity: 1, scale: 1, y: 0 }}
              initial={{ opacity: 0, scale: 0.992, y: 14 }}
              key={activeView}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
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
            canChangeStatus={isSpecialist || isSupervisor}
            canDeleteTemplate={isManager}
            canEditTemplate={isManager || canSupervisorEditFixedTask}
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
