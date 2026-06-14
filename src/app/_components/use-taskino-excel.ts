"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  excelApi,
  getId,
  normalizeList,
  type ExcelFile,
  type ExcelStatistics,
  type Task,
} from "@/lib/api";
import type { View } from "../_lib/task-constants";
import { statusLabel, userName } from "../_lib/task-helpers";

type ExcelControllerInput = {
  activeView: View;
  myId: string;
  setError: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  tasks: Task[];
  token: string;
};

export function useTaskinoExcel({
  activeView,
  myId,
  setError,
  setMessage,
  tasks,
  token,
}: ExcelControllerInput) {
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [excelStats, setExcelStats] = useState<ExcelStatistics | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);

  const loadExcelData = useCallback(
    async (authToken = token) => {
      if (!authToken || !myId) return;

      try {
        const [files, statistics] = await Promise.all([
          excelApi.list(authToken, { limit: 50, createdBy: myId }),
          excelApi.statistics(authToken, myId),
        ]);
        setExcelFiles(normalizeList(files));
        setExcelStats(statistics);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "دریافت فایل‌های اکسل ناموفق بود",
        );
      }
    },
    [myId, setError, token],
  );

  useEffect(() => {
    if (token && activeView === "excel") {
      queueMicrotask(() => void loadExcelData());
    }
  }, [activeView, loadExcelData, token]);

  async function handleExcelUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !myId) return;

    setExcelUploading(true);
    try {
      await excelApi.upload(token, file, myId, "import");
      setMessage("فایل اکسل آپلود شد.");
      await loadExcelData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "آپلود فایل ناموفق بود");
    } finally {
      setExcelUploading(false);
      event.target.value = "";
    }
  }

  async function downloadExcelFile(record: ExcelFile) {
    try {
      await excelApi.download(
        token,
        getId(record),
        record.originalName || record.fileName || "file.xlsx",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "دانلود فایل ناموفق بود",
      );
    }
  }

  async function processExcelFile(id: string) {
    try {
      await excelApi.process(token, id);
      setMessage("فایل پردازش شد.");
      await loadExcelData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "پردازش فایل ناموفق بود");
    }
  }

  async function deleteExcelFile(id: string) {
    try {
      await excelApi.delete(token, id);
      setMessage("فایل حذف شد.");
      await loadExcelData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف فایل ناموفق بود");
    }
  }

  async function exportTasksToExcel() {
    if (!tasks.length) return;

    try {
      const data = tasks.map((task) => ({
        title: task.title,
        status: statusLabel(task.status),
        assignees: (task.assignedTo ?? []).map(userName).join(", "),
        dueDate: task.dueDate ?? "",
      }));
      await excelApi.generateExport(
        token,
        {
          data,
          columns: ["title", "status", "assignees", "dueDate"],
          sheetName: "Reports",
        },
        "reports-export.xlsx",
      );
      setMessage("خروجی اکسل گزارش‌ها دانلود شد.");
      await loadExcelData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "خروجی اکسل ناموفق بود");
    }
  }

  function resetExcelData() {
    setExcelFiles([]);
    setExcelStats(null);
    setExcelUploading(false);
  }

  return {
    deleteExcelFile,
    downloadExcelFile,
    excelFiles,
    excelStats,
    excelUploading,
    exportTasksToExcel,
    handleExcelUpload,
    loadExcelData,
    processExcelFile,
    resetExcelData,
  };
}
