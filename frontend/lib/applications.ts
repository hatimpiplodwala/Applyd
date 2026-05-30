import { STATUSES, type Application, type Status } from "@/lib/types";

function emptyStatusRecord<T>(value: () => T): Record<Status, T> {
  return Object.fromEntries(STATUSES.map((s) => [s, value()])) as Record<
    Status,
    T
  >;
}

/** Tally applications by status, with every status present (zeroed). */
export function countByStatus(applications: Application[]): Record<Status, number> {
  const counts = emptyStatusRecord(() => 0);
  for (const app of applications) counts[app.status]++;
  return counts;
}

/** Bucket applications into per-status arrays, with every status present. */
export function groupByStatus(
  applications: Application[]
): Record<Status, Application[]> {
  const groups = emptyStatusRecord<Application[]>(() => []);
  for (const app of applications) groups[app.status].push(app);
  return groups;
}
