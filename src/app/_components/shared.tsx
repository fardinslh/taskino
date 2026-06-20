import { useState, type HTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  LayoutDashboard,
  Plus,
  X,
} from "lucide-react";
import type { User } from "@/lib/api";
import { initials, userName } from "../_lib/task-helpers";

// ─── Shared components ────────────────────────────────────────────────────────
export function Field({ label, name, id, required, type = "text", value, onChange, placeholder, dir, inputMode, registration }: {
  label: string; name: string; id?: string; required?: boolean; type?: string;
  value?: string; onChange?: (v: string) => void; placeholder?: string;
  dir?: "ltr" | "rtl"; inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  registration?: UseFormRegisterReturn;
}) {
  const isPasswordField = type === "password";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const resolvedType = isPasswordField && passwordVisible ? "text" : type;

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">{label}</span>}
      <span className="relative block">
        <input
          id={id} dir={dir} inputMode={inputMode} ref={registration?.ref}
          className={`h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition placeholder:text-[--text-3] focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15 ${dir === "ltr" ? "text-left" : ""} ${isPasswordField ? "pl-10" : ""}`}
          name={registration?.name ?? name}
          onBlur={registration?.onBlur}
          onChange={(e) => { void registration?.onChange(e); onChange?.(e.target.value); }}
          required={required}
          type={resolvedType}
          value={value}
          placeholder={placeholder}
        />
        {isPasswordField ? (
          <button
            aria-label={passwordVisible ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
            className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[--text-3] transition hover:text-[--text]"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </span>
    </label>
  );
}

export function Select({ label, value, onChange, options, placeholder, registration }: {
  label: string; value?: string; onChange?: (v: string) => void; options: Array<[string, string]>; placeholder?: string;
  registration?: UseFormRegisterReturn;
}) {
  const uniqueOptions = Array.from(
    new Map(options.map(([id, optionLabel]) => [id, optionLabel])).entries(),
  );

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-[--text-2]">{label}</span>}
      <select
        className="h-10 w-full rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--text] outline-none transition focus:border-[#1f7a8c] focus:ring-2 focus:ring-[#1f7a8c]/15"
        name={registration?.name}
        onBlur={registration?.onBlur}
        onChange={(e) => { void registration?.onChange(e); onChange?.(e.target.value); }}
        ref={registration?.ref}
        value={value}
      >
        <option value="">{placeholder ?? "انتخاب نشده"}</option>
        {uniqueOptions.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
      </select>
    </label>
  );
}

export function SideItem({ active, icon: Icon, label, meta, collapsed, onClick }: {
  active?: boolean; icon: typeof LayoutDashboard; label: string; meta?: number; collapsed?: boolean; onClick?: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all ${active ? "bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5]" : "text-[--text-2] hover:bg-[--surface-2] hover:text-[--text]"} ${collapsed ? "justify-center" : "justify-between"}`}
      onClick={onClick} type="button"
      title={collapsed ? label : undefined}
    >
      <span className="flex items-center gap-2.5"><Icon size={16} />{!collapsed && label}</span>
      {!collapsed && meta !== undefined && (
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-[#1f7a8c]/12 text-[#1f7a8c] dark:text-[#4fc3d5]" : "bg-[--surface-2] text-[--text-3]"}`}>{meta}</span>
      )}
    </button>
  );
}

export function FilterChip({ active, label, count, onClick }: { active?: boolean; label: string; count: number; onClick?: () => void }) {
  return (
    <button
      className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all ${active ? "border-[#1f7a8c]/30 bg-[#e8f4f7] text-[#1f7a8c] dark:bg-[#0f3040] dark:text-[#4fc3d5] dark:border-[#1f5060]" : "border-[--border] bg-[--surface] text-[--text-2] hover:bg-[--surface-2]"}`}
      onClick={onClick} type="button"
    >
      <span className="max-w-24 truncate">{label}</span>
      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-[#1f7a8c]/10" : "bg-[--surface-2]"}`}>{count}</span>
    </button>
  );
}

export function AssigneeStack({ users, fallback }: { users?: Array<string | User>; fallback?: string | User }) {
  const visible = users?.length ? users.slice(0, 3) : fallback ? [fallback] : [];
  if (!visible.length) return <span className="text-xs text-[--text-3]">بدون مسئول</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5 space-x-reverse">
        {visible.map((u, i) => (
          <span key={`${userName(u)}-${i}`} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[--surface] bg-gradient-to-br from-[#e8f4f7] to-[#d0edf3] dark:from-[#0f3040] dark:to-[#1f5060] text-[9px] font-bold text-[#1f7a8c] dark:text-[#4fc3d5] shadow-sm" title={userName(u)}>
            {initials(u)}
          </span>
        ))}
      </div>
      {visible.length === 1 && <span className="text-xs font-medium text-[--text-2]">{userName(visible[0])}</span>}
    </div>
  );
}

export function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  if (!message) return null;
  const ok = type === "success";
  return (
    <div className="fixed left-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm" role="status" aria-live="polite">
      <div className={`flex items-center gap-3 rounded-xl border bg-[--surface] px-4 py-3 shadow-xl ${ok ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900"}`}>
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"}`}>
          {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
        </div>
        <p className="flex-1 text-sm font-medium text-[--text]">{message}</p>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[--text-3] transition hover:bg-[--surface-2]" onClick={onClose} type="button"><X size={13} /></button>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[--border] bg-[--surface]">
      <div className="skeleton h-16 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="mt-3 flex items-center justify-between border-t border-[--border] pt-3">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-5 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-xl border-2 border-dashed border-[--border] p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--surface-2] text-[--text-3]"><FolderKanban size={26} /></div>
      <p className="mt-3 font-semibold text-[--text]">{title}</p>
      <p className="mt-1 text-sm text-[--text-3]">{text}</p>
      {action && (
        <button className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#196b7b]" onClick={action.onClick} type="button">
          <Plus size={15} />{action.label}
        </button>
      )}
    </div>
  );
}
