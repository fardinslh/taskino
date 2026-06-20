"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import {
  type PasswordResetVerifyResponse,
  request,
  userApi,
} from "@/lib/api";
import { Field } from "../_components/shared";
import {
  useFeedbackContext,
  useNavigationContext,
  useSessionContext,
} from "../_components/taskino-context";

type SettingsFormValues = {
  firstName: string;
  lastName: string;
  email: string;
};

type ForgotPasswordFormValues = {
  mobile: string;
};

type VerifyCodeFormValues = {
  code: string;
};

type ChangePasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

const MAX_VERIFY_ATTEMPTS = 5;

export default function SettingsPage() {
  return <SettingsPageContent />;
}

function SettingsPageContent() {
  const { activeView } = useNavigationContext();
  const {
    currentUser,
    isManager,
    myId,
    setCurrentUser,
    token,
  } = useSessionContext();
  const { setError, setMessage } = useFeedbackContext();

  const {
    formState: { isSubmitting: isSavingProfile },
    handleSubmit: handleProfileSubmit,
    register: registerProfile,
    reset: resetProfile,
  } = useForm<SettingsFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const {
    formState: { isSubmitting: isSendingCode },
    handleSubmit: handleForgotSubmit,
    register: registerForgot,
    setValue: setForgotValue,
    watch: watchForgot,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      mobile: "",
    },
  });

  const {
    formState: { isSubmitting: isVerifyingCode },
    handleSubmit: handleVerifySubmit,
    register: registerVerify,
    reset: resetVerify,
  } = useForm<VerifyCodeFormValues>({
    defaultValues: {
      code: "",
    },
  });

  const {
    formState: { isSubmitting: isChangingPassword },
    handleSubmit: handleChangeSubmit,
    register: registerChange,
    reset: resetChange,
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [passwordStep, setPasswordStep] = useState<1 | 2 | 3>(1);
  const [resetToken, setResetToken] = useState("");
  const [verifyResponse, setVerifyResponse] =
    useState<PasswordResetVerifyResponse | null>(null);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  const watchedMobile = watchForgot("mobile");
  const mobilePlaceholder = currentUser?.mobile ?? "09xxxxxxxxx";

  useEffect(() => {
    resetProfile({
      firstName: currentUser?.firstName ?? "",
      lastName: currentUser?.lastName ?? "",
      email: currentUser?.email ?? "",
    });

    if (currentUser?.mobile) {
      setForgotValue("mobile", currentUser.mobile, { shouldDirty: false });
    }
  }, [currentUser, resetProfile, setForgotValue]);

  async function saveProfile(values: SettingsFormValues) {
    if (!myId) return;

    try {
      const updated = await userApi.update(token, myId, values);
      setCurrentUser(updated);
      localStorage.setItem("taskino-user", JSON.stringify(updated));
      setMessage("پروفایل ذخیره شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره پروفایل ناموفق بود");
    }
  }

  async function sendResetCode(values: ForgotPasswordFormValues) {
    setError("");
    setMessage("");

    try {
      await request("/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ mobile: values.mobile.trim() }),
      });
      setPasswordStep(2);
      setResetToken("");
      setVerifyResponse(null);
      setVerifyAttempts(0);
      resetVerify({ code: "" });
      resetChange({ newPassword: "", confirmPassword: "" });
      setMessage("کد شش‌رقمی برای شماره موبایل ارسال شد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ارسال کد بازیابی ناموفق بود",
      );
    }
  }

  async function verifyCode(values: VerifyCodeFormValues) {
    setError("");
    setMessage("");

    try {
      const response = await request<PasswordResetVerifyResponse>(
        "/auth/password/verify-code",
        {
          method: "POST",
          body: JSON.stringify({
            mobile: watchedMobile.trim(),
            code: values.code.trim(),
          }),
        },
      );

      setResetToken(response.resetToken);
      setVerifyResponse(response);
      setPasswordStep(3);
      setMessage("کد با موفقیت تایید شد. حالا رمز جدید را ثبت کنید.");
    } catch (err) {
      let limitReached = false;
      setVerifyAttempts((attempts) => {
        const nextAttempts = attempts + 1;
        limitReached = nextAttempts >= MAX_VERIFY_ATTEMPTS;
        return nextAttempts;
      });

      if (limitReached) {
        setPasswordStep(1);
        setResetToken("");
        setVerifyResponse(null);
        resetVerify({ code: "" });
        setError("حداکثر ۵ تلاش برای تایید کد مجاز است. دوباره کد بگیرید.");
        return;
      }

      setError(
        err instanceof Error ? err.message : "تایید کد بازیابی ناموفق بود",
      );
    }
  }

  async function changePassword(values: ChangePasswordFormValues) {
    setError("");
    setMessage("");

    const newPassword = values.newPassword.trim();
    const confirmPassword = values.confirmPassword.trim();

    if (newPassword.length < 6) {
      setError("رمز جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }

    try {
      await request("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      setPasswordStep(1);
      setResetToken("");
      setVerifyResponse(null);
      setVerifyAttempts(0);
      resetVerify({ code: "" });
      resetChange({ newPassword: "", confirmPassword: "" });
      setMessage("رمز عبور با موفقیت تغییر کرد.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تغییر رمز عبور ناموفق بود",
      );
    }
  }

  if (activeView !== "settings") return null;

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
        <h2 className="font-bold">تنظیمات پروفایل</h2>
        <form
          className="mt-4 grid max-w-lg gap-3"
          onSubmit={handleProfileSubmit(saveProfile)}
        >
          <Field
            label="نام"
            name="firstName"
            registration={registerProfile("firstName")}
          />
          <Field
            label="نام خانوادگی"
            name="lastName"
            registration={registerProfile("lastName")}
          />
          <Field
            label="ایمیل"
            name="email"
            type="email"
            registration={registerProfile("email")}
          />
          {isManager ? (
            <button
              className="h-10 w-fit rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSavingProfile}
              type="submit"
            >
              ذخیره تغییرات
            </button>
          ) : (
            <p className="rounded-lg bg-[--surface-2] px-3 py-2.5 text-xs text-[--text-3]">
              ویرایش پروفایل فقط توسط مدیر امکان‌پذیر است.
            </p>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f7a8c]/10 text-[#1f7a8c]">
            <KeyRound size={20} />
          </div>
          <div className="space-y-1">
            <h2 className="font-bold">بازیابی و تغییر رمز عبور</h2>
            <p className="text-sm text-[--text-3]">
              کد بازیابی شش‌رقمی است، ۱۵ دقیقه اعتبار دارد و فقط ۵ تلاش برای
              تایید آن مجاز است.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <PasswordResetStep
            active={passwordStep === 1}
            complete={passwordStep > 1}
            icon={<ShieldCheck size={16} />}
            title="۱. دریافت کد"
            text="شماره موبایل ثبت‌شده را وارد کنید تا کد بازیابی ارسال شود."
          />
          <PasswordResetStep
            active={passwordStep === 2}
            complete={passwordStep > 2}
            icon={<CheckCircle2 size={16} />}
            title="۲. تایید کد"
            text={`کد ارسال‌شده را وارد کنید. تلاش باقی‌مانده: ${
              MAX_VERIFY_ATTEMPTS - verifyAttempts
            }`}
          />
          <PasswordResetStep
            active={passwordStep === 3}
            complete={false}
            icon={<KeyRound size={16} />}
            title="۳. ثبت رمز جدید"
            text="بعد از دریافت توکن بازیابی، رمز جدید را ثبت کنید."
          />
        </div>

        {passwordStep === 1 ? (
          <form
            className="mt-5 grid gap-3"
            onSubmit={handleForgotSubmit(sendResetCode)}
          >
            <Field
              label="موبایل"
              name="mobile"
              dir="ltr"
              inputMode="tel"
              placeholder={mobilePlaceholder}
              registration={registerForgot("mobile", { required: true })}
            />
            <button
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSendingCode}
              type="submit"
            >
              {isSendingCode ? <Loader2 className="animate-spin" size={16} /> : null}
              {isSendingCode ? "در حال ارسال..." : "ارسال کد بازیابی"}
            </button>
          </form>
        ) : null}

        {passwordStep === 2 ? (
          <form
            className="mt-5 grid gap-3"
            onSubmit={handleVerifySubmit(verifyCode)}
          >
            <Field
              label="کد شش‌رقمی"
              name="code"
              dir="ltr"
              inputMode="numeric"
              placeholder="123456"
              registration={registerVerify("code", {
                required: true,
                minLength: 6,
                maxLength: 6,
              })}
            />
            <div className="flex gap-3">
              <button
                className="h-11 flex-1 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isVerifyingCode || verifyAttempts >= MAX_VERIFY_ATTEMPTS}
                type="submit"
              >
                تایید کد
              </button>
              <button
                className="h-11 rounded-xl border border-[--border] px-4 text-sm font-semibold text-[--text-2]"
                onClick={() => {
                  setPasswordStep(1);
                  setVerifyAttempts(0);
                  resetVerify({ code: "" });
                }}
                type="button"
              >
                ویرایش موبایل
              </button>
            </div>
          </form>
        ) : null}

        {passwordStep === 3 ? (
          <form
            className="mt-5 grid gap-3"
            onSubmit={handleChangeSubmit(changePassword)}
          >
            <Field
              label="رمز جدید"
              name="newPassword"
              type="password"
              placeholder="حداقل ۶ کاراکتر"
              registration={registerChange("newPassword", { required: true })}
            />
            <Field
              label="تکرار رمز جدید"
              name="confirmPassword"
              type="password"
              placeholder="رمز را دوباره وارد کنید"
              registration={registerChange("confirmPassword", {
                required: true,
              })}
            />
            <div className="rounded-xl bg-[--surface-2] px-3 py-3 text-xs text-[--text-3]">
              <p>شماره موبایل: {watchedMobile || mobilePlaceholder}</p>
            </div>
            <button
              className="h-11 rounded-xl bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isChangingPassword || !resetToken}
              type="submit"
            >
              تغییر رمز عبور
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

function PasswordResetStep({
  active,
  complete,
  icon,
  title,
  text,
}: {
  active?: boolean;
  complete?: boolean;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 transition ${
        active
          ? "border-[#1f7a8c]/30 bg-[#1f7a8c]/5"
          : complete
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-[--border] bg-[--surface]"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[--text]">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            active
              ? "bg-[#1f7a8c] text-white"
              : complete
                ? "bg-emerald-600 text-white"
                : "bg-[--surface-2] text-[--text-2]"
          }`}
        >
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-2 text-xs leading-6 text-[--text-3]">{text}</p>
    </div>
  );
}
