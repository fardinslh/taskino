"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { Clock3, Send } from "lucide-react";
import { motion } from "motion/react";

import { leaveApi } from "@/lib/api";
import { useFeedbackContext, useSessionContext } from "./taskino-context";

type LeaveRequestFormValues = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  recurrence: "daily" | "weekly" | "hourly";
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
  } = useForm<LeaveRequestFormValues>({
    defaultValues: {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      reason: "",
      recurrence: "hourly",
    },
  });
  const startDate = useWatch({ control, name: "startDate" });
  const recurrence = useWatch({ control, name: "recurrence" });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  function dateOnlyIso(dateValue: string) {
    const date = new Date(dateValue);
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    ).toISOString();
  }

  function timeMinutes(timeValue: string) {
    const [hours, minutes] = normalizeTime(timeValue).split(":").map(Number);
    return hours * 60 + minutes;
  }

  function timePickerValue(timeValue: string) {
    if (!timeValue) return "";
    const [hours, minutes] = normalizeTime(timeValue).split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  function normalizeTime(timeValue: string) {
    const normalizedDigits = timeValue.replace(/[۰-۹٠-٩]/g, (digit) => {
      const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
      const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
      const persianIndex = persianDigits.indexOf(digit);
      if (persianIndex >= 0) return String(persianIndex);

      return String(arabicDigits.indexOf(digit));
    });
    const [hours = "", minutes = ""] = normalizedDigits.split(":");

    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }

  async function createLeaveRequest(values: LeaveRequestFormValues) {
    if (!myId || !values.startDate || !values.endDate) return;

    if (values.recurrence === "hourly" && (!values.startTime || !values.endTime)) {
      setError("ساعت شروع و پایان برای مرخصی ساعتی الزامی است.");
      return;
    }

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

    if (
      values.recurrence === "hourly" &&
      timeMinutes(values.endTime) <= timeMinutes(values.startTime)
    ) {
      setError("ساعت پایان باید بعد از ساعت شروع باشد.");
      return;
    }

    try {
      const startTime =
        values.recurrence === "hourly"
          ? normalizeTime(values.startTime)
          : values.startTime;
      const endTime =
        values.recurrence === "hourly"
          ? normalizeTime(values.endTime)
          : values.endTime;

      await leaveApi.create(token, {
        user: myId,
        startDate: dateOnlyIso(values.startDate),
        endDate: dateOnlyIso(values.endDate),
        recurrence: values.recurrence,
        ...(values.recurrence === "hourly"
          ? {
              startTime,
              endTime,
            }
          : {}),
        reason: values.reason,
        approvedBy: myId,
      });
      reset();
      setMessage("درخواست مرخصی ثبت شد.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ثبت مرخصی ناموفق بود");
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition-[border-color,box-shadow] placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15";

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit(createLeaveRequest)}>
      <div className="rounded-2xl bg-[--surface-2]/70 p-3 shadow-[inset_0_0_0_1px_var(--border)]">
        <p className="mb-2 text-xs font-bold text-[--text-2]">نوع مرخصی</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="نوع مرخصی">
          {[
            { value: "hourly", label: "ساعتی" },
            { value: "daily", label: "روزانه" },
            { value: "weekly", label: "هفتگی" },
          ].map((option) => {
            const isSelected = recurrence === option.value;

            return (
            <label className="relative cursor-pointer" key={option.value}>
              <input
                className="peer sr-only"
                type="radio"
                value={option.value}
                {...register("recurrence", { required: true })}
              />
              {isSelected && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-[#1f7a8c] shadow-sm"
                  initial={false}
                  layoutId="leave-type-selection"
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                />
              )}
              <span
                className={`relative z-10 flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-[color,transform] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1f7a8c]/30 active:scale-[0.96] ${
                  isSelected ? "text-white" : "text-[--text-2] hover:text-[#1f7a8c]"
                }`}
              >
                {option.label}
              </span>
            </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">از تاریخ</span>
          <Controller
            control={control}
            name="startDate"
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker
                portal
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
                inputClass={inputClass}
                containerClassName="w-full"
                zIndex={10000}
                placeholder="انتخاب تاریخ شروع"
              />
            )}
          />
          {errors.startDate && <span className="mt-1 block text-xs text-red-500">این فیلد الزامی است.</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">تا تاریخ</span>
          <Controller
            control={control}
            name="endDate"
            rules={{ required: true }}
            render={({ field }) => (
              <DatePicker
                portal
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
                minDate={startDate ? new Date(startDate) : todayStart}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                inputClass={inputClass}
                containerClassName="w-full"
                zIndex={10000}
                placeholder="انتخاب تاریخ پایان"
              />
            )}
          />
          {errors.endDate && <span className="mt-1 block text-xs text-red-500">این فیلد الزامی است.</span>}
        </label>
      </div>

      {recurrence === "hourly" && (
        <div className="rounded-2xl bg-[#1f7a8c]/[0.07] p-3 shadow-[inset_0_0_0_1px_rgba(31,122,140,0.18)]">
          <div className="mb-2 flex items-center gap-2 text-[#1f7a8c]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1f7a8c]/10">
              <Clock3 size={16} />
            </span>
            <div>
              <p className="text-xs font-bold">بازه زمانی مرخصی</p>
              <p className="mt-0.5 text-[11px] text-[--text-3]">ساعت شروع و پایان را مشخص کنید</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">ساعت شروع</span>
              <Controller
                control={control}
                name="startTime"
                rules={{ required: recurrence === "hourly" }}
                render={({ field }) => (
                  <DatePicker
                    portal
                    value={timePickerValue(field.value)}
                    onChange={(value) => {
                      if (!value || Array.isArray(value)) {
                        field.onChange("");
                        return;
                      }
                      field.onChange(normalizeTime(value.format("HH:mm")));
                    }}
                    calendar={jalali}
                    locale={persianFa}
                    disableDayPicker
                    format="HH:mm"
                    plugins={[<TimePicker key="start-time" hideSeconds />]}
                    calendarPosition="bottom-right"
                    inputClass={inputClass}
                    containerClassName="w-full"
                    zIndex={10000}
                    placeholder="انتخاب ساعت شروع"
                  />
                )}
              />
              {errors.startTime && <span className="mt-1 block text-xs text-red-500">این فیلد الزامی است.</span>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">ساعت پایان</span>
              <Controller
                control={control}
                name="endTime"
                rules={{ required: recurrence === "hourly" }}
                render={({ field }) => (
                  <DatePicker
                    portal
                    value={timePickerValue(field.value)}
                    onChange={(value) => {
                      if (!value || Array.isArray(value)) {
                        field.onChange("");
                        return;
                      }
                      field.onChange(normalizeTime(value.format("HH:mm")));
                    }}
                    calendar={jalali}
                    locale={persianFa}
                    disableDayPicker
                    format="HH:mm"
                    plugins={[<TimePicker key="end-time" hideSeconds />]}
                    calendarPosition="bottom-right"
                    inputClass={inputClass}
                    containerClassName="w-full"
                    zIndex={10000}
                    placeholder="انتخاب ساعت پایان"
                  />
                )}
              />
              {errors.endTime && <span className="mt-1 block text-xs text-red-500">این فیلد الزامی است.</span>}
            </label>
          </div>
        </div>
      )}

      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">دلیل مرخصی</span>
          <input className={inputClass} placeholder="در صورت نیاز توضیح کوتاهی بنویسید" {...register("reason")} />
        </label>
        <button
          className="flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#1f7a8c] pl-4 pr-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(31,122,140,0.2)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[#196b7b] hover:shadow-[0_10px_24px_rgba(31,122,140,0.26)] active:scale-[0.96] disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <Send size={15} />
          ثبت درخواست
        </button>
      </div>
    </form>
  );
}
