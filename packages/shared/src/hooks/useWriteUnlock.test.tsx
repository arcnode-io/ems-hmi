import { act, renderHook } from "@testing-library/react";
import { RELOCK_MS, useWriteUnlock } from "./useWriteUnlock";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useWriteUnlock", () => {
  it("starts locked and unlocks on demand", () => {
    // Arrange
    const { result } = renderHook(() => useWriteUnlock(true));
    const before = result.current.unlocked;

    // Act
    act(() => result.current.unlock());

    // Assert
    expect([before, result.current.unlocked]).toEqual([false, true]);
  });

  it("relocks RELOCK_MS after unlocking when nothing is written", () => {
    // Arrange
    const { result } = renderHook(() => useWriteUnlock(true));
    act(() => result.current.unlock());

    // Act
    act(() => { jest.advanceTimersByTime(RELOCK_MS); });

    // Assert
    expect(result.current.unlocked).toBe(false);
  });

  it("restarts the countdown on every write", () => {
    // Arrange
    const { result } = renderHook(() => useWriteUnlock(true));
    act(() => result.current.unlock());
    act(() => { jest.advanceTimersByTime(RELOCK_MS - 1000); });

    // Act
    act(() => result.current.noteWrite());
    act(() => { jest.advanceTimersByTime(RELOCK_MS - 1000); });
    const stillOpen = result.current.unlocked;
    act(() => { jest.advanceTimersByTime(1000); });

    // Assert
    expect([stillOpen, result.current.unlocked]).toEqual([true, false]);
  });

  it("relocks as soon as the screen loses focus", () => {
    // Arrange
    const { result, rerender } = renderHook(({ focused }) => useWriteUnlock(focused), {
      initialProps: { focused: true },
    });
    act(() => result.current.unlock());

    // Act
    rerender({ focused: false });

    // Assert
    expect(result.current.unlocked).toBe(false);
  });

  it("a write while locked doesn't unlock", () => {
    // Arrange
    const { result } = renderHook(() => useWriteUnlock(true));

    // Act
    act(() => result.current.noteWrite());

    // Assert
    expect(result.current.unlocked).toBe(false);
  });
});
