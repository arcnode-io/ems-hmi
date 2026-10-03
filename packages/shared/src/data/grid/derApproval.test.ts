import { derBannerKind, derCommandTopic } from "./derApproval";
import type { TopologyViewType } from "../topology/topology.schema";

describe("derBannerKind", () => {
  it("prioritises an active event, then a pending request, then a rejection", () => {
    // Arrange / Act
    const kinds = [
      derBannerKind({ curtailmentActive: true, derDispatchState: "ACTIVE" }),
      derBannerKind({ curtailmentActive: false, derDispatchState: "PENDING" }),
      derBannerKind({ curtailmentActive: false, derDispatchState: "REJECTED" }),
      derBannerKind({ curtailmentActive: false, derDispatchState: "IDLE" }),
      derBannerKind({ curtailmentActive: null, derDispatchState: null }),
    ];

    // Assert
    expect(kinds).toEqual(["active", "pending", "rejected", "none", "none"]);
  });
});

describe("derCommandTopic", () => {
  it("resolves der_dispatch by template and builds the approve/reject command topic", () => {
    // Arrange
    const devices: TopologyViewType["devices"] = {
      der_dispatch: { device_id: "der_dispatch", template: "der_dispatch", parent: null, display_name: null, extra_measurements: null },
    };

    // Act
    const topics = [derCommandTopic(devices, "s1", "approve"), derCommandTopic(devices, "s1", "reject"), derCommandTopic({}, "s1", "approve")];

    // Assert
    expect(topics).toEqual([
      "sites/s1/devices/der_dispatch/commands/enable/event_active/none",
      "sites/s1/devices/der_dispatch/commands/disable/event_active/none",
      null,
    ]);
  });
});
