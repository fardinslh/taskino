"use client";

import type { User } from "@/lib/api";
import { getId } from "@/lib/api";
import { CalendarDays } from "lucide-react";

import { LeaveRequestForm } from "../_components/leave-request-form";
import { LandingPageEntrance } from "../_components/landing-page-entrance";
import {
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";
import {
  formatDate,
  initials,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

type LeaveRequestView = {
  _id?: string;
  id?: string;
  status?: string;
  reason?: string;
  description?: string;
  details?: string;
  recurrence?: string;
  leaveType?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  startDate: string;
  endDate: string;
  user?: User | string;
  approvedBy?: User | string;
};

export default function LeavePage() {
  return <LeavePageContent />;
}

function LeavePageContent() {
  const { activeView } = useNavigationContext();
  const { currentUser, isManager, isSupervisor } = useSessionContext();
  const { handleLeaveAction, leaveRequests, leaveStatistics, users } =
    useManagementContext();

  if (activeView !== "leave") return null;

  if (!isManager && !isSupervisor) {
    return (
      <LandingPageEntrance className="space-y-5">
        <div className="rounded-3xl bg-[--surface] p-4 shadow-[0_0_0_1px_var(--border),0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="text-balance font-bold">درخواست مرخصی</h2>
              <p className="mt-0.5 text-pretty text-xs text-[--text-3]">نوع مرخصی و بازه موردنظر را وارد کنید</p>
            </div>
          </div>
          <LeaveRequestForm />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
          <div className="border-b border-[--border] px-4 py-3">
            <h2 className="font-bold">درخواست‌های من</h2>
          </div>
          <div className="divide-y divide-[--border]">
            {leaveRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-[--text-3]">درخواستی ثبت نکرده‌ای</p>
            ) : leaveRequests.map((leaveRequest: LeaveRequestView) => (
              <LeaveRequestRow
                formatDate={formatDate}
                getId={getId}
                key={getId(leaveRequest)}
                leaveRequest={leaveRequest}
                statusLabel={statusLabel}
              />
            ))}
          </div>
        </div>
      </LandingPageEntrance>
    );
  }

  if (!isSupervisor && !isManager) return null;
  const myLeaveRequests = isSupervisor
    ? leaveRequests.filter(
        (leaveRequest: LeaveRequestView) =>
          getId(leaveRequest.user) === getId(currentUser ?? undefined),
      )
    : [];
  const reviewableLeaveRequests = isSupervisor
    ? leaveRequests.filter((leaveRequest: LeaveRequestView) => {
        const requestUser = leaveRequest.user;
        const requestUserId = getId(requestUser);
        if (!requestUserId || requestUserId === getId(currentUser ?? undefined)) {
          return false;
        }
        const fullUser =
          typeof requestUser === "string"
            ? users.find((user) => getId(user) === requestUserId)
            : requestUser;
        const requestUserRole = (fullUser as User & { role?: string } | undefined)
          ?.role;
        const role = fullUser?.roles ?? requestUserRole;

        return !role || role === "specialist";
      })
    : leaveRequests;
  const reviewStats = {
    total: reviewableLeaveRequests.length,
    pending: reviewableLeaveRequests.filter(
      (lr: LeaveRequestView) => lr.status === "pending",
    ).length,
    approved: reviewableLeaveRequests.filter(
      (lr: LeaveRequestView) => lr.status === "approved",
    ).length,
    rejected: reviewableLeaveRequests.filter(
      (lr: LeaveRequestView) => lr.status === "rejected",
    ).length,
  };

  return (
    <LandingPageEntrance className="space-y-5">
      {isSupervisor && (
        <>
          <div className="rounded-3xl bg-[--surface] p-4 shadow-[0_0_0_1px_var(--border),0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
                <CalendarDays size={18} />
              </span>
              <div>
                <h2 className="text-balance font-bold">درخواست مرخصی</h2>
                <p className="mt-0.5 text-pretty text-xs text-[--text-3]">نوع مرخصی و بازه موردنظر را وارد کنید</p>
              </div>
            </div>
            <LeaveRequestForm />
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
            <div className="border-b border-[--border] px-4 py-3">
              <h2 className="font-bold">درخواست‌های من</h2>
            </div>
            <div className="divide-y divide-[--border]">
              {myLeaveRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-[--text-3]">
                  درخواستی ثبت نکرده‌ای
                </p>
              ) : (
                myLeaveRequests.map((leaveRequest: LeaveRequestView) => (
                  <LeaveRequestRow
                    formatDate={formatDate}
                    getId={getId}
                    key={getId(leaveRequest)}
                    leaveRequest={leaveRequest}
                    statusLabel={statusLabel}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {isManager && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: "کل درخواست‌ها",
              value:
                leaveStatistics?.totalRequests ??
                leaveStatistics?.total ??
                reviewStats.total,
            },
            {
              label: "در انتظار",
              value:
                leaveStatistics?.pendingRequests ??
                leaveStatistics?.pending ??
                reviewStats.pending,
            },
            {
              label: "تأیید شده",
              value:
                leaveStatistics?.approvedRequests ??
                leaveStatistics?.approved ??
                reviewStats.approved,
            },
            {
              label: "رد شده",
              value:
                leaveStatistics?.rejectedRequests ??
                leaveStatistics?.rejected ??
                reviewStats.rejected,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
              <p className="text-xs text-[--text-3]">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
        <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f7a8c] to-[#165e6d] text-white">
            <CalendarDays size={17} />
          </div>
          <div>
            <h2 className="font-bold">درخواست‌های مرخصی</h2>
            <p className="text-[11px] text-[--text-3]">
              {isSupervisor
                ? "درخواست‌های کارشناسان و وضعیت تأیید"
                : "همه درخواست‌ها و وضعیت تأیید"}
            </p>
          </div>
        </div>
        <div className="divide-y divide-[--border]">
          {reviewableLeaveRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-[--text-3]">درخواست مرخصی‌ای ثبت نشده</p>
          ) : reviewableLeaveRequests.map((leaveRequest: LeaveRequestView) => (
            <LeaveRequestReviewRow
              formatDate={formatDate}
              getId={getId}
              handleLeaveAction={handleLeaveAction}
              initials={initials}
              key={getId(leaveRequest)}
              leaveRequest={leaveRequest}
              statusLabel={statusLabel}
              userName={userName}
            />
          ))}
        </div>
      </div>
    </LandingPageEntrance>
  );
}

function LeaveRequestRow({ formatDate, getId, leaveRequest, statusLabel }: {
  formatDate: (value?: string) => string;
  getId: (item?: { _id?: string; id?: string } | string) => string;
  leaveRequest: LeaveRequestView;
  statusLabel: (status?: string) => string;
}) {
  const badge = leaveBadge(leaveRequest.status);
  const rangeText = leaveRangeText(leaveRequest, formatDate);

  return (
    <div key={getId(leaveRequest)} className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div>
        <p className="text-sm font-semibold">{rangeText}</p>
        {leaveRequest.reason && <p className="mt-0.5 text-xs text-[--text-3]">{leaveRequest.reason}</p>}
      </div>
      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge}`}>{statusLabel(leaveRequest.status)}</span>
    </div>
  );
}

function LeaveRequestReviewRow({ formatDate, getId, handleLeaveAction, initials, leaveRequest, statusLabel, userName }: {
  formatDate: (value?: string) => string;
  getId: (item?: { _id?: string; id?: string } | string) => string;
  handleLeaveAction: (id: string, action: "approve" | "reject") => Promise<void>;
  initials: (user?: User | string) => string;
  leaveRequest: LeaveRequestView;
  statusLabel: (status?: string) => string;
  userName: (user?: User | string) => string;
}) {
  const badge = leaveBadge(leaveRequest.status);
  const rangeText = leaveRangeText(leaveRequest, formatDate);
  const requestDetails =
    leaveRequest.reason || leaveRequest.description || leaveRequest.details;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f7a8c] text-xs font-bold text-white">
          {initials(leaveRequest.user)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{userName(leaveRequest.user)}</p>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge}`}>{statusLabel(leaveRequest.status)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[--text-3]">
            {rangeText}
            {leaveRequest.approvedBy ? ` · بررسی: ${userName(leaveRequest.approvedBy)}` : ""}
          </p>
          <div className="mt-2 rounded-lg bg-[--surface-2] px-3 py-2 text-xs leading-5 text-[--text-2]">
            <span className="font-semibold text-[--text-3]">توضیحات: </span>
            {requestDetails?.trim() || "بدون توضیحات"}
          </div>
        </div>
      </div>
      {leaveRequest.status === "pending" && (
        <div className="flex shrink-0 gap-2">
          <button className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" onClick={() => void handleLeaveAction(getId(leaveRequest), "approve")} type="button">
            تأیید
          </button>
          <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400" onClick={() => void handleLeaveAction(getId(leaveRequest), "reject")} type="button">
            رد
          </button>
        </div>
      )}
    </div>
  );
}

function leaveBadge(status?: string) {
  if (status === "approved") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (status === "rejected") return "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400";
  return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
}

function leaveRangeText(
  leaveRequest: LeaveRequestView,
  formatDate: (value?: string) => string,
) {
  const leaveType =
    leaveRequest.recurrence ?? leaveRequest.leaveType ?? leaveRequest.type;
  if (leaveType !== "hourly") {
    return `${formatDate(leaveRequest.startDate)} تا ${formatDate(leaveRequest.endDate)}`;
  }

  const startTime = formatPersianTime(
    leaveRequest.startTime ?? formatTime(leaveRequest.startDate),
  );
  const endTime = formatPersianTime(
    leaveRequest.endTime ?? formatTime(leaveRequest.endDate),
  );

  return `${formatDate(leaveRequest.startDate)} · ${startTime} تا ${endTime}`;
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPersianTime(value?: string) {
  if (!value) return "";

  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}
