"use client";

import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";

import { leaveApi } from "@/lib/api";
import { useFeedbackContext, useSessionContext } from "./taskino-context";

type LeaveRequestFormValues = {
  startDate: string;
  endDate: string;
  reason: string;
  recurrence: "daily" | "weekly";
};

export function LeaveRequestForm() {
  const { myId, token } = useSessionContext();
  const { loadData, setError, setMessage } = useFeedbackContext();
  const {
    control,
    formState: { isSubmitting, errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<LeaveRequestFormValues>({
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
      recurrence: "daily",
    },
  });
  const startDate = watch("startDate");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  async function createLeaveRequest(values: LeaveRequestFormValues) {
    if (!myId || !values.startDate || !values.endDate) return;

    const start = new Date(values.startDate);
    const end = new Date(values.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("تاریخ وارد شده معتبر نیست.");
      return;
    }

    if (end < start) {
      setError("تاریخ پایان باید بعد از تاریخ شروع باشد.");
      return;
    }

    try {
      await leaveApi.create(token, {
        user: myId,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        recurrence: values.recurrence,
        approvedBy: myId,
      });
      reset();
      setMessage("درخواست مرخصی ثبت شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت مرخصی ناموفق بود");
    }
  }

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2"
      onSubmit={handleSubmit(createLeaveRequest)}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
          از تاریخ
        </span>
        <Controller
          control={control}
          name="startDate"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : ""}
              onChange={(value) => {
                if (!value || Array.isArray(value)) {
                  field.onChange("");
                  return;
                }

                field.onChange(value.toDate().toISOString());
              }}
              calendar={jalali}
              locale={persianFa}
              minDate={todayStart}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              containerClassName="w-full"
              placeholder="انتخاب تاریخ شروع"
            />
          )}
        />
        {errors.startDate && (
          <span className="mt-1 block text-xs text-red-500">
            این فیلد الزامی است.
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
          تا تاریخ
        </span>
        <Controller
          control={control}
          name="endDate"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              value={field.value ? new Date(field.value) : ""}
              onChange={(value) => {
                if (!value || Array.isArray(value)) {
                  field.onChange("");
                  return;
                }

                field.onChange(value.toDate().toISOString());
              }}
              calendar={jalali}
              locale={persianFa}
              minDate={
                startDate
                  ? (() => {
                      const value = new Date(startDate);
                      value.setHours(0, 0, 0, 0);
                      return value;
                    })()
                  : todayStart
              }
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
              containerClassName="w-full"
              placeholder="انتخاب تاریخ پایان"
            />
          )}
        />
        {errors.endDate && (
          <span className="mt-1 block text-xs text-red-500">
            این فیلد الزامی است.
          </span>
        )}
      </label>

      <div className="sm:col-span-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
            تکرار
          </span>
          <select
            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
            {...register("recurrence", { required: true })}
          >
            <option value="daily">روزانه</option>
            <option value="weekly">هفتگی</option>
          </select>
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
            دلیل
          </span>
          <input
            className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
            placeholder="اختیاری"
            {...register("reason")}
          />
        </label>
      </div>

      <div className="flex items-end">
        <button
          className="h-10 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          ثبت درخواست
        </button>
      </div>
    </form>
  );
}
