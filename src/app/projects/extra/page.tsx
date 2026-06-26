"use client";

import { useSessionContext } from "../../_components/taskino-context";

export default function ExtraProjectsPage() {
  const { isManager } = useSessionContext();

  if (!isManager) return null;

  return <section className="min-h-[50vh]" aria-label="پروژه مازاد" />;
}
