/** MQTT topic-filter matching (`+` one level, `#` the rest) for client-side fan-out. */

/** True if the filter holds a wildcard, i.e. can't be matched by string equality. */
export function isWildcard(filter: string): boolean {
  return filter.includes("+") || filter.includes("#");
}

/**
 * MQTT 3.1.1 §4.7 matching. `#` is last-level only and also matches the
 * parent (`a/#` matches `a`).
 * @example topicMatches("sites/+/devices/n1/measurements/#", "sites/s1/devices/n1/measurements/p/watts") // true
 */
export function topicMatches(filter: string, topic: string): boolean {
  const fLevels = filter.split("/");
  const tLevels = topic.split("/");
  for (let idx = 0; idx < fLevels.length; idx += 1) {
    const level = fLevels[idx];
    if (level === "#") return true;
    if (idx >= tLevels.length) return false;
    if (level !== "+" && level !== tLevels[idx]) return false;
  }
  return fLevels.length === tLevels.length;
}

/**
 * The browser subscribes only to what it renders (Joe, 2026-10-06). Allowed:
 * concrete topics, and a `+` in the device position of a fully named
 * measurement — `sites/{site}/devices/+/measurements/{name}/{unit}`, i.e.
 * "this one measurement across every device". Anything broader (`#`, `+` on
 * site / name / unit) pulls traffic the page never uses: a site-wide `#` was
 * ~3.5k msgs/s and 76% of the main thread on ems.arcnode.io.
 * @throws Error naming the filter, before it reaches the broker
 */
export function assertSubscribable(filter: string): void {
  if (!isWildcard(filter)) return;
  const levels = filter.split("/");
  const deviceLevelOnly =
    levels.length === 7 &&
    levels[0] === "sites" &&
    levels[2] === "devices" &&
    levels[3] === "+" &&
    levels[4] === "measurements" &&
    [levels[1], levels[5], levels[6]].every((level) => level !== "+" && level !== "#");
  if (!deviceLevelOnly) {
    throw new Error(
      `MQTT filter "${filter}" is too broad — only a device-level + on a named measurement is allowed (no wildcard-everything subscriptions)`,
    );
  }
}
