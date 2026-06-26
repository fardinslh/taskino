"use client";

import { useEffect } from "react";
import {
  Bell,
  Loader2,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  X,
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
  onClearSearch: () => void;
  onLogout: () => void;
  onMarkAllNotificationsRead: () => void;
  onMarkNotificationRead: (id: string) => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  onToggleDarkMode: () => void;
  onToggleMobileSidebar: () => void;
  onToggleNotifications: () => void;
  searchQuery: string;
  showNotifications: boolean;
  sidebarCollapsed: boolean;
  unreadCount: number;
};

export function TaskinoHeader({
  currentUser,
  darkMode,
  loadingData,
  notifications,
  onClearSearch,
  onLogout,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onRefresh,
  onSearchChange,
  onToggleDarkMode,
  onToggleMobileSidebar,
  onToggleNotifications,
  searchQuery,
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

        <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1">
          <div className="relative sm:hidden">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--text-3]"
              size={15}
            />
            <input
              className="h-9 w-full rounded-lg border border-[--border] bg-[--surface-2] pr-9 pl-8 text-sm outline-none transition-all placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:bg-[--surface] focus:ring-2 focus:ring-[#1f7a8c]/15"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="جستجوی گزارش..."
              value={searchQuery}
            />
            {searchQuery && (
              <button
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-3] hover:text-[--text-2]"
                onClick={onClearSearch}
                type="button"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="relative hidden sm:block">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--text-3]"
              size={15}
            />
            <input
              className="h-9 w-44 rounded-lg border border-[--border] bg-[--surface-2] pr-9 pl-3 text-sm outline-none transition-all placeholder:text-[--text-3] focus:w-64 focus:border-[#1f7a8c] focus:bg-[--surface] focus:ring-2 focus:ring-[#1f7a8c]/15 lg:w-52 lg:focus:w-72"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="جستجوی گزارش..."
              value={searchQuery}
            />
            {searchQuery && (
              <button
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--text-3] hover:text-[--text-2]"
                onClick={onClearSearch}
                type="button"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

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
              <div className="absolute left-0 top-11 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[--border] bg-[--surface] shadow-xl">
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
                            onMarkNotificationRead(getId(notification))
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
