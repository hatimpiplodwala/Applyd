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

/** Insert one row into a list kept in date_applied-descending order. */
export function insertSorted(
  list: Application[],
  app: Application
): Application[] {
  const next = [...list, app];
  next.sort((a, b) => b.date_applied.localeCompare(a.date_applied));
  return next;
}

/** Insert several rows, keeping date_applied-descending order. */
export function insertManySorted(
  list: Application[],
  apps: Application[]
): Application[] {
  if (apps.length === 0) return list;
  const next = [...list, ...apps];
  next.sort((a, b) => b.date_applied.localeCompare(a.date_applied));
  return next;
}
