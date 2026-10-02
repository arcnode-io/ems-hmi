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
