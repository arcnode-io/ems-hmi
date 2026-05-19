/**
 * One device rendered as an SVG group. Status fill uses inline `style.fill`
 * because the sld-svg-root CSS would otherwise win against an SVG attr.
 */

import React from "react";
import { match } from "ts-pattern";
import type { SldNode } from "./types";
import type { PoiOverlay } from "./SldRenderer";
import { CDU_TEMPLATE } from "./constants";
import {
  LABEL_NAME_Y,
  LABEL_TEMPLATE_Y_CDU,
  LABEL_TEMPLATE_Y_DEFAULT,
  POI_LABEL_Y,
  POI_PRIMARY_VALUE_Y,
  POI_STATE_LABEL_X,
  POI_STATE_ROW_Y,
  POI_STATE_TOKEN_X,
  POI_TEMPLATE_Y,
  RADIUS_MODULE,
  RADIUS_POI,
  STATUS_DOT_INSET_X,
  STATUS_DOT_INSET_Y,
  STATUS_DOT_R,
} from "./renderConstants";

interface NodeBoxProps {
  n: SldNode;
  onSelect?: (id: string) => void;
  statusFill?: string;
  poiOverlay?: PoiOverlay;
}

function labelTemplateY(template: string): number {
  return template === CDU_TEMPLATE ? LABEL_TEMPLATE_Y_CDU : LABEL_TEMPLATE_Y_DEFAULT;
}

function PoiLabels({ n, overlay }: { n: SldNode; overlay?: PoiOverlay }): React.ReactElement {
  return (
    <>
      <text data-region="primary-value" x={0} y={POI_PRIMARY_VALUE_Y} textAnchor="middle" fill="currentColor">
        {overlay?.settlement ?? ""}
      </text>
      <text data-region="label-name" x={0} y={POI_LABEL_Y} textAnchor="middle" fill="currentColor">
        {n.displayName}
      </text>
      <text data-region="label-template" x={0} y={POI_TEMPLATE_Y} textAnchor="middle" fill="currentColor">
        {n.template}
      </text>
      <text data-region="state-label" x={POI_STATE_LABEL_X} y={POI_STATE_ROW_Y} textAnchor="middle" fill="currentColor">
        DOE
      </text>
      <text
        data-region="state-token"
        x={POI_STATE_TOKEN_X}
        y={POI_STATE_ROW_Y}
        textAnchor="middle"
        fill={overlay?.stateColor ?? "currentColor"}
      >
        {overlay?.stateToken ?? ""}
      </text>
    </>
  );
}

function StandardLabels({ n }: { n: SldNode }): React.ReactElement {
  return (
    <>
      <text data-region="label-name" x={0} y={LABEL_NAME_Y} textAnchor="middle" fill="currentColor">
        {n.displayName}
      </text>
      <text data-region="label-template" x={0} y={labelTemplateY(n.template)} textAnchor="middle" fill="currentColor">
        {n.template}
      </text>
    </>
  );
}

export function NodeBox({ n, onSelect, statusFill, poiOverlay }: NodeBoxProps): React.ReactElement {
  const halfW = n.width / 2;
  const halfH = n.height / 2;
  const cornerRadius = n.role === "poi" ? RADIUS_POI : RADIUS_MODULE;
  const handleClick = onSelect ? () => onSelect(n.id) : undefined;
  const indicatorStyle = match(statusFill)
    .with(undefined, () => undefined)
    .otherwise((fill) => ({ fill }) as React.CSSProperties);
  return (
    <g
      id={n.id}
      data-comp="device-node"
      data-template={n.template}
      {...(n.role ? { "data-role": n.role } : {})}
      transform={`translate(${n.x} ${n.y})`}
      onClick={handleClick}
    >
      <rect data-region="body" x={-halfW} y={-halfH} width={n.width} height={n.height} rx={cornerRadius} fill="currentColor" />
      <circle
        data-region="status-indicator"
        cx={halfW - STATUS_DOT_INSET_X}
        cy={-halfH + STATUS_DOT_INSET_Y}
        r={STATUS_DOT_R}
        {...(indicatorStyle ? { style: indicatorStyle } : {})}
      />
      {n.role === "poi" ? <PoiLabels n={n} overlay={poiOverlay} /> : <StandardLabels n={n} />}
      <rect data-region="hit-area" x={-halfW} y={-halfH} width={n.width} height={n.height} fill="transparent" />
    </g>
  );
}
