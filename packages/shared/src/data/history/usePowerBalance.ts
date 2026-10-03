/**
 * usePowerBalance — the Overview's power-balance series: grid import at the
 * POI, BESS discharge, compute draw. History from analyst-server seeds the
 * window; live values append every SAMPLE_MS. The story it tells: during a
 * curtailment, grid → ~0, battery rises to meet it, compute draw stays flat.
 */

import { useEffect, useRef, useState } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { usesRealBackend } from "../deployment/deploymentMode";
import { appendPoint, EMPTY_BALANCE, stitchHistory, WINDOW_MS, type BalanceSeries } from "./powerBalance";
import { loadHistory } from "./loadHistory";

// Reason: 2 s is smooth on screen at 450 points/series over 15 min.
const SAMPLE_MS = 2000;

/** Latest live values, W (null = not yet reported). */
export interface LiveBalance {
  gridW: number | null;
  bessW: number | null;
  computeW: number | null;
}


/** Sample the latest live values every SAMPLE_MS into a rolling window. */
export function useLiveSamples(live: LiveBalance): BalanceSeries {
  // Reason: the interval reads through a ref so a value change doesn't
  // restart the timer (and reset the cadence) every render.
  const latest = useRef(live);
  latest.current = live;
  const [series, setSeries] = useState<BalanceSeries>(EMPTY_BALANCE);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const cur = latest.current;
      setSeries((prev) => ({
        grid: appendPoint(prev.grid, { x: now, y: cur.gridW }, WINDOW_MS),
        bess: appendPoint(prev.bess, { x: now, y: cur.bessW }, WINDOW_MS),
        compute: appendPoint(prev.compute, { x: now, y: cur.computeW }, WINDOW_MS),
      }));
    }, SAMPLE_MS);
    return (): void => clearInterval(timer);
  }, []);
  return series;
}

export interface PowerBalance {
  series: BalanceSeries;
  /** True once analyst history seeded the window; false = live since page load. */
  hasHistory: boolean;
}

/**
 * Live samples, seeded with analyst history on real-backend profiles. Mock
 * profiles skip history — the hosted analyst's data wouldn't match the sim.
 */
export function usePowerBalance(live: LiveBalance): PowerBalance {
  const samples = useLiveSamples(live);
  const { view } = useTopologyView();
  const { mode, chatApiUri } = useDeploymentIdentity();
  const [history, setHistory] = useState<{ ok: boolean; series: BalanceSeries }>({
    ok: false,
    series: EMPTY_BALANCE,
  });
  useEffect(() => {
    if (!view || !usesRealBackend(mode)) return;
    let current = true;
    void loadHistory(view, chatApiUri, (url) => fetch(url), Date.now()).then((loaded) => {
      if (current) setHistory(loaded);
    });
    return (): void => {
      current = false;
    };
  }, [view, mode, chatApiUri]);
  return {
    series: {
      grid: stitchHistory(history.series.grid, samples.grid),
      bess: stitchHistory(history.series.bess, samples.bess),
      compute: stitchHistory(history.series.compute, samples.compute),
    },
    hasHistory: history.ok,
  };
}
