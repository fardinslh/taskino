"use client";

import { excelApi, getId, type Task, type User } from "@/lib/api";
import { isUnassignedTask } from "../_lib/task-helpers";
import { TaskPanel } from "./task-panel";

type SelectedTaskPanelProps = {
  canEdit: boolean;
  canClaim: boolean;
  onClaim: (taskId: string) => void;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onError: (message: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onUpdate: (taskId: string, body: Record<string, unknown>) => void;
  task: Task;
  token: string;
  users: User[];
};

export function SelectedTaskPanel({
  canEdit,
  canClaim,
  onClaim,
  onClose,
  onDelete,
  onError,
  onStatusChange,
  onUpdate,
  task,
  token,
  users,
}: SelectedTaskPanelProps) {
  const taskId = getId(task);

  return (
    <TaskPanel
      task={task}
      users={users}
      canEditAssignments={canEdit}
      canComment={canEdit}
      canClaim={canClaim && isUnassignedTask(task)}
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
      onClaim={() => onClaim(taskId)}
      onStatusChange={(status) => onStatusChange(taskId, status)}
      onAssign={(userId) => onUpdate(taskId, { assignedTo: [userId] })}
      onDelete={() => onDelete(taskId)}
      onClose={onClose}
    />
  );
}
