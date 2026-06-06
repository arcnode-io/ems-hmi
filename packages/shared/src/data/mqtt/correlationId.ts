/**
 * correlationId — a UUIDv4 for dispatch command_id. Prefers crypto.randomUUID
 * (browser + Hermes ≥0.74); falls back to a Math.random v4 (correlation only,
 * not a security token).
 */

export function correlationId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
