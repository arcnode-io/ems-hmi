/**
 * One device rendered as an SVG group via react-native-svg primitives.
 * Theme tokens applied inline so the same code works on web + native.
 */

import React from "react";
import { Platform } from "react-native";
import { Circle, G, Rect, Text as SvgText } from "react-native-svg";
import type { SldNode } from "./types";
import type { PoiOverlay, SldTheme } from "./SldRenderer";
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
  RADIUS_MODULE,
  RADIUS_POI,
  STATUS_DOT_INSET_X,
  STATUS_DOT_INSET_Y,
  STATUS_DOT_R,
} from "./renderConstants";

const BODY_STROKE_WIDTH = 1.5;
const POI_STROKE_WIDTH = 2;
const DLR_STROKE_WIDTH = 1;
const DLR_DASH = "3,2";
const LABEL_NAME_FONT = 11;
const LABEL_NAME_FONT_POI = 9;
const LABEL_NAME_FONT_DLR = 9;
const LABEL_TEMPLATE_FONT = 9;
const PRIMARY_VALUE_FONT = 11;
const STATE_ROW_FONT = 7;
const POI_LABEL_OFFSET_Y = 8;
const POI_PRIMARY_OFFSET_Y = -4;
const POI_STATE_OFFSET_Y = 2;

interface NodeBoxProps {
  n: SldNode;
  theme: SldTheme;
  onSelect?: (id: string) => void;
  statusFill: string;
  poiOverlay?: PoiOverlay;
}

function labelTemplateY(template: string): number {
  return template === CDU_TEMPLATE ? LABEL_TEMPLATE_Y_CDU : LABEL_TEMPLATE_Y_DEFAULT;
}

function bodyStroke(role: SldNode["role"], theme: SldTheme): { stroke: string; strokeWidth: number; strokeDasharray?: string } {
  if (role === "poi") return { stroke: theme.accent, strokeWidth: POI_STROKE_WIDTH };
  if (role === "dlr-badge") return { stroke: theme.textSoft, strokeWidth: DLR_STROKE_WIDTH, strokeDasharray: DLR_DASH };
  return { stroke: theme.border, strokeWidth: BODY_STROKE_WIDTH };
}

function PoiLabels({ n, overlay, theme }: { n: SldNode; overlay?: PoiOverlay; theme: SldTheme }): React.ReactElement {
  return (
    <>
      <SvgText
        x={0}
        y={POI_PRIMARY_VALUE_Y + POI_PRIMARY_OFFSET_Y}
        textAnchor="middle"
        fill={theme.text}
        fontSize={PRIMARY_VALUE_FONT}
        fontWeight="700"
        fontFamily={theme.fontLabel}
      >
        {overlay?.settlement ?? ""}
      </SvgText>
      <SvgText
        x={0}
        y={POI_LABEL_Y + POI_LABEL_OFFSET_Y}
        textAnchor="middle"
        fill={theme.textSoft}
        fontSize={LABEL_NAME_FONT_POI}
        fontFamily={theme.fontLabel}
      >
        {n.displayName}
      </SvgText>
      <SvgText
        x={POI_STATE_LABEL_X}
        y={POI_STATE_ROW_Y + POI_STATE_OFFSET_Y}
        textAnchor="middle"
        fill={theme.textSoft}
        fontSize={STATE_ROW_FONT}
        fontWeight="600"
        fontFamily={theme.fontLabel}
      >
        DOE
      </SvgText>
      <SvgText
        x={POI_STATE_TOKEN_X}
        y={POI_STATE_ROW_Y + POI_STATE_OFFSET_Y}
        textAnchor="middle"
        fill={overlay?.stateColor ?? theme.textSoft}
        fontSize={STATE_ROW_FONT}
        fontWeight="700"
        fontFamily={theme.fontLabel}
      >
        {overlay?.stateToken ?? ""}
      </SvgText>
    </>
  );
}

function StandardLabels({ n, theme }: { n: SldNode; theme: SldTheme }): React.ReactElement {
  const isDlr = n.role === "dlr-badge";
  return (
    <>
      <SvgText
        x={0}
        y={LABEL_NAME_Y}
        textAnchor="middle"
        fill={isDlr ? theme.textSoft : theme.text}
        fontSize={isDlr ? LABEL_NAME_FONT_DLR : LABEL_NAME_FONT}
        fontWeight="700"
        fontFamily={theme.fontLabel}
      >
        {n.displayName}
      </SvgText>
      {!isDlr && (
        <SvgText
          x={0}
          y={labelTemplateY(n.template)}
          textAnchor="middle"
          fill={theme.textSoft}
          fontSize={LABEL_TEMPLATE_FONT}
          fontFamily={theme.fontLabel}
        >
          {n.template.toUpperCase()}
        </SvgText>
      )}
    </>
  );
}

export function NodeBox({ n, theme, onSelect, statusFill, poiOverlay }: NodeBoxProps): React.ReactElement {
  const halfW = n.width / 2;
  const halfH = n.height / 2;
  const cornerRadius = n.role === "poi" ? RADIUS_POI : RADIUS_MODULE;
  const handlePress = onSelect ? (): void => onSelect(n.id) : undefined;
  const stroke = bodyStroke(n.role, theme);
  // react-native-svg's `<G onPress>` typings are an unsatisfiable
  // intersection of web + native; pick the platform's event prop directly
  // so the unused name doesn't leak through and warn at runtime.
  const gExtraProps: Record<string, unknown> = handlePress
    ? Platform.OS === "web"
      ? { onClick: handlePress }
      : { onPress: handlePress }
    : {};
  return (
    <G transform={`translate(${n.x} ${n.y})`} {...gExtraProps}>
      <Rect
        x={-halfW}
        y={-halfH}
        width={n.width}
        height={n.height}
        rx={cornerRadius}
        fill={theme.surface}
        stroke={stroke.stroke}
        strokeWidth={stroke.strokeWidth}
        strokeDasharray={stroke.strokeDasharray}
      />
      <Circle
        cx={halfW - STATUS_DOT_INSET_X}
        cy={-halfH + STATUS_DOT_INSET_Y}
        r={STATUS_DOT_R}
        fill={statusFill}
        stroke={theme.surface}
        strokeWidth={BODY_STROKE_WIDTH}
      />
      {n.role === "poi" ? (
        <PoiLabels n={n} overlay={poiOverlay} theme={theme} />
      ) : (
        <StandardLabels n={n} theme={theme} />
      )}
    </G>
  );
}
