/**
 * Shared layout constants. Y bands stack the SLD top→down: POI, site MV
 * bus, its branches (switchgear / battery pad), then per grid container
 * the transformer, LV board, LV bus and the compute modules it feeds.
 */

/** Y-coordinate of the row centers, top→bottom. */
export const Y_POI = 50;
export const Y_BREAKER = 115;
export const Y_SITE_BUS = 160;
export const Y_BRANCH = 215;
export const Y_XFMR = 285;
export const Y_CHILD = 300;
export const Y_BOARD = 355;
export const Y_LV_BUS = 410;
export const Y_LOAD = 465;

/** Outermost viewBox constraints. Width grows with column count. */
export const MIN_WIDTH = 720;
export const HEIGHT = 520;
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

/** Template / bus-id classification (edp-api DTM vocabulary). */
export const POI_TEMPLATE = "poi_meter";
export const SWITCHGEAR_TEMPLATE = "switchgear";
export const TRANSFORMER_TEMPLATE = "transformer";
export const LV_BOARD_TEMPLATE = "lv_switchboard";
/** edp-api names the MV bus tying grid containers + battery `site_mv_N`. */
export const SITE_BUS_PREFIX = "site_mv_";
