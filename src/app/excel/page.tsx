"use client";

import { Download, Loader2, Trash2, Upload } from "lucide-react";

import { getId } from "@/lib/api";
import {
  useExcelContext,
  useNavigationContext,
  useTaskContext,
} from "../_components/taskino-context";
import { statusLabel } from "../_lib/task-helpers";

export default function ExcelPage() {
  return <ExcelPageContent />;
}

function ExcelPageContent() {
  const { activeView } = useNavigationContext();
  const { tasks } = useTaskContext();
  const {
    excelFiles,
    excelStats,
    excelUploading,
    handleExcelUpload,
    downloadExcelFile,
    processExcelFile,
    deleteExcelFile,
    exportTasksToExcel,
  } = useExcelContext();

  return (
    <>
{activeView === "excel" && (
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                {[
                  { label: "کل فایل‌ها", value: excelStats?.totalFiles ?? 0 },
                  { label: "ایمپورت", value: excelStats?.totalImports ?? 0 },
                  { label: "اکسپورت", value: excelStats?.totalExports ?? 0 },
                  { label: "موفق", value: excelStats?.completedImports ?? 0 },
                  { label: "ناموفق", value: excelStats?.failedImports ?? 0 },
                ].map((s: any) => (
                  <div key={s.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                    <p className="text-xs text-[--text-3]">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[--border] bg-[--surface] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold">مدیریت فایل‌های اکسل</h2>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#1f7a8c] px-4 text-sm font-semibold text-white transition hover:bg-[#196b7b]">
                      {excelUploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                      آپلود فایل
                      <input accept=".xlsx,.xls,.csv" className="hidden" disabled={excelUploading} onChange={handleExcelUpload} type="file" />
                    </label>
                    <button
                      className="flex h-9 items-center gap-2 rounded-lg border border-[--border] bg-[--surface-2] px-4 text-sm font-semibold transition hover:bg-[--surface]"
                      disabled={!tasks.length}
                      onClick={() => void exportTasksToExcel()} type="button"
                    >
                      <Download size={15} />خروجی گزارش‌ها
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {excelFiles.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[--border] p-8 text-center text-sm text-[--text-3]">هنوز فایلی آپلود نشده</p>
                  ) : (
                    excelFiles.map((f: any) => (
                      <div key={getId(f)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--border] bg-[--surface-2] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{f.originalName || f.fileName}</p>
                          <p className="text-xs text-[--text-3]">
                            {f.type === "import" ? "ایمپورت" : "اکسپورت"} · {statusLabel(f.status)} · {f.totalRows ?? 0} ردیف
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex h-8 items-center gap-1 rounded-lg border border-[--border] bg-[--surface] px-3 text-xs font-semibold" onClick={() => void downloadExcelFile(f)} type="button">
                            <Download size={13} />دانلود
                          </button>
                          {f.type === "import" && f.status === "pending" && (
                            <button className="flex h-8 items-center rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-600" onClick={() => void processExcelFile(getId(f))} type="button">
                              پردازش
                            </button>
                          )}
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50" onClick={() => void deleteExcelFile(getId(f))} type="button">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          
    </>
  );
}
