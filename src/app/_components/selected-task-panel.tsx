"use client";

import { excelApi, getId, type Task, type User } from "@/lib/api";
import { isUnassignedTask } from "../_lib/task-helpers";
import { TaskPanel } from "./task-panel";
import { useNavigationContext } from "./taskino-context";

type SelectedTaskPanelProps = {
  canEdit: boolean;
  canClaim: boolean;
  canDownloadCompletionFile: boolean;
  canRate?: boolean;
  onClaim: (taskId: string) => void;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onError: (message: string) => void;
  onUpdate: (taskId: string, body: Record<string, unknown>) => void;
  onUploadCompletionFile?: (taskId: string, file: File) => void;
  onRate?: (taskId: string, score: number, ratingComment?: string) => Promise<void>;
  task: Task;
  token: string;
  users: User[];
  inline?: boolean;
  currentUser?: User | null;
};

export function SelectedTaskPanel({
  canEdit,
  canClaim,
  canDownloadCompletionFile,
  canRate = false,
  onClaim,
  onClose,
  onDelete,
  onError,
  onUpdate,
  onUploadCompletionFile,
  onRate,
  task,
  token,
  users,
  inline = false,
  currentUser,
}: SelectedTaskPanelProps) {
  const taskId = getId(task);

  return (
    <TaskPanel
      inline={inline}
      task={task}
      users={users}
      currentUser={currentUser}
      canEditAssignments={canEdit}
      canComment={canEdit}
      canClaim={canClaim && isUnassignedTask(task)}
      canDownloadCompletionFile={canDownloadCompletionFile}
      canUploadCompletionFile={!!onUploadCompletionFile}
      canRate={canRate}
      onRate={onRate}
      onDownloadExcel={() => {
        const excel = task.excelFile;
        const excelId = typeof excel === "string" ? excel : getId(excel);
        if (!excelId) return;
        const filename = (typeof excel === "object" ? (excel.originalName || excel.fileName) : undefined) || task.file || "file.xlsx";
        void excelApi.download(token, excelId, filename).catch((error) => {
          onError(error instanceof Error ? error.message : "دانلود ناموفق بود");
        });
      }}
      onCommentChange={(comment) => onUpdate(taskId, { taskComment: comment })}
      onDownloadCompletionFile={() => {
        const completionFile = task.completionExcelFile ?? task.completionFile;
        const completionFileId =
          typeof completionFile === "string"
            ? completionFile
            : completionFile
              ? getId(completionFile)
              : "";
        if (!completionFileId) return;
        const filename =
          (completionFile && typeof completionFile === "object"
            ? completionFile.originalName || completionFile.fileName
            : undefined) || "completion-file";
        void excelApi
          .download(token, completionFileId, filename)
          .catch((error) => {
            onError(
              error instanceof Error ? error.message : "دانلود فایل ناموفق بود",
            );
          });
      }}
      onClaim={() => onClaim(taskId)}
      onUploadCompletionFile={(file) => onUploadCompletionFile?.(taskId, file)}
      onAssign={(userId) => onUpdate(taskId, { assignedTo: [userId] })}
      onDelete={() => onDelete(taskId)}
      onClose={onClose}
    />
  );
}
