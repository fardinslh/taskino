import type { FixedTask, FixedTaskRecurrence } from "@/lib/api";

export type PeriodScopedFixedTask = FixedTask & {
  _clientPeriodScopes?: FixedTaskRecurrence[];
};

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
