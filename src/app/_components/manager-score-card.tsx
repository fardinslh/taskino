"use client";

import { Award, LoaderCircle, Plus, UserRound } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { getId, managerApi } from "@/lib/api";
import { userName } from "../_lib/task-helpers";
import {
  useFeedbackContext,
  useManagementContext,
  useSessionContext,
} from "./taskino-context";

const QUICK_SCORES = [1, 5, 10];

export function ManagerScoreCard() {
  const { loadData, setError, setMessage } = useFeedbackContext();
  const { users } = useManagementContext();
  const { myId, token } = useSessionContext();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [score, setScore] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const eligibleUsers = useMemo(
    () =>
      users
        .filter((user) => getId(user) !== myId && user.isActive !== false)
        .sort((a, b) => userName(a).localeCompare(userName(b), "fa")),
    [myId, users],
  );
  const selectedUser = eligibleUsers.find(
    (user) => getId(user) === selectedUserId,
  );

  async function addScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId || !Number.isInteger(score) || score < 1) return;

    setSubmitting(true);
    setError("");
    try {
      await managerApi.adjustSpecialistScore(token, selectedUserId, score);
      setMessage(`${score} امتیاز به ${userName(selectedUser)} اضافه شد.`);
      setScore(1);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "افزودن امتیاز ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-[--surface] shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.06),0_10px_28px_-20px_rgba(245,158,11,0.45)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-3 border-b border-[--border] px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/15">
          <Award size={19} />
        </span>
        <div>
          <h2 className="text-balance font-bold">افزودن امتیاز کاربران</h2>
          <p className="mt-0.5 text-pretty text-xs text-[--text-3]">
            یک کاربر را انتخاب کنید و به امتیاز فعلی او اضافه کنید.
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5"
        onSubmit={addScore}
      >
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-[--text-2]"
            htmlFor="score-user"
          >
            کاربر
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[--text-3]"
              size={16}
            />
            <select
              className="h-11 w-full appearance-none rounded-xl border border-[--border] bg-[--surface-2] pr-10 pl-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 disabled:opacity-50"
              disabled={submitting || eligibleUsers.length === 0}
              id="score-user"
              onChange={(event) => setSelectedUserId(event.target.value)}
              value={selectedUserId}
            >
              <option value="">
                {eligibleUsers.length === 0
                  ? "کاربر فعالی وجود ندارد"
                  : "انتخاب کاربر"}
              </option>
              {eligibleUsers.map((user) => (
                <option key={getId(user)} value={getId(user)}>
                  {userName(user)}
                  {typeof user.score === "number"
                    ? ` — ${user.score} امتیاز`
                    : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <p className="text-xs text-[--text-3]">
              امتیاز فعلی:{" "}
              <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {selectedUser.score ?? 0}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-[--text-2]"
            htmlFor="score-amount"
          >
            مقدار امتیاز
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_SCORES.map((value) => (
              <button
                className={`h-11 min-w-11 rounded-xl px-3 text-sm font-bold tabular-nums transition-[background-color,color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] ${
                  score === value
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)] hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60"
                }`}
                disabled={submitting}
                key={value}
                onClick={() => setScore(value)}
                type="button"
              >
                +{value}
              </button>
            ))}
            <input
              aria-label="مقدار دلخواه امتیاز"
              className="h-11 w-20 rounded-xl border border-[--border] bg-[--surface-2] px-3 text-center text-sm font-bold tabular-nums outline-none transition-[border-color,box-shadow] duration-150 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              disabled={submitting}
              id="score-amount"
              min={1}
              onChange={(event) => setScore(event.target.valueAsNumber)}
              step={1}
              type="number"
              value={Number.isNaN(score) ? "" : score}
            />
            <button
              className="flex h-11 items-center gap-1.5 rounded-xl bg-[#1f7a8c] pr-3.5 pl-4 text-sm font-bold text-white shadow-sm transition-[background-color,scale] duration-150 ease-out hover:bg-[#176979] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={
                submitting ||
                !selectedUserId ||
                !Number.isInteger(score) ||
                score < 1
              }
              type="submit"
            >
              {submitting ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              افزودن
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
