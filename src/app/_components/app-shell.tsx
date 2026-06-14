"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TaskinoApp } from "./taskino-app";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_PATHS.has(pathname)) return children;

  return <TaskinoApp>{children}</TaskinoApp>;
}
