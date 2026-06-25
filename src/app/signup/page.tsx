"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { authApi } from "@/lib/api";
import type { WorkField } from "@/lib/api";
import { Field, Toast } from "../_components/shared";
import { WORK_FIELDS } from "../_lib/task-constants";

type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  workField: WorkField;
};

export default function SignupPage() {
  const router = useRouter();
  const { formState: { isSubmitting }, handleSubmit, register } = useForm<SignupFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      workField: "operations",
    },
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("taskino-token")) return;
    const storedUser = localStorage.getItem("taskino-user");
    const user = storedUser ? JSON.parse(storedUser) : undefined;
    if (user?.isActive !== true) {
      localStorage.removeItem("taskino-token");
      localStorage.removeItem("taskino-user");
      return;
    }
    router.replace(user?.roles === "manager" ? "/analytics" : "/dashboard");
  }, [router]);

  async function handleSignup(values: SignupFormValues) {
    setError("");
    setMessage("");

    try {
      await authApi.register(values);
      localStorage.removeItem("taskino-token");
      localStorage.removeItem("taskino-user");
      sessionStorage.setItem(
        "taskino-signup-message",
        "ثبت‌نام انجام شد. لطفا بعد از تایید مدیر وارد شوید.",
      );
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت‌نام ناموفق بود");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <Toast message={error || message} type={error ? "error" : "success"} onClose={() => error ? setError("") : setMessage("")} />
      <AuthBrandPanel />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12 lg:mr-[45%]">
        <div className="w-full max-w-md">
          <MobileBrand />
          <h1 className="text-3xl font-bold">بریم شروع کنیم</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">یه حساب رایگان بساز</p>

          <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <Link className="rounded-lg py-2.5 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300" href="/login">
              ورود
            </Link>
            <span className="rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-[#1f7a8c] shadow-sm dark:bg-slate-700">ثبت‌نام</span>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(handleSignup)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="نام" name="firstName" required registration={register("firstName", { required: true })} />
              <Field label="نام خانوادگی" name="lastName" required registration={register("lastName", { required: true })} />
            </div>
            <Field label="ایمیل" name="email" required type="email" placeholder="you@example.com" registration={register("email", { required: true })} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">حوزه کاری</span>
              <select className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15" defaultValue="operations" {...register("workField", { required: true })}>
                {WORK_FIELDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <Field label="موبایل" name="mobile" required placeholder="09xxxxxxxxx" dir="ltr" inputMode="tel" registration={register("mobile", { required: true })} />
            <Field label="رمز عبور" name="password" required type="password" placeholder="حداقل ۶ کاراکتر" registration={register("password", { required: true, minLength: 6 })} />
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-semibold text-white shadow-lg shadow-[#1f7a8c]/25 transition-all hover:bg-[#196b7b] active:scale-[0.98] disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              ساخت حساب رایگان
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            قبلاً ثبت‌نام کردی؟ <Link className="font-semibold text-[#1f7a8c] hover:underline" href="/login">وارد شو</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function AuthBrandPanel() {
  return (
    <aside className="fixed inset-y-0 right-0 hidden w-[45%] flex-col justify-between bg-gradient-to-br from-[#165e6d] to-[#1f7a8c] p-12 lg:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Sparkles size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">مدیریت واحد بهبود عملیات و برنامه ریزی</span>
      </div>
      <div>
        <h2 className="text-5xl font-extrabold leading-tight text-white">تیمت رو<br /><span className="opacity-80">منظم نگه دار</span></h2>
        <p className="mt-6 text-lg leading-8 text-[#a8dde5]">پروژه‌ها، گزارش‌ها و تیم رو از یک داشبورد پیگیری کن.</p>
      </div>
      <p className="text-xs text-[#7ec5cf]">مدیریت واحد بهبود عملیات و برنامه ریزی</p>
    </aside>
  );
}

function MobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-2 lg:hidden">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f7a8c] text-white"><Sparkles size={18} /></div>
      <span className="text-lg font-bold">مدیریت واحد بهبود عملیات و برنامه ریزی</span>
    </div>
  );
}
