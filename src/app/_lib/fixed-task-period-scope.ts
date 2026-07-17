import type { FixedTask, FixedTaskRecurrence } from "@/lib/api";

export type PeriodScopedFixedTask = FixedTask & {
  _clientPeriodScopes?: FixedTaskRecurrence[];
};

type FixedTaskPeriodRange = { from: string; to: string };

export function filterFixedTasksByRecurrencePeriods(
  tasks: FixedTask[],
  ranges: Record<FixedTaskRecurrence, FixedTaskPeriodRange>,
) {
  return tasks.filter((task) => {
    const recurrence = task.recurrence ?? "daily";
    const startedAt = Date.parse(task.startDate ?? "");
    const range = ranges[recurrence];

    return (
      Number.isFinite(startedAt) &&
      startedAt >= Date.parse(range.from) &&
      startedAt <= Date.parse(range.to)
    );
  });
}

export function withFixedTaskPeriodScope(
  task: FixedTask,
  scope: FixedTaskRecurrence,
): PeriodScopedFixedTask {
  return {
    ...task,
    _clientPeriodScopes: [
      ...new Set([
        ...((task as PeriodScopedFixedTask)._clientPeriodScopes ?? []),
        scope,
      ]),
    ],
  };
}

export function mergeFixedTaskPeriodScopes(
  first: FixedTask,
  second: FixedTask,
): PeriodScopedFixedTask {
  const firstScopes =
    (first as PeriodScopedFixedTask)._clientPeriodScopes ?? [];
  const secondScopes =
    (second as PeriodScopedFixedTask)._clientPeriodScopes ?? [];

  return {
    ...first,
    _clientPeriodScopes: [...new Set([...firstScopes, ...secondScopes])],
  };
}

export function fixedTaskMatchesPeriodScope(
  task: FixedTask,
  period: FixedTaskRecurrence,
) {
  const scopes = (task as PeriodScopedFixedTask)._clientPeriodScopes;
  return scopes?.length
    ? scopes.includes(period)
    : (task.recurrence ?? "daily") === period;
}
