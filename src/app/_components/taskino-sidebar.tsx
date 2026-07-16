"use client";

/* eslint-disable @next/next/no-img-element -- User avatars may come from arbitrary backend hosts. */

import {
  BarChart2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import type { LeaveRequest, SupervisorStats, Task, User } from "@/lib/api";
import { type View } from "../_lib/task-constants";
import { avatarUrl, initials, roleLabel, userName } from "../_lib/task-helpers";
import { SideItem } from "./shared";

type TaskinoSidebarProps = {
  activeView: View;
  activeFixedTaskCount: number;
  currentUser: User | null;
  isManager: boolean;
  isSupervisor: boolean;
  leaveRequests: LeaveRequest[];
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSetActiveView: (view: View) => void;
  onToggleCollapsed: () => void;
  overdueTasks: Task[];
  sidebarCollapsed: boolean;
  statsUsers: number;
  supervisorStats: SupervisorStats | null;
  supervisorTasks: Task[];
  tasks: Task[];
};

export function TaskinoSidebar({
  activeView,
  activeFixedTaskCount,
  currentUser,
  isManager,
  isSupervisor,
  leaveRequests,
  mobileOpen = false,
  onCloseMobile,
  onSetActiveView,
  onToggleCollapsed,
  overdueTasks,
  sidebarCollapsed,
  statsUsers,
  supervisorStats,
  supervisorTasks,
  tasks,
}: TaskinoSidebarProps) {
  const pendingLeaves = leaveRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const currentUserAvatarUrl = avatarUrl(currentUser ?? undefined);
  void overdueTasks;
  void supervisorStats;
  void supervisorTasks;

  function handleSelect(view: View) {
    onSetActiveView(view);
    onCloseMobile?.();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-screen shrink-0 overflow-y-auto overflow-x-hidden border-l border-[--border] bg-[--surface] transition-all duration-200 lg:sticky lg:top-[53px] lg:z-auto lg:h-[calc(100vh-53px)] ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        style={{ width: sidebarCollapsed ? 64 : 248 }}
      >
        <div className="flex items-center justify-between border-b border-[--border] px-3 py-2">
          {!sidebarCollapsed && (
            <span className="text-xs font-semibold text-[--text-3]">منو</span>
          )}
          <button
            className="mr-auto flex h-7 w-7 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2] hover:text-[--text]"
            onClick={onToggleCollapsed}
            type="button"
          >
            {sidebarCollapsed ? (
              <ChevronLeft size={15} />
            ) : (
              <ChevronRight size={15} />
            )}
          </button>
        </div>

        <nav className="space-y-0.5 p-2">
          {isSupervisor ? (
            <>
              <SideItem
                active={activeView === "dashboard"}
                collapsed={sidebarCollapsed}
                icon={LayoutDashboard}
                label="داشبورد"
                onClick={() => handleSelect("dashboard")}
              />
              <SideItem
                active={
                  activeView === "tasks" ||
                  activeView === "supervisor-create-report" ||
                  activeView === "supervisor-projects"
                }
                collapsed={sidebarCollapsed}
                icon={ClipboardList}
                label="گزارش‌ها"
                onClick={() => handleSelect("supervisor-create-report")}
              />
              <div
                className={
                  sidebarCollapsed ? "space-y-0.5" : "space-y-0.5 pr-5"
                }
              >
                <SideItem
                  active={activeView === "supervisor-create-report"}
                  collapsed={sidebarCollapsed}
                  icon={Plus}
                  label="ایجاد گزارش"
                  onClick={() => handleSelect("supervisor-create-report")}
                />
                <SideItem
                  active={activeView === "tasks"}
                  collapsed={sidebarCollapsed}
                  icon={ClipboardList}
                  label="گزارش‌های من"
                  onClick={() => handleSelect("tasks")}
                />
                <SideItem
                  active={activeView === "supervisor-projects"}
                  collapsed={sidebarCollapsed}
                  icon={FolderKanban}
                  label="گزارش‌های تحت نظر"
                  onClick={() => handleSelect("supervisor-projects")}
                />
              </div>
              <SideItem
                active={
                  activeView === "supervisor-create-project" ||
                  activeView === "supervisor-my-projects" ||
                  activeView === "supervisor-watched-projects" ||
                  activeView === "manager-extra-projects"
                }
                collapsed={sidebarCollapsed}
                icon={FolderKanban}
                label="پروژه‌ها"
                onClick={() => handleSelect("supervisor-create-project")}
              />
              <div
                className={
                  sidebarCollapsed ? "space-y-0.5" : "space-y-0.5 pr-5"
                }
              >
                <SideItem
                  active={activeView === "supervisor-create-project"}
                  collapsed={sidebarCollapsed}
                  icon={Plus}
                  label="ایجاد پروژه"
                  onClick={() => handleSelect("supervisor-create-project")}
                />
                <SideItem
                  active={activeView === "supervisor-my-projects"}
                  collapsed={sidebarCollapsed}
                  icon={ClipboardList}
                  label="پروژه‌های من"
                  onClick={() => handleSelect("supervisor-my-projects")}
                />
                <SideItem
                  active={activeView === "supervisor-watched-projects"}
                  collapsed={sidebarCollapsed}
                  icon={Eye}
                  label="پروژه‌های تحت نظر"
                  onClick={() => handleSelect("supervisor-watched-projects")}
                />
                <SideItem
                  active={activeView === "manager-extra-projects"}
                  collapsed={sidebarCollapsed}
                  icon={Layers3}
                  label="پروژه‌های مازاد"
                  onClick={() => handleSelect("manager-extra-projects")}
                />
              </div>
              <SideItem
                active={activeView === "leave"}
                collapsed={sidebarCollapsed}
                icon={CalendarDays}
                label="مرخصی"
                meta={pendingLeaves || undefined}
                onClick={() => handleSelect("leave")}
              />
              <div className="my-1.5 border-t border-[--border]" />
              <SideItem
                active={activeView === "settings"}
                collapsed={sidebarCollapsed}
                icon={Settings}
                label="تنظیمات"
                onClick={() => handleSelect("settings")}
              />
            </>
          ) : isManager ? (
            <>
              <SideItem
                active={activeView === "analytics"}
                collapsed={sidebarCollapsed}
                icon={BarChart2}
                label="آنالیتیکس"
                onClick={() => handleSelect("analytics")}
              />
              <SideItem
                active={activeView === "tasks"}
                collapsed={sidebarCollapsed}
                icon={ClipboardList}
                label="گزارش‌ها"
                meta={activeFixedTaskCount}
                onClick={() => handleSelect("tasks")}
              />
              <SideItem
                active={activeView === "tasks-admin"}
                collapsed={sidebarCollapsed}
                icon={FolderKanban}
                label="گزارشات محول به کارشناس"
                onClick={() => handleSelect("tasks-admin")}
              />
              <SideItem
                active={activeView === "manager-extra-projects"}
                collapsed={sidebarCollapsed}
                icon={Layers3}
                label="گزارشات مازاد کارشناس"
                onClick={() => handleSelect("manager-extra-projects")}
              />
              <SideItem
                active={activeView === "team"}
                collapsed={sidebarCollapsed}
                icon={UsersRound}
                label="تیم"
                meta={statsUsers}
                onClick={() => handleSelect("team")}
              />
              <SideItem
                active={activeView === "leave"}
                collapsed={sidebarCollapsed}
                icon={CalendarDays}
                label="مرخصی"
                meta={pendingLeaves || undefined}
                onClick={() => handleSelect("leave")}
              />
              <div className="my-1.5 border-t border-[--border]" />
              <SideItem
                active={activeView === "settings"}
                collapsed={sidebarCollapsed}
                icon={Settings}
                label="تنظیمات"
                onClick={() => handleSelect("settings")}
              />
            </>
          ) : (
            <>
              <SideItem
                active={activeView === "dashboard"}
                collapsed={sidebarCollapsed}
                icon={LayoutDashboard}
                label="داشبورد"
                onClick={() => handleSelect("dashboard")}
              />
              <SideItem
                active={activeView === "tasks"}
                collapsed={sidebarCollapsed}
                icon={ClipboardList}
                label="گزارش‌ها"
                meta={activeFixedTaskCount}
                onClick={() => handleSelect("tasks")}
              />
              <SideItem
                active={activeView === "tasks-admin"}
                collapsed={sidebarCollapsed}
                icon={FolderKanban}
                label="پروژه‌های مدیریت"
                meta={
                  tasks.filter((task) => task.excelFile).length || undefined
                }
                onClick={() => handleSelect("tasks-admin")}
              />
              <SideItem
                active={activeView === "manager-extra-projects"}
                collapsed={sidebarCollapsed}
                icon={Layers3}
                label="پروژه‌های من"
                onClick={() => handleSelect("manager-extra-projects")}
              />
              <SideItem
                active={activeView === "leave"}
                collapsed={sidebarCollapsed}
                icon={CalendarDays}
                label="مرخصی"
                meta={leaveRequests.length || undefined}
                onClick={() => handleSelect("leave")}
              />
              <div className="my-1.5 border-t border-[--border]" />
              <SideItem
                active={activeView === "settings"}
                collapsed={sidebarCollapsed}
                icon={Settings}
                label="تنظیمات"
                onClick={() => handleSelect("settings")}
              />
            </>
          )}
        </nav>

        {!sidebarCollapsed && (
          <div className="mx-2 mt-2 rounded-2xl bg-[linear-gradient(145deg,rgba(31,122,140,0.1),transparent_42%),var(--surface-2)] p-3 shadow-[0_0_0_1px_rgba(31,122,140,0.28),0_8px_24px_rgba(15,23,42,0.07)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2.5">
              <div className="group/avatar relative shrink-0" tabIndex={0}>
                <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white shadow-[0_0_0_2px_var(--surface-2),0_0_0_3px_rgba(31,122,140,0.45)]">
                  {initials(currentUser ?? undefined)}
                  {currentUserAvatarUrl && (
                    <img
                      alt={userName(currentUser ?? undefined)}
                      className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                      src={currentUserAvatarUrl}
                      onError={(event) => event.currentTarget.remove()}
                    />
                  )}
                </div>
                {currentUserAvatarUrl && (
                  <div className="pointer-events-none absolute bottom-[calc(100%+0.625rem)] right-0 z-50 h-44 w-44 origin-bottom-right scale-[0.25] overflow-hidden rounded-3xl bg-[--surface] p-2 opacity-0 blur-[4px] shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_14px_32px_rgba(15,23,42,0.2)] transition-[opacity,filter,scale] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover/avatar:scale-100 group-hover/avatar:opacity-100 group-hover/avatar:blur-0 group-focus/avatar:scale-100 group-focus/avatar:opacity-100 group-focus/avatar:blur-0 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_14px_32px_rgba(0,0,0,0.35)]">
                    <img
                      alt=""
                      className="h-full w-full rounded-2xl object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                      src={currentUserAvatarUrl}
                      onError={(event) => event.currentTarget.remove()}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {userName(currentUser ?? undefined)}
                </p>
                <p className="truncate text-xs text-[--text-3]">
                  {currentUser?.mobile ?? currentUser?.email}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[--surface] px-2.5 py-1.5 text-xs font-medium text-[--text-2]">
              <ShieldCheck size={12} />
              {roleLabel(currentUser?.roles)}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
