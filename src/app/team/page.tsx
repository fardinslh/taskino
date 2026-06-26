"use client";

import { useForm } from "react-hook-form";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  getId,
  managerApi,
  userApi,
  type User,
  type WorkField,
} from "@/lib/api";
import { LeaveRequestForm } from "../_components/leave-request-form";
import { Field, Select } from "../_components/shared";
import { WORK_FIELDS } from "../_lib/task-constants";
import {
  useFeedbackContext,
  useManagementContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";
import {
  formatDate,
  initials,
  roleLabel,
  statusLabel,
  userName,
} from "../_lib/task-helpers";

type CreateUserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
  workField: WorkField;
};

type SearchUserFormValues = {
  query: string;
};

export default function TeamPage() {
  return <TeamPageContent />;
}

function TeamPageContent() {
  const { activeView } = useNavigationContext();
  const { isManager, myId, token } = useSessionContext();
  const { loadData, setError, setMessage } = useFeedbackContext();
  const {
    approveUser, deleteUser, leaveRequests, setShowNewUserForm,
    setTeamSearching, setTeamSearchResult, showNewUserForm, teamSearching,
    teamSearchResult, updateUserRole, users,
  } = useManagementContext();

  const {
    formState: { isSubmitting: isCreatingUser },
    handleSubmit: handleCreateSubmit,
    register: registerCreate,
    reset: resetCreate,
  } = useForm<CreateUserFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      role: "specialist",
      workField: "operations",
    },
  });

  const {
    handleSubmit: handleSearchSubmit,
    register: registerSearch,
    reset: resetSearch,
  } = useForm<SearchUserFormValues>({
    defaultValues: { query: "" },
  });

  async function createUser(values: CreateUserFormValues) {
    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim() || !values.password.trim()) return;

    try {
      const created = await userApi.create(token, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        workField: values.workField,
        ...(values.mobile.trim() ? { mobile: values.mobile } : {}),
      });

      if (values.role !== "specialist") {
        const newId = getId(created);
        if (newId) await managerApi.updateUserRole(token, newId, values.role).catch(() => {});
      }

      setMessage("کاربر جدید ساخته شد.");
      resetCreate();
      setShowNewUserForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت کاربر ناموفق بود");
    }
  }

  async function searchTeamUser(values: SearchUserFormValues) {
    const parts = values.query.trim().split(/\s+/);
    if (parts.length < 2) {
      setError("نام و نام خانوادگی را با فاصله وارد کنید.");
      return;
    }

    setTeamSearching(true);
    try {
      const found = await managerApi.findUserByName(token, parts[0], parts.slice(1).join(" "));
      setTeamSearchResult(found ? [found] : []);
    } catch {
      setTeamSearchResult([]);
    } finally {
      setTeamSearching(false);
    }
  }

  function clearTeamSearch() {
    resetSearch();
    setTeamSearchResult(null);
  }

  if (activeView !== "team") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">اعضای تیم</h2>
          {isManager && (
            <button
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]"
              onClick={() => setShowNewUserForm((value: boolean) => !value)}
              type="button"
            >
              {showNewUserForm ? <X size={15} /> : <Plus size={15} />}
              {showNewUserForm ? "بستن" : "کاربر جدید"}
            </button>
          )}
        </div>

        {isManager && showNewUserForm && (
          <form className="mt-4 grid gap-3 rounded-xl border border-[--border] bg-[--surface-2] p-4 sm:grid-cols-2" onSubmit={handleCreateSubmit(createUser)}>
            <Field label="نام *" name="firstName" required registration={registerCreate("firstName", { required: true })} />
            <Field label="نام خانوادگی *" name="lastName" required registration={registerCreate("lastName", { required: true })} />
            <Field label="ایمیل *" name="email" required type="email" placeholder="user@example.com" registration={registerCreate("email", { required: true })} />
            <Field label="موبایل" name="mobile" placeholder="اختیاری · 09xxxxxxxxx" registration={registerCreate("mobile")} />
            <Field label="رمز عبور *" name="password" required type="password" placeholder="حداقل ۶ کاراکتر" registration={registerCreate("password", { required: true, minLength: 6 })} />
            <Select label="حوزه کاری *" options={WORK_FIELDS} registration={registerCreate("workField", { required: true })} />
            <Select label="نقش" options={[["specialist", "کارشناس"], ["supervisor", "سرپرست"], ["manager", "مدیر"]]} registration={registerCreate("role")} />
            <div className="sm:col-span-2">
              <button className="h-10 rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={isCreatingUser} type="submit">
                ساخت کاربر
              </button>
            </div>
          </form>
        )}

        {isManager && (
          <form className="mt-4 flex flex-wrap items-center gap-2" onSubmit={handleSearchSubmit(searchTeamUser)}>
            <input
              className="h-9 min-w-[200px] flex-1 rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              placeholder="جستجوی کاربر بر اساس نام و نام خانوادگی..."
              {...registerSearch("query", { required: true })}
            />
            <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b] disabled:opacity-50" disabled={teamSearching} type="submit">
              {teamSearching ? <Loader2 className="animate-spin" size={15} /> : <Search size={15} />}
              جستجو
            </button>
            {teamSearchResult !== null && (
              <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]" onClick={clearTeamSearch} type="button">
                <X size={15} />
                پاک کردن
              </button>
            )}
          </form>
        )}

        <div className="mt-4 space-y-2">
          {teamSearchResult !== null && teamSearchResult.length === 0 && (
            <p className="rounded-xl border border-dashed border-[--border] p-6 text-center text-sm text-[--text-3]">کاربری با این نام یافت نشد</p>
          )}
          {(teamSearchResult ?? users).map((user: User) => (
            <div key={getId(user)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--border] bg-[--surface-2] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f7a8c] text-xs font-bold text-white">{initials(user)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{userName(user)}</p>
                    {user.isActive === false && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">در انتظار تأیید</span>
                    )}
                  </div>
                  <p className="text-xs text-[--text-3]">{user.mobile ?? user.email}</p>
                </div>
              </div>
              {isManager ? (
                <div className="flex flex-wrap items-center gap-2">
                  {user.isActive === false && (
                    <button className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" onClick={() => void approveUser(getId(user))} type="button">
                      تأیید
                    </button>
                  )}
                  <select
                    className="h-8 rounded-lg border border-[--border] bg-[--surface] px-2 text-xs"
                    value={user.roles ?? "specialist"}
                    onChange={(event) => void updateUserRole(getId(user), event.target.value)}
                  >
                    <option value="specialist">کارشناس</option>
                    <option value="supervisor">سرپرست</option>
                    <option value="manager">مدیر</option>
                  </select>
                  {getId(user) !== myId && (
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => void deleteUser(getId(user))} type="button">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <span className="rounded-lg bg-[--surface] px-2.5 py-1 text-xs font-medium">{roleLabel(user.roles)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isManager && (
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
          <h2 className="font-bold">مرخصی من</h2>
          <LeaveRequestForm />
          <div className="mt-4 space-y-2">
            {leaveRequests.map((leaveRequest: any) => (
              <div key={getId(leaveRequest)} className="flex items-center justify-between rounded-xl border border-[--border] px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">{userName(leaveRequest.user)} · {statusLabel(leaveRequest.status)}</p>
                  <p className="text-xs text-[--text-3]">{formatDate(leaveRequest.startDate)} تا {formatDate(leaveRequest.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
