/**
 * Shared layout constants. Y bands stack the canonical SLD grammar top→down;
 * sizing constants live alongside so region helpers don't sprinkle magic
 * numbers.
 */

/** Y-coordinate of the row centers, top→bottom. */
export const Y_UTILITY = 50;
export const Y_POI = 130;
export const Y_BREAKER = 195;
export const Y_AC_BUS = 240;
export const Y_AC_MODULE = 305;
export const Y_AC_CHILD = 380;
export const Y_INVERTER = 360;
export const Y_DC_BUS = 410;
export const Y_DC_MODULE = 452;

/** Outermost viewBox constraints. Width grows with device count. */
export const MIN_WIDTH = 720;
export const HEIGHT = 480;
export const COLUMN_PITCH = 180;
export const MIN_COLS = 3;

/** Node body dimensions per template/role. */
export const NODE_W_MODULE = 124;
export const NODE_W_COMPUTE = 156;
export const NODE_W_LEAF = 130;
export const NODE_W_DLR = 110;
export const NODE_W_POI = 144;
export const NODE_W_CHILD = 96;
export const NODE_H = 44;
export const NODE_H_POI = 52;
export const NODE_H_CHILD = 36;

/** Padding constants used by region helpers. */
export const BUS_OVERSHOOT_PX = 50;
export const RING_RADIUS_BREAKER = 7;
export const RING_RADIUS_INVERTER = 9;
export const DC_RIGHT_MARGIN = 80;
export const DC_LEFT_OFFSET_FROM_GRID = COLUMN_PITCH * 0.5;
export const UTILITY_HALF_SPAN_PER_COL = 60;

/** Template-based classification. */
export const UTILITY_TEMPLATES = new Set(["operating_envelope", "line_rating"]);
export const POI_TEMPLATE = "revenue_meter";
export const GRID_MODULE_TEMPLATE = "grid_module";
export const COMPUTE_MODULE_TEMPLATE = "compute_module";
export const CDU_TEMPLATE = "cdu";
