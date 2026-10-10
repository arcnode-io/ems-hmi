/** Format an ISO timestamp to a coarse "Ns ago" / "Nm ago" / "Nh MMm ago". */
export function relativeAge(isoTs: string): string {
  const then = Date.parse(isoTs);
  if (!Number.isFinite(then)) return "just now";
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMin = Math.round(minutes - hours * 60);
  return `${hours}h ${remMin.toString().padStart(2, "0")}m ago`;
}
