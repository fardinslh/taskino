"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { authApi } from "@/lib/api";
import { Field, Toast } from "../_components/shared";

type LoginFormValues = {
  mobile: string;
  password: string;
};

function defaultRouteForRole(role?: string) {
  return role === "manager" ? "/analytics" : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { formState: { isSubmitting }, handleSubmit, register } = useForm<LoginFormValues>({
    defaultValues: { mobile: "", password: "" },
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const signupMessage = sessionStorage.getItem("taskino-signup-message") ?? "";
    if (signupMessage) sessionStorage.removeItem("taskino-signup-message");
    return signupMessage;
  });

  useEffect(() => {
    if (!localStorage.getItem("taskino-token")) return;
    const storedUser = localStorage.getItem("taskino-user");
    const user = storedUser ? JSON.parse(storedUser) : undefined;
    if (user?.isActive !== true) {
      localStorage.removeItem("taskino-token");
      localStorage.removeItem("taskino-user");
      return;
    }
    router.replace(defaultRouteForRole(user?.roles));
  }, [router]);

  async function handleLogin(values: LoginFormValues) {
    setError("");
    setMessage("");

    try {
      const data = await authApi.login(values);
      if (data.user?.isActive !== true) {
        localStorage.removeItem("taskino-token");
        localStorage.removeItem("taskino-user");
        setError("حساب شما هنوز توسط مدیر تایید نشده است. لطفا منتظر تایید مدیر بمانید.");
        return;
      }

      localStorage.setItem("taskino-token", data.accessToken);
      localStorage.setItem("taskino-user", JSON.stringify(data.user));
      setMessage("با موفقیت وارد شدی.");
      router.push(defaultRouteForRole(data.user?.roles));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود ناموفق بود");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white dark:bg-slate-950">
      <Toast message={error || message} type={error ? "error" : "success"} onClose={() => error ? setError("") : setMessage("")} />
      <AuthBrandPanel />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12 lg:mr-[45%]">
        <div className="w-full max-w-md">
          <MobileBrand />
          <h1 className="text-3xl font-bold">خوش برگشتی</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">با حساب‌ات وارد شو</p>

          <div className="mt-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <span className="rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-[#1f7a8c] shadow-sm dark:bg-slate-700">ورود</span>
            <Link className="rounded-lg py-2.5 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300" href="/signup">
              ثبت‌نام
            </Link>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(handleLogin)}>
            <Field label="موبایل" name="mobile" required placeholder="09xxxxxxxxx" dir="ltr" inputMode="tel" registration={register("mobile", { required: true })} />
            <Field label="رمز عبور" name="password" required type="password" placeholder="حداقل ۶ کاراکتر" registration={register("password", { required: true })} />
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] text-sm font-semibold text-white shadow-lg shadow-[#1f7a8c]/25 transition-all hover:bg-[#196b7b] active:scale-[0.98] disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              ورود به سامانه
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            حساب نداری؟ <Link className="font-semibold text-[#1f7a8c] hover:underline" href="/signup">ثبت‌نام کن</Link>
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
