/**
 * Sovereign login backdrop — phosphor landscape on deep black, slow starfield,
 * the horizon as the heartbeat line. Ports IllustrationSovereign.
 */

import React, { useMemo } from "react";
import { Svg, LinearGradient, RadialGradient, Stop, Rect, Line, Path, Ellipse, G } from "react-native-svg";
import type { Theme } from "../../../theme/tokens";
import {
  BACKDROP_W as W,
  BACKDROP_H as H,
  HORIZON_Y as HZ,
  Defs,
  makeRng,
  Twinkle,
  PulseTrain,
  PulseWake,
} from "./backdropShared";

const PHOSPHOR_BARS = [120, 248, 412, 540, 688] as const;

const MASSINGS = [
  {
    d: `M 0 ${HZ} L 0 ${HZ - 18} Q 90 ${HZ - 62} 180 ${HZ - 24} Q 240 ${HZ - 8} 310 ${HZ - 30} Q 380 ${HZ - 52} 460 ${HZ - 18} L 460 ${HZ} Z`,
    opacity: 0.18,
  },
  {
    d: `M 280 ${HZ} L 280 ${HZ - 12} Q 420 ${HZ - 44} 560 ${HZ - 22} Q 660 ${HZ - 6} 800 ${HZ - 16} L 800 ${HZ} Z`,
    opacity: 0.12,
  },
] as const;

export function BackdropSovereign({ theme }: { theme: Theme }): React.ReactElement {
  const accent = theme.accent;
  const ink = theme.text;
  const stars = useMemo(() => {
    const rng = makeRng(11);
    return Array.from({ length: 60 }, () => ({
      x: rng() * W,
      y: rng() * (HZ - 30),
      r: 0.4 + rng() * 0.9,
      twinkle: 2 + rng() * 5,
      phase: rng() * 6,
    }));
  }, []);

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sov-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#020202" />
          <Stop offset="0.75" stopColor="#070809" />
          <Stop offset="1" stopColor="#0a0e12" />
        </LinearGradient>
        <LinearGradient id="sov-ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#08090b" />
          <Stop offset="1" stopColor="#020202" />
        </LinearGradient>
        <RadialGradient id="sov-pulse" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={accent} stopOpacity="0.9" />
          <Stop offset="0.4" stopColor={accent} stopOpacity="0.35" />
          <Stop offset="1" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect x="0" y="0" width={W} height={HZ} fill="url(#sov-sky)" />
      <Rect x="0" y={HZ} width={W} height={H - HZ} fill="url(#sov-ground)" />

      {stars.map((s, i) => (
        <Twinkle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={ink}
          dur={`${s.twinkle}s`}
          begin={`-${s.phase}s`}
        />
      ))}

      {MASSINGS.map((m, i) => (
        <Path key={i} d={m.d} fill={accent} opacity={m.opacity} />
      ))}

      <G opacity="0.16">
        {PHOSPHOR_BARS.map((x, i) => (
          <Line
            key={i}
            x1={x}
            y1={HZ - 4}
            x2={x}
            y2={HZ - 6 - (i % 2 ? 14 : 22)}
            stroke={accent}
            strokeWidth="0.7"
          />
        ))}
      </G>

      <Line x1="0" y1={HZ} x2={W} y2={HZ} stroke={theme.borderSoft} strokeWidth="1" />
      <Line x1="0" y1={HZ} x2={W} y2={HZ} stroke={accent} strokeWidth="1.2" opacity="0.35" />

      {Array.from({ length: 9 }).map((_, i) => {
        const x = (W / 8) * i;
        return (
          <Line key={i} x1={x} y1={HZ} x2={x} y2={HZ + 4} stroke={theme.borderSoft} strokeWidth="0.8" />
        );
      })}

      <PulseTrain
        dots={[
          { r: 60, fill: "url(#sov-pulse)" },
          { r: 14, fill: accent, opacity: 0.55 },
          { r: 4, fill: "#dce8f5" },
        ]}
      />
      <PulseWake stroke={accent} strokeWidth={1.2} dasharray="2 90" from="92" opacity={0.7} />

      <Ellipse cx={W / 2} cy={HZ + 90} rx={W * 0.6} ry="32" fill={accent} opacity="0.06" />
    </Svg>
  );
}
