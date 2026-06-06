/**
 * Solarpunk login backdrop — hand-pencil sketch on warm cream paper, low sun,
 * distant abstract massings, the horizon pulses. Ports IllustrationSolarpunk.
 */

import React, { useMemo } from "react";
import { Svg, LinearGradient, RadialGradient, Stop, Pattern, Rect, Circle, Line, Path, G } from "react-native-svg";
import type { Theme } from "../../../theme/tokens";
import {
  BACKDROP_W as W,
  BACKDROP_H as H,
  HORIZON_Y as HZ,
  Defs,
  makeRng,
  PulseTrain,
  PulseWake,
} from "./backdropShared";

const INK = "#3a3024"; // pencil graphite over cream
const INK_SOFT = "#6b5f4a";
const SUN_X = W * 0.72;
const SUN_Y = HZ - 70;
const MASTS = [88, 156, 232, 300, 396, 472, 548, 632, 716] as const;

function mastTop(i: number): number {
  const rise = i % 3 === 0 ? 22 : i % 3 === 1 ? 14 : 8;
  return HZ - 12 - rise;
}

export function BackdropSolarpunk({ theme }: { theme: Theme }): React.ReactElement {
  const accent = theme.accent;
  const hatches = useMemo(() => {
    const rng = makeRng(23);
    return Array.from({ length: 90 }, () => {
      const x = rng() * W;
      const y = rng() * HZ;
      const len = 4 + rng() * 8;
      const ang = (rng() - 0.5) * 0.6;
      return { x1: x, y1: y, x2: x + len * Math.cos(ang), y2: y + len * Math.sin(ang), op: 0.05 + rng() * 0.12 };
    });
  }, []);
  const specks = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const rng = makeRng(101 + i);
        return { x: rng() * W, y: HZ + 8 + rng() * (H - HZ - 16) };
      }),
    [],
  );

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="solr-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#efe6d3" />
          <Stop offset="0.55" stopColor="#e7dcc4" />
          <Stop offset="1" stopColor="#dcc9a4" />
        </LinearGradient>
        <LinearGradient id="solr-ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d8c8a2" />
          <Stop offset="1" stopColor="#c2af86" />
        </LinearGradient>
        <RadialGradient id="solr-sun" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#f3b85a" stopOpacity="0.6" />
          <Stop offset="0.5" stopColor="#e89a3a" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#e89a3a" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="solr-pulse" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={accent} stopOpacity="0.55" />
          <Stop offset="0.5" stopColor={accent} stopOpacity="0.2" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
        <Pattern id="solr-grain" patternUnits="userSpaceOnUse" width="3" height="3">
          <Rect width="3" height="3" fill="transparent" />
          <Circle cx="1.5" cy="1.5" r="0.4" fill="#a8946a" opacity="0.05" />
        </Pattern>
      </Defs>

      <Rect x="0" y="0" width={W} height={HZ} fill="url(#solr-sky)" />
      <Rect x="0" y={HZ} width={W} height={H - HZ} fill="url(#solr-ground)" />
      <Rect x="0" y="0" width={W} height={H} fill="url(#solr-grain)" />

      <Circle cx={SUN_X} cy={SUN_Y} r="180" fill="url(#solr-sun)" />
      <Circle cx={SUN_X} cy={SUN_Y} r="30" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.55" />
      <Circle cx={SUN_X} cy={SUN_Y} r="22" fill="none" stroke={INK} strokeWidth="0.6" opacity="0.35" />

      <Path
        d={`M 0 ${HZ} L 0 ${HZ - 26} Q 80 ${HZ - 56} 170 ${HZ - 36} Q 250 ${HZ - 22} 320 ${HZ - 38} Q 380 ${HZ - 48} 450 ${HZ - 30} Q 530 ${HZ - 16} 620 ${HZ - 32} Q 720 ${HZ - 44} 800 ${HZ - 28} L 800 ${HZ} Z`}
        fill={INK}
        opacity="0.16"
      />
      <Path
        d={`M 100 ${HZ} L 100 ${HZ - 14} Q 220 ${HZ - 34} 360 ${HZ - 18} Q 460 ${HZ - 8} 560 ${HZ - 20} Q 660 ${HZ - 28} 800 ${HZ - 14} L 800 ${HZ} Z`}
        fill={INK}
        opacity="0.10"
      />

      <G opacity="0.32" stroke={INK} strokeWidth="0.8">
        {MASTS.map((x, i) => (
          <Line key={i} x1={x} y1={HZ - 4} x2={x} y2={mastTop(i)} />
        ))}
      </G>

      {hatches.map((h, i) => (
        <Line key={i} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={INK_SOFT} strokeWidth="0.5" opacity={h.op} />
      ))}

      <Path
        d={`M 0 ${HZ} Q ${W * 0.25} ${HZ - 0.6} ${W * 0.5} ${HZ + 0.4} T ${W} ${HZ}`}
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        opacity="0.75"
        strokeLinecap="round"
      />

      {Array.from({ length: 9 }).map((_, i) => {
        const x = (W / 8) * i;
        return <Line key={i} x1={x} y1={HZ + 1} x2={x} y2={HZ + 5} stroke={INK} strokeWidth="0.7" opacity="0.45" />;
      })}

      <PulseTrain
        dots={[
          { r: 56, fill: "url(#solr-pulse)" },
          { r: 11, fill: accent, opacity: 0.5 },
          { r: 3.5, fill: INK },
        ]}
      />
      <PulseWake stroke={accent} strokeWidth={1} dasharray="2 70" from="72" opacity={0.55} />

      <G opacity="0.4">
        {specks.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r="0.6" fill={INK} />
        ))}
      </G>
    </Svg>
  );
}
