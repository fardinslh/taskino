"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTaskinoPageContext } from "../_components/taskino-context";

type SettingsFormValues = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function SettingsPage() {
  return <SettingsPageContent />;
}

function SettingsPageContent() {
  const {
    Field,
    activeView,
    currentUser,
    isManager,
    myId,
    setCurrentUser,
    setError,
    setMessage,
    token,
    userApi,
  } = useTaskinoPageContext();

  const { formState: { isSubmitting }, handleSubmit, register, reset } = useForm<SettingsFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  useEffect(() => {
    reset({
      firstName: currentUser?.firstName ?? "",
      lastName: currentUser?.lastName ?? "",
      email: currentUser?.email ?? "",
    });
  }, [currentUser, reset]);

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

  if (activeView !== "settings") return null;

  return (
    <section className="rounded-2xl border border-[--border] bg-[--surface] p-5">
      <h2 className="font-bold">تنظیمات پروفایل</h2>
      <form className="mt-4 grid max-w-lg gap-3" onSubmit={handleSubmit(saveProfile)}>
        <Field label="نام" name="firstName" registration={register("firstName")} />
        <Field label="نام خانوادگی" name="lastName" registration={register("lastName")} />
        <Field label="ایمیل" name="email" type="email" registration={register("email")} />
        {isManager ? (
          <button
            className="h-10 w-fit rounded-lg bg-[#1f7a8c] px-5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
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
    </section>
  );
}
