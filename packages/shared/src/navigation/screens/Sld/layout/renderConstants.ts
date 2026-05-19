/**
 * Renderer-only numeric constants. Kept in their own file so visual nits
 * (corner radii, indicator offsets, glyph positions) live next to the
 * subcomponents that consume them.
 */

/** Common opacity/stroke values across conductors + particles. */
export const PARTICLE_OPACITY = 0.75;
export const BUS_OPACITY = 1;
export const DROP_OPACITY = 0.7;
export const INFO_OPACITY = 0.5;

/** Conductor stroke widths by kind. */
export const STROKE_INFO = 1;
export const STROKE_DROP = 1.5;
export const STROKE_BUS = 2;

/** Breaker + inverter glyph dimensions. */
export const RING_R_BREAKER = 7;
export const RING_R_INVERTER = 9;
export const BREAKER_BAR_HALF = 4;
export const BREAKER_OPEN_LIFT = 5;
export const INVERTER_GLYPH_FONT_PX = 11;
export const INVERTER_GLYPH_BASELINE_Y = 3;

/** Node body corner radius. */
export const RADIUS_POI = 4;
export const RADIUS_MODULE = 3;

/** Status-indicator dot placement inside the body, measured from top-right. */
export const STATUS_DOT_INSET_X = 7;
export const STATUS_DOT_INSET_Y = 8;
export const STATUS_DOT_R = 3;

/** POI text-slot offsets. */
export const POI_PRIMARY_VALUE_Y = -2;
export const POI_LABEL_Y = 0;
export const POI_TEMPLATE_Y = 14;
export const POI_STATE_ROW_Y = 16;
export const POI_STATE_LABEL_X = -22;
export const POI_STATE_TOKEN_X = 22;

/** Non-POI text-slot offsets. */
export const LABEL_NAME_Y = -2;
export const LABEL_TEMPLATE_Y_DEFAULT = 12;
export const LABEL_TEMPLATE_Y_CDU = 10;

/** Dasharrays. */
export const DASH_INFO = "2 2";
