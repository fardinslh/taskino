"use client";

import { useEffect } from "react";
import {
  Bell,
  Loader2,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
} from "lucide-react";

import { getId, type Notification, type User } from "@/lib/api";
import {
  appTitleForWorkField,
  initials,
  notificationText,
  userName,
} from "../_lib/task-helpers";

type TaskinoHeaderProps = {
  currentUser: User | null;
  darkMode: boolean;
  loadingData: boolean;
  notifications: Notification[];
  onLogout: () => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onRefresh: () => void;
  onToggleDarkMode: () => void;
  onToggleMobileSidebar: () => void;
  onToggleNotifications: () => void;
  showNotifications: boolean;
  sidebarCollapsed: boolean;
  unreadCount: number;
};

export function TaskinoHeader({
  currentUser,
  darkMode,
  loadingData,
  notifications,
  onLogout,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onRefresh,
  onToggleDarkMode,
  onToggleMobileSidebar,
  onToggleNotifications,
  showNotifications,
  sidebarCollapsed,
  unreadCount,
}: TaskinoHeaderProps) {
  const appTitle = appTitleForWorkField(currentUser?.workField);

  useEffect(() => {
    document.title = appTitle;
  }, [appTitle]);

  return (
    <header className="sticky top-0 z-40 border-b border-[--border] bg-[--surface]/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2] lg:hidden"
            onClick={onToggleMobileSidebar}
            type="button"
          >
            <Menu size={16} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f7a8c] text-white shadow-sm">
            <Sparkles size={15} />
          </div>
          {!sidebarCollapsed && (
            <span className="hidden max-w-[42vw] truncate font-bold tracking-tight sm:block lg:max-w-none">
              {appTitle}
            </span>
          )}
        </div>

        <div className="order-3 hidden flex-1 sm:order-2 sm:block" />

        <div className="order-2 mr-auto flex items-center gap-2 sm:order-3 sm:mr-0">
          <div className="relative">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]"
              onClick={onToggleNotifications}
              type="button"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="fixed left-3 right-3 top-14 z-50 overflow-hidden rounded-xl border border-[--border] bg-[--surface] shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-11 sm:w-[min(20rem,calc(100vw-1.5rem))]">
                <div className="flex items-center justify-between border-b border-[--border] px-4 py-3">
                  <span className="text-sm font-bold">اعلان‌ها</span>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs font-semibold text-[#1f7a8c] hover:underline"
                      onClick={onMarkAllNotificationsRead}
                      type="button"
                    >
                      همه خوانده شد
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-[--text-3]">
                      اعلان جدیدی نیست
                    </p>
                  ) : (
                    notifications.map((notification) => {
                      const localized = notificationText(notification);
                      return (
                        <button
                          key={getId(notification)}
                          className="flex w-full flex-col gap-0.5 border-b border-[--border] px-4 py-3 text-right transition hover:bg-[--surface-2]"
                          onClick={() =>
                            onNotificationClick(notification)
                          }
                          type="button"
                        >
                          <span className="text-sm font-semibold">
                            {localized.title}
                          </span>
                          <span className="line-clamp-2 text-xs text-[--text-3]">
                            {localized.message}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--text-2] transition hover:bg-[--surface-2]"
            onClick={onToggleDarkMode}
            type="button"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface] px-2.5 text-sm font-medium text-[--text-2] transition hover:bg-[--surface-2] disabled:opacity-50 sm:px-3"
            disabled={loadingData}
            onClick={onRefresh}
            type="button"
          >
            {loadingData ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <RefreshCw size={15} />
            )}
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>

          <button
            className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface] px-2.5 text-sm font-medium text-[--text] transition hover:bg-[--surface-2]"
            onClick={onLogout}
            type="button"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f7a8c] text-[10px] font-bold text-white">
              {initials(currentUser ?? undefined)}
            </span>
            <span className="hidden max-w-[90px] truncate text-xs sm:block">
              {userName(currentUser ?? undefined)}
            </span>
            <LogOut size={14} className="text-[--text-3]" />
          </button>
        </div>
      </div>
    </header>
  );
}
