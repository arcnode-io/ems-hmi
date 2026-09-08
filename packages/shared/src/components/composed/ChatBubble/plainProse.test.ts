/** Tests for plainProse — flatten light Markdown for the chat bubble. AAA. */

import { plainProse } from "./plainProse";

describe("plainProse", () => {
  it("strips heading markers but keeps the heading text", () => {
    expect(plainProse("### **Financial Performance**")).toBe(
      "Financial Performance",
    );
  });

  it("unwraps bold and fixes escaped dollar signs", () => {
    // Arrange — the exact shape the live LLM emitted
    const raw = "- **Total Net Revenue:** **\\$500**";

    // Act + Assert
    expect(plainProse(raw)).toBe("• Total Net Revenue: $500");
  });

  it("unwraps inline code and normalizes list bullets", () => {
    expect(plainProse("* `bess_module_01` discharged")).toBe(
      "• bess_module_01 discharged",
    );
  });

  it("leaves plain prose untouched", () => {
    const prose =
      "BESS-01 drifted from 80% to ~62% overnight — typical for an arbitrage-discharge profile.";
    expect(plainProse(prose)).toBe(prose);
  });

  it("collapses blank-line runs", () => {
    expect(plainProse("one\n\n\n\ntwo")).toBe("one\n\ntwo");
  });
});
