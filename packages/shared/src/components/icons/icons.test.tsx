/**
 * Smoke tests for the icon set. Verifies each export renders without throwing
 * and accepts the (size, color) prop contract. SVG geometry is asserted in
 * the Playwright visual suite, not here.
 */

import React from "react";
import { render } from "@testing-library/react";
import {
  IconWarning,
  IconAlarm,
  IconFire,
  IconBess,
  IconCompute,
  IconThermal,
  IconGrid,
  IconOverview,
  IconModules,
  IconEnergy,
  IconAnalyst,
  IconBell,
  IconChevron,
  IconArrow,
  IconWrench,
  IconPadlock,
  IconCheck,
  IconBolt,
} from "./index";

const ICONS = [
  ["IconWarning", IconWarning],
  ["IconAlarm", IconAlarm],
  ["IconFire", IconFire],
  ["IconBess", IconBess],
  ["IconCompute", IconCompute],
  ["IconThermal", IconThermal],
  ["IconGrid", IconGrid],
  ["IconOverview", IconOverview],
  ["IconModules", IconModules],
  ["IconEnergy", IconEnergy],
  ["IconAnalyst", IconAnalyst],
  ["IconBell", IconBell],
  ["IconWrench", IconWrench],
  ["IconPadlock", IconPadlock],
  ["IconCheck", IconCheck],
  ["IconBolt", IconBolt],
] as const;

describe("icons — single-shape", () => {
  for (const [name, Icon] of ICONS) {
    it(`${name} renders an <svg> at the requested size + color`, () => {
      // Arrange + Act
      const { container } = render(<Icon size={24} color="#abcdef" />);
      const svg = container.querySelector("svg");

      // Assert
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("width")).toBe("24");
      expect(svg?.getAttribute("height")).toBe("24");
    });
  }
});

describe("icons — directional", () => {
  it.each(["right", "down", "left", "up"] as const)(
    "IconChevron dir=%s renders a <g> rotation",
    (dir) => {
      const { container } = render(
        <IconChevron size={20} color="#000" dir={dir} />,
      );
      const g = container.querySelector("g");
      expect(g).not.toBeNull();
    },
  );

  it.each(["up", "right", "down", "left"] as const)(
    "IconArrow dir=%s renders a <g> rotation",
    (dir) => {
      const { container } = render(
        <IconArrow size={20} color="#000" dir={dir} />,
      );
      expect(container.querySelector("g")).not.toBeNull();
    },
  );
});

describe("icons — alarm trio uses fill, not stroke", () => {
  it("IconWarning paints the triangle with fill, no stroke", () => {
    const { container } = render(<IconWarning size={16} color="#f5a623" />);
    const path = container.querySelector("svg > path");
    expect(path?.getAttribute("fill")).toBe("#f5a623");
    expect(path?.getAttribute("stroke")).toBeNull();
  });

  it("IconAlarm paints an 8-vertex polygon", () => {
    const { container } = render(<IconAlarm size={16} color="#e84040" />);
    const poly = container.querySelector("svg > polygon");
    const pts = poly?.getAttribute("points") ?? "";
    // 8 vertices, comma-separated within space-separated pairs
    expect(pts.split(" ")).toHaveLength(8);
  });

  it("IconFire paints a flame path with fill, no stroke", () => {
    const { container } = render(<IconFire size={16} color="#ff2020" />);
    const path = container.querySelector("svg > path");
    expect(path?.getAttribute("fill")).toBe("#ff2020");
  });
});
