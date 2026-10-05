import { act, renderHook, waitFor } from "@testing-library/react";
import { SIDEBAR_COLLAPSED_KEY, useSidebarCollapsed } from "./useSidebarCollapsed";

beforeEach(() => localStorage.clear());

describe("useSidebarCollapsed", () => {
  it("toggles and remembers the choice for this browser", () => {
    // Arrange
    const { result } = renderHook(() => useSidebarCollapsed());
    const initial = result.current.collapsed;

    // Act
    act(() => result.current.toggle());

    // Assert
    expect([initial, result.current.collapsed, localStorage.getItem(SIDEBAR_COLLAPSED_KEY)]).toEqual([false, true, "true"]);
  });

  it("restores a remembered collapsed sidebar on load", async () => {
    // Arrange
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "true");

    // Act
    const { result } = renderHook(() => useSidebarCollapsed());

    // Assert
    await waitFor(() => expect(result.current.collapsed).toBe(true));
  });
});
