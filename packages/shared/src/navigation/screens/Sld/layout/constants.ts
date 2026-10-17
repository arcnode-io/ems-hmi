/**
 * Shared layout constants. Y bands stack the SLD top→down: POI, site MV
 * bus, its branches (switchgear / battery pad), then per grid container
 * the feeder bus (relay hangs off it), transformer, LV board, LV bus and
 * the compute modules it feeds.
 */

/** Y-coordinate of the row centers, top→bottom. */
export const Y_POI = 50;
export const Y_BREAKER = 115;
export const Y_SITE_BUS = 160;
export const Y_BRANCH = 215;
export const Y_CHILD = 300;
export const Y_FEEDER_BUS = 265;
export const Y_XFMR = 310;
export const Y_BOARD = 375;
export const Y_LV_BUS = 430;
export const Y_LOAD = 485;

/** Outermost viewBox constraints. Width grows with column count. */
export const MIN_WIDTH = 720;
export const HEIGHT = 540;
export const COLUMN_PITCH = 180;

/** Node body dimensions. */
export const NODE_W_MODULE = 124;
export const NODE_W_COMPUTE = 156;
export const NODE_W_POI = 144;
export const NODE_W_CHILD = 96;
export const NODE_H = 44;
export const NODE_H_POI = 52;
export const NODE_H_CHILD = 36;

/** Padding constants used by region helpers. */
export const BUS_OVERSHOOT_PX = 50;
export const RING_RADIUS_BREAKER = 7;
/** Transformer glyph: two stacked rings, top-to-bottom extent ±this. */
export const XFMR_HALF_H = 15;
/** Relay sits this far right of its feeder; clears a neighbour column's child node. */
export const TAP_OFFSET_PX = 78;

/** Template classification (edp-api DTM vocabulary). */
export const POI_TEMPLATE = "poi_meter";
export const SWITCHGEAR_TEMPLATE = "switchgear";
export const TRANSFORMER_TEMPLATE = "transformer";
export const LV_BOARD_TEMPLATE = "lv_switchboard";
