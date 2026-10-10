/**
 * Absolute event time, "Oct 10, 18:39:02", 24 h clock in the viewer's zone.
 * @param timeZone IANA zone override (tests); defaults to the viewer's
 */
export function eventTime(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone });
  return `${day}, ${time}`;
}
