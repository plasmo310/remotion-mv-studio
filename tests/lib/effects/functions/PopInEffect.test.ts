import { describe, expect, it } from "vitest";
import { popInEffect } from "../../../../src/lib/effects/functions/PopInEffect";

const FPS = 30;

describe("popInEffect", () => {
  it("頭ではまだ出ていない", () => {
    expect(popInEffect(0, FPS)).toBe(0);
  });

  it("進むにつれて出てくる", () => {
    expect(popInEffect(5, FPS)).toBeGreaterThan(popInEffect(2, FPS));
  });

  it("バネなので途中で 1 を行き過ぎる", () => {
    const overshoot = Array.from({ length: 30 }, (_, frame) =>
      popInEffect(frame, FPS),
    );

    expect(Math.max(...overshoot)).toBeGreaterThan(1);
  });

  it("出きったあとは 1 に落ち着く", () => {
    expect(popInEffect(120, FPS)).toBeCloseTo(1, 2);
  });

  it("durationSec を伸ばすと同じフレームでの進み具合が小さくなる", () => {
    expect(popInEffect(5, FPS, { durationSec: 2 })).toBeLessThan(
      popInEffect(5, FPS),
    );
  });
});
