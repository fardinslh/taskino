"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useState } from "react";

import { managerApi, userApi, type User } from "@/lib/api";

type TeamActionsInput = {
  token: string;
  myId: string;
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  setError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  loadData: () => Promise<void>;
};

export function useTeamActions({
  token,
  myId,
  currentUser,
  setCurrentUser,
  setError,
  setMessage,
  loadData,
}: TeamActionsInput) {
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [teamSearchResult, setTeamSearchResult] = useState<User[] | null>(null);
  const [teamSearching, setTeamSearching] = useState(false);

  async function updateUserRole(userId: string, role: string) {
    try {
      await managerApi.updateUserRole(token, userId, role);
      setMessage("نقش کاربر بروزرسانی شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تغییر نقش ناموفق بود");
    }
  }

  async function approveUser(userId: string) {
    try {
      await userApi.approve(token, userId);
      setMessage("کاربر تأیید شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تأیید کاربر ناموفق بود");
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("حذف این کاربر؟ این عمل قابل بازگشت نیست.")) return;
    try {
      await userApi.delete(token, userId);
      setMessage("کاربر حذف شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف کاربر ناموفق بود");
    }
  }

  async function searchTeamUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parts: string[] = [];
    if (parts.length < 2) {
      setError("نام و نام خانوادگی را با فاصله وارد کنید.");
      return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    setTeamSearching(true);
    try {
      const found = await managerApi.findUserByName(token, firstName, lastName);
      setTeamSearchResult(found ? [found] : []);
    } catch {
      setTeamSearchResult([]);
    } finally {
      setTeamSearching(false);
    }
  }

  function clearTeamSearch() {
    setTeamSearchResult(null);
  }

  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await userApi.create(token, {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        workField: "operations",
      });
      setMessage("کاربر جدید ساخته شد.");
      setShowNewUserForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت کاربر ناموفق بود");
    }
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      const updated = await userApi.update(token, myId, {
        firstName: currentUser?.firstName ?? "",
        lastName: currentUser?.lastName ?? "",
        email: currentUser?.email ?? "",
      });
      setCurrentUser(updated);
      localStorage.setItem("taskino-user", JSON.stringify(updated));
      setMessage("پروفایل ذخیره شد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ذخیره پروفایل ناموفق بود",
      );
    }
  }

  return {
    showNewUserForm,
    setShowNewUserForm,
    teamSearchResult,
    setTeamSearchResult,
    teamSearching,
    setTeamSearching,
    updateUserRole,
    approveUser,
    deleteUser,
    searchTeamUser,
    clearTeamSearch,
    createUser,
    saveProfile,
  };
}
