"use client";

import { useForm } from "react-hook-form";
import { leaveApi } from "@/lib/api";
import { Field } from "./shared";
import {
  useFeedbackContext,
  useSessionContext,
} from "./taskino-context";

type LeaveRequestFormValues = {
  startDate: string;
  endDate: string;
  reason: string;
};

export function LeaveRequestForm() {
  const { myId, token } = useSessionContext();
  const { loadData, setError, setMessage } = useFeedbackContext();
  const { formState: { isSubmitting }, handleSubmit, register, reset } = useForm<LeaveRequestFormValues>({
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  async function createLeaveRequest(values: LeaveRequestFormValues) {
    if (!myId || !values.startDate || !values.endDate) return;

    try {
      await leaveApi.create(token, {
        user: myId,
        startDate: values.startDate,
        endDate: values.endDate,
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
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(createLeaveRequest)}>
      <Field label="از تاریخ" name="startDate" required type="date" registration={register("startDate", { required: true })} />
      <Field label="تا تاریخ" name="endDate" required type="date" registration={register("endDate", { required: true })} />
      <Field label="دلیل" name="reason" placeholder="اختیاری" registration={register("reason")} />
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
