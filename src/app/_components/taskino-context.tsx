"use client";

import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

import {
  useTaskinoController,
  type TaskinoController,
} from "./use-taskino-controller";

const TaskinoContext = createContext<TaskinoController | null>(null);

export function TaskinoProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TaskinoController;
}) {
  return (
    <TaskinoContext.Provider value={value}>
      {children}
    </TaskinoContext.Provider>
  );
}

export function useTaskinoPageContext() {
  const context = useContext(TaskinoContext);

  if (!context) {
    throw new Error("useTaskinoPageContext must be used inside TaskinoProvider");
  }

  return context;
}

export function useTaskinoProviderValue(initialView?: Parameters<typeof useTaskinoController>[0]) {
  return useTaskinoController(initialView);
}
