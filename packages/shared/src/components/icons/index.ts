/**
 * Icon barrel. Mirrors design-handoff/03-screens/icons.jsx.
 *
 * Three families:
 *  - Alarm severity (filled, NOT stroked): IconWarning, IconAlarm, IconFire
 *  - Module type: IconBess, IconCompute, IconThermal, IconGrid
 *  - Nav + misc: IconOverview, IconModules, IconEnergy, IconAnalyst,
 *    IconBell, IconChevron, IconArrow, IconWrench, IconPadlock, IconCheck,
 *    IconBolt
 *
 * Common base for stroke icons: `StrokeIcon` (1.75px round-cap, 24×24 viewBox).
 * Filled icons emit their own `<Svg>` directly so they can paint colored fills.
 */

export { StrokeIcon } from "./StrokeIcon";

// Alarm severity
export { IconWarning } from "./IconWarning";
export { IconAlarm } from "./IconAlarm";
export { IconFire } from "./IconFire";

// Module type
export { IconBess } from "./IconBess";
export { IconCompute } from "./IconCompute";
export { IconThermal } from "./IconThermal";
export { IconGrid } from "./IconGrid";

// Nav
export { IconOverview } from "./IconOverview";
export { IconModules } from "./IconModules";
export { IconEnergy } from "./IconEnergy";
export { IconAnalyst } from "./IconAnalyst";

// Misc
export { IconBell } from "./IconBell";
export { IconChevron } from "./IconChevron";
export { IconArrow } from "./IconArrow";
export { IconWrench } from "./IconWrench";
export { IconPadlock } from "./IconPadlock";
export { IconCheck } from "./IconCheck";
export { IconBolt } from "./IconBolt";
