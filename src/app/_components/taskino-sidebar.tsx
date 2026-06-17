"use client";

import {
  BarChart2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { FixedTask, LeaveRequest, Task, User } from "@/lib/api";
import { type View } from "../_lib/task-constants";
import { initials, roleLabel, userName } from "../_lib/task-helpers";
import { SideItem } from "./shared";

type TaskinoSidebarProps = {
  activeView: View;
  currentUser: User | null;
  isManager: boolean;
  isSupervisor: boolean;
  leaveRequests: LeaveRequest[];
  onSetActiveView: (view: View) => void;
  onToggleCollapsed: () => void;
  overdueTasks: Task[];
  sidebarCollapsed: boolean;
  statsUsers: number;
  supervisorFixedTasks: FixedTask[];
  supervisorTasks: Task[];
  tasks: Task[];
};

export function TaskinoSidebar({
  activeView,
  currentUser,
  isManager,
  isSupervisor,
  leaveRequests,
  onSetActiveView,
  onToggleCollapsed,
  overdueTasks,
  sidebarCollapsed,
  statsUsers,
  supervisorFixedTasks,
  supervisorTasks,
  tasks,
}: TaskinoSidebarProps) {
  const pendingLeaves =
    leaveRequests.filter((request) => request.status === "pending").length;

  return (
    <aside
      className="sticky top-[53px] h-[calc(100vh-53px)] shrink-0 overflow-y-auto overflow-x-hidden border-l border-[--border] bg-[--surface] transition-all duration-200"
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
              icon={LayoutDashboard}
              label="داشبورد"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("dashboard")}
            />
            <SideItem
              active={activeView === "leave"}
              icon={CalendarDays}
              label="مرخصی"
              meta={pendingLeaves || undefined}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("leave")}
            />
            <SideItem
              active={activeView === "tasks" || activeView === "tasks-admin" || activeView === "supervisor-projects"}
              icon={ClipboardList}
              label="گزارش‌ها"
              meta={tasks.length || overdueTasks.length || undefined}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("tasks-admin")}
            />
            <div className={sidebarCollapsed ? "space-y-0.5" : "space-y-0.5 pr-5"}>
              <SideItem
                active={activeView === "tasks-admin"}
                icon={Plus}
                label="ایجاد گزارش"
                collapsed={sidebarCollapsed}
                onClick={() => onSetActiveView("tasks-admin")}
              />
              <SideItem
                active={activeView === "tasks"}
                icon={ClipboardList}
                label="گزارش‌های من"
                meta={tasks.length || undefined}
                collapsed={sidebarCollapsed}
                onClick={() => onSetActiveView("tasks")}
              />
              <SideItem
                active={activeView === "supervisor-projects"}
                icon={FolderKanban}
                label="گزارش‌های تحت نظر"
                meta={supervisorFixedTasks.length || undefined}
                collapsed={sidebarCollapsed}
                onClick={() => onSetActiveView("supervisor-projects")}
              />
            </div>
            <div className="my-1.5 border-t border-[--border]" />
            <SideItem
              active={activeView === "settings"}
              icon={Settings}
              label="تنظیمات"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("settings")}
            />
          </>
        ) : isManager ? (
          <>
            <SideItem
              active={activeView === "dashboard"}
              icon={LayoutDashboard}
              label="داشبورد"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("dashboard")}
            />
            <SideItem
              active={activeView === "tasks"}
              icon={ClipboardList}
              label="گزارش‌ها"
              meta={tasks.length}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("tasks")}
            />
            <SideItem
              active={activeView === "tasks-admin"}
              icon={ClipboardList}
              label="پروژه‌ها"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("tasks-admin")}
            />
            <SideItem
              active={activeView === "analytics"}
              icon={BarChart2}
              label="آنالیتیکس"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("analytics")}
            />
            <SideItem
              active={activeView === "team"}
              icon={UsersRound}
              label="تیم"
              meta={statsUsers}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("team")}
            />
            <SideItem
              active={activeView === "leave"}
              icon={CalendarDays}
              label="مرخصی"
              meta={pendingLeaves || undefined}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("leave")}
            />
            <div className="my-1.5 border-t border-[--border]" />
            <SideItem
              active={activeView === "settings"}
              icon={Settings}
              label="تنظیمات"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("settings")}
            />
          </>
        ) : (
          <>
            <SideItem
              active={activeView === "dashboard"}
              icon={LayoutDashboard}
              label="داشبورد"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("dashboard")}
            />
            <SideItem
              active={activeView === "tasks"}
              icon={ClipboardList}
              label="گزارش‌ها"
              meta={tasks.length}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("tasks")}
            />
            <SideItem
              active={activeView === "tasks-admin"}
              icon={FolderKanban}
              label="پروژه‌ها"
              meta={tasks.filter((task) => task.excelFile).length || undefined}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("tasks-admin")}
            />
            <SideItem
              active={activeView === "leave"}
              icon={CalendarDays}
              label="مرخصی"
              meta={leaveRequests.length || undefined}
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("leave")}
            />
            <div className="my-1.5 border-t border-[--border]" />
            <SideItem
              active={activeView === "settings"}
              icon={Settings}
              label="تنظیمات"
              collapsed={sidebarCollapsed}
              onClick={() => onSetActiveView("settings")}
            />
          </>
        )}
      </nav>

      {!sidebarCollapsed && (
        <>
          <div className="mx-2 mt-2 rounded-xl border border-[--border] bg-[--surface-2] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-xs font-bold text-white">
                {initials(currentUser ?? undefined)}
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
        </>
      )}
    </aside>
  );
}
