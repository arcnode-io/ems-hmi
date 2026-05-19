/**
 * SldCanvasCss — theme-aware CSS scoped to `.sld-svg-root`. Kept in its own
 * file so SldCanvas reads as view glue, not a wall of selectors. The CSS
 * targets the data-* attributes the renderer emits (data-region, data-comp,
 * data-role); inline `style` on individual elements wins where needed.
 */

import React from "react";
import type { Theme } from "../../../../theme/tokens";

interface SldCanvasCssProps {
  theme: Theme;
}

export function SldCanvasCss({ theme: t }: SldCanvasCssProps): React.ReactElement {
  return (
    <style>{`
      .sld-svg-root [data-region="body"] {
        fill: ${t.surface};
        stroke: ${t.border};
        stroke-width: 1.5;
      }
      .sld-svg-root [data-comp="device-node"]:hover [data-region="body"] {
        stroke: ${t.accent};
        stroke-width: 2;
      }
      .sld-svg-root [data-region="label-name"] {
        fill: ${t.text};
        font-weight: 700;
        font-size: 11px;
      }
      .sld-svg-root [data-region="label-template"] {
        fill: ${t.textSoft};
        font-size: 9px;
        font-weight: 500;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .sld-svg-root [data-region="status-indicator"] {
        fill: ${t.statusOk};
        stroke: ${t.surface};
        stroke-width: 1.5;
        r: 5;
      }
      .sld-svg-root [data-comp="bus"] {
        stroke: ${t.textMid};
        stroke-width: 3;
        stroke-linecap: round;
        fill: none;
        opacity: 0.55;
      }
      .sld-svg-root [data-comp="bus"][data-bus-type="ac"] {
        stroke-dasharray: 6 3;
      }
      .sld-svg-root [data-region="hit-area"] { cursor: pointer; }
      .sld-svg-root [data-role="poi"] [data-region="body"] {
        stroke: ${t.accent};
        stroke-width: 2;
      }
      .sld-svg-root [data-role="poi"] [data-region="label-name"] {
        font-size: 9px;
        fill: ${t.textSoft};
        transform: translateY(8px);
      }
      .sld-svg-root [data-role="poi"] [data-region="primary-value"] {
        fill: ${t.text};
        font-weight: 700;
        font-size: 11px;
        transform: translateY(-4px);
      }
      .sld-svg-root [data-role="poi"] [data-region="state-label"] {
        fill: ${t.textSoft};
        font-size: 7px;
        font-weight: 600;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        transform: translateY(2px);
      }
      .sld-svg-root [data-role="poi"] [data-region="state-token"] {
        font-size: 7px;
        font-weight: 700;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        transform: translateY(2px);
      }
      .sld-svg-root [data-role="poi"] [data-region="label-template"] {
        display: none;
      }
      .sld-svg-root [data-role="dlr-badge"] [data-region="body"] {
        stroke: ${t.textSoft};
        stroke-width: 1;
        stroke-dasharray: 3 2;
      }
      .sld-svg-root [data-role="dlr-badge"] [data-region="label-name"] {
        font-size: 9px;
        fill: ${t.textSoft};
      }
      .sld-svg-root [data-role="dlr-badge"] [data-region="label-template"] {
        display: none;
      }
    `}</style>
  );
}
