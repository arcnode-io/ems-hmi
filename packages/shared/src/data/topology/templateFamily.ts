/**
 * Template families. edp-api names a variant `<family>_<variant>`
 * (gpu_node_h100, compute_module_h100, bess_module_dc) — the naming rule is
 * the contract (Joe, 2026-10-17). Match families with this, never `===` on a
 * template name: exact matches silently dropped every H100 site's GPUs.
 */

import type { TopologyViewType } from "./topology.schema";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

/** @example inFamily("gpu_node_h100", "gpu_node") // true */
export function inFamily(template: string, family: string): boolean {
  return template === family || template.startsWith(`${family}_`);
}

/**
 * Topics for the named measurements on every device of a template family
 * (variants included), skipping any measurement a template lacks.
 * @example familyTopics(view, "s", "compute_module", ["total_power"]) // c1 + c1_h100 topics
 */
export function familyTopics(
  view: Pick<TopologyViewType, "devices" | "templates_used"> | null,
  siteId: string,
  family: string,
  measurementNames: readonly string[],
): string[] {
  if (!view) return [];
  return Object.entries(view.devices).flatMap(([deviceId, device]) => {
    const tpl = inFamily(device.template, family) ? view.templates_used[device.template] : undefined;
    if (!tpl) return [];
    return measurementNames.flatMap((name) => {
      const m = tpl.measurements[name];
      return m ? [measurementTopic(siteId, deviceId, name, m.unit as TopicUnit)] : [];
    });
  });
}
