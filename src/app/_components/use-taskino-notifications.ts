"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getId,
  normalizeList,
  notificationApi,
  type Notification,
} from "@/lib/api";

type NotificationControllerInput = {
  isManager: boolean;
  setError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  token: string;
};

export function useTaskinoNotifications({
  isManager,
  setError,
  setMessage,
  token,
}: NotificationControllerInput) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popupNotif, setPopupNotif] = useState<Notification | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;

    const seen = seenNotifications.current;
    let seeded = false;

    async function poll() {
      const response = await notificationApi
        .list(token, { isRead: false, limit: 20 })
        .catch(() => null);
      if (!response) return;

      const list = normalizeList(
        response as Notification[] | { data?: Notification[] },
      );
      setNotifications(list);
      setUnreadCount(list.length);

      if (!seeded) {
        list.forEach((notification) => seen.add(getId(notification)));
        seeded = true;
        return;
      }

      const fresh = list.filter(
        (notification) => !seen.has(getId(notification)),
      );
      fresh.forEach((notification) => seen.add(getId(notification)));

      if (fresh.length && !isManager) {
        const assignment =
          fresh.find((notification) =>
            (notification.type ?? "").includes("assign"),
          ) ?? fresh[0];
        setPopupNotif(assignment);
      }
    }

    void poll();
    const intervalId = window.setInterval(() => void poll(), 20_000);
    return () => window.clearInterval(intervalId);
  }, [isManager, token]);

  async function markNotificationRead(id: string) {
    try {
      await notificationApi.markRead(token, id);
      setNotifications((current) =>
        current.filter((notification) => getId(notification) !== id),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "خطا در خواندن اعلان",
      );
    }
  }

  async function markAllNotificationsRead() {
    try {
      await notificationApi.markAllRead(token);
      setNotifications([]);
      setUnreadCount(0);
      setMessage("همه اعلان‌ها خوانده شد.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "خطا در خواندن اعلان‌ها",
      );
    }
  }

  function resetNotifications() {
    seenNotifications.current.clear();
    setNotifications([]);
    setPopupNotif(null);
    setShowNotifications(false);
    setUnreadCount(0);
  }

  return {
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    popupNotif,
    resetNotifications,
    setNotifications,
    setPopupNotif,
    setShowNotifications,
    setUnreadCount,
    showNotifications,
    unreadCount,
  };
}
