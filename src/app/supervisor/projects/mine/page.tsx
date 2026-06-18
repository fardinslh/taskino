"use client";

import { useNavigationContext, useSessionContext, useTaskContext } from "../../../_components/taskino-context";
import { ProjectBoardSection } from "../../../_components/project-board-section";

export default function SupervisorMyProjectsPage() {
  return <SupervisorMyProjectsPageContent />;
}

function SupervisorMyProjectsPageContent() {
  const { activeView, setSelectedTask, setTaskQuery, taskQuery } =
    useNavigationContext();
  const { isSupervisor } = useSessionContext();
  const { claimTask, moveTask, specialistTaskCounts, tasks } = useTaskContext();

  const totalCount = specialistTaskCounts?.total ?? 0;
  const todoCount =
    specialistTaskCounts?.todo ?? specialistTaskCounts?.pending ?? 0;
  const inProgressCount =
    specialistTaskCounts?.inProgress ?? specialistTaskCounts?.in_progress ?? 0;
  const openCount = todoCount + inProgressCount;
  const doneCount =
    specialistTaskCounts?.done ?? specialistTaskCounts?.completed ?? 0;
  const progress = totalCount
    ? Math.round((doneCount / totalCount) * 100)
    : 0;

  if (!isSupervisor || activeView !== "supervisor-my-projects") return null;

  return (
    <ProjectBoardSection
      doneCount={doneCount}
      inProgressCount={inProgressCount}
      onClaimTask={claimTask}
      onMoveTask={moveTask}
      onSearchChange={setTaskQuery}
      onSelectTask={setSelectedTask}
      openCount={openCount}
      progress={progress}
      taskQuery={taskQuery}
      tasks={tasks}
      totalCount={totalCount}
    />
  );
}
