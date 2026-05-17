/**
 * Client-side Zod schema for the /topology/view payload. Mirrors the
 * projection shape emitted by `ems-device-api` per system_adr §22.
 *
 * Kept minimal — validates the top-level structure HMI relies on. The
 * server is the authoritative validator at write-time (`POST /topology`);
 * this schema fails fast on schema drift between repos.
 */

import { z } from "zod";

const Bounds = z.object({
  min: z.number(),
  max: z.number(),
  nominal: z.number(),
});

const Thresholds = z.object({
  warn_min: z.number(),
  warn_max: z.number(),
  alarm_min: z.number(),
  alarm_max: z.number(),
});

const MeasurementView = z.object({
  unit: z.string(),
  type: z.enum(["float", "bool", "enum"]),
  poll_rate_hz: z.number().nullable(),
  display_name_default: z.string().nullable(),
  iec_61850_ref: z.string(),
  bounds: Bounds.nullable(),
  thresholds: Thresholds.nullable(),
  values: z.record(z.string(), z.string()).nullable(),
});

const CommandView = z.object({
  verb: z.string(),
  target: z.string(),
  unit: z.string(),
  payload: z.enum(["float", "bool", "enum", "trigger"]),
  display_name_default: z.string().nullable(),
});

const TemplateView = z.object({
  template: z.string(),
  kind: z.enum(["leaf", "module"]),
  equipment_id: z.string().nullable(),
  vendor: z.string().nullable(),
  model: z.string().nullable(),
  description: z.string(),
  measurements: z.record(z.string(), MeasurementView),
  commands: z.record(z.string(), CommandView),
});

const DeviceView = z.object({
  device_id: z.string(),
  template: z.string(),
  parent: z.string().nullable(),
  display_name: z.string().nullable(),
  blocking: z.array(z.string()),
  extra_measurements: z.record(z.string(), MeasurementView).nullable(),
});

const BusMember = z.object({
  device_id: z.string(),
  port: z.string().nullable(),
});

const Bus = z.object({
  bus_id: z.string(),
  type: z.enum(["dc", "ac"]),
  members: z.array(BusMember),
});

const SizingParams = z.object({
  P_compute_total_kW: z.number(),
  E_BESS_total_kWh: z.number(),
  T_coolant_setpoint_C: z.number(),
});

export const TopologyView = z.object({
  deployment_uuid: z.string(),
  ems_mode: z.enum(["sim", "live"]),
  sizing_ref: z.string().nullable(),
  sizing_params: SizingParams,
  devices: z.record(z.string(), DeviceView),
  buses: z.array(Bus),
  templates_used: z.record(z.string(), TemplateView),
});

export type TopologyViewType = z.infer<typeof TopologyView>;
export type DeviceViewType = z.infer<typeof DeviceView>;
export type TemplateViewType = z.infer<typeof TemplateView>;
export type MeasurementViewType = z.infer<typeof MeasurementView>;
export type CommandViewType = z.infer<typeof CommandView>;
export type BusType = z.infer<typeof Bus>;
