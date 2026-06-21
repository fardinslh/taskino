"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useState } from "react";

import { leaveApi, managerApi } from "@/lib/api";

type LeaveActionsInput = {
  token: string;
  myId: string;
  isManager: boolean;
  setError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  loadData: () => Promise<void>;
};

export function useLeaveActions({
  token,
  myId,
  isManager,
  setError,
  setMessage,
  loadData,
}: LeaveActionsInput) {
  const [rejectLeaveId, setRejectLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function createLeaveRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myId) return;
    try {
      await loadData();
      setMessage("درخواست مرخصی ثبت شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت مرخصی ناموفق بود");
    }
  }

  async function handleLeaveAction(id: string, action: "approve" | "reject") {
    if (!myId) return;
    if (action === "reject") {
      setRejectLeaveId(id);
      return;
    }
    try {
      if (isManager) await managerApi.approveLeaveRequest(token, id);
      else await leaveApi.approve(token, id, myId);
      setMessage("مرخصی تأیید شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "عملیات مرخصی ناموفق بود");
    }
  }

  async function confirmRejectLeave() {
    if (!myId || !rejectLeaveId || !rejectReason.trim()) return;
    try {
      await leaveApi.reject(token, rejectLeaveId, myId, rejectReason.trim());
      setRejectLeaveId(null);
      setRejectReason("");
      setMessage("مرخصی رد شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "رد مرخصی ناموفق بود");
    }
  }

  return {
    rejectLeaveId,
    setRejectLeaveId,
    rejectReason,
    setRejectReason,
    createLeaveRequest,
    handleLeaveAction,
    confirmRejectLeave,
  };
}
