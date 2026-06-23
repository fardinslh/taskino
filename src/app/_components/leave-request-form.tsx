"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import jalali from "react-date-object/calendars/jalali";
import persianFa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

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
      recurrence: "daily",
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
            <option value="hourly">ساعتی</option>
          </select>
        </label>
      </div>

      {recurrence === "hourly" && (
        <>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
              ساعت شروع
            </span>
            <Controller
              control={control}
              name="startTime"
              rules={{ required: recurrence === "hourly" }}
              render={({ field }) => (
                <DatePicker
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
                  inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  containerClassName="w-full"
                  placeholder="انتخاب ساعت شروع"
                />
              )}
            />
            {errors.startTime && (
              <span className="mt-1 block text-xs text-red-500">
                این فیلد الزامی است.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">
              ساعت پایان
            </span>
            <Controller
              control={control}
              name="endTime"
              rules={{ required: recurrence === "hourly" }}
              render={({ field }) => (
                <DatePicker
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
                  inputClass="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
                  containerClassName="w-full"
                  placeholder="انتخاب ساعت پایان"
                />
              )}
            />
            {errors.endTime && (
              <span className="mt-1 block text-xs text-red-500">
                این فیلد الزامی است.
              </span>
            )}
          </label>
        </>
      )}

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
