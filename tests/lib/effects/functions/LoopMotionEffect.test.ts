import { describe, expect, it } from "vitest";
import { loopMotionEffect } from "../../../../src/lib/effects/functions/LoopMotionEffect";

describe("loopMotionEffect.bump", () => {
  it("山の外はぴったり 0 を返す（山を越えたあと動きっぱなしにならない）", () => {
    expect(loopMotionEffect.bump(0)).toBe(0);
    expect(loopMotionEffect.bump(1)).toBe(0);
    expect(loopMotionEffect.bump(-0.5)).toBe(0);
    expect(loopMotionEffect.bump(2)).toBe(0);
  });

  it("進み具合 0.5 で頂点の 1 になる", () => {
    expect(loopMotionEffect.bump(0.5)).toBe(1);
  });
});

describe("loopMotionEffect.oscillate", () => {
  it("周期の 1/4 で +1、3/4 で -1 を通り、1周期で 0 に戻る", () => {
    expect(loopMotionEffect.oscillate(0, 2)).toBeCloseTo(0);
    expect(loopMotionEffect.oscillate(0.5, 2)).toBeCloseTo(1);
    expect(loopMotionEffect.oscillate(1.5, 2)).toBeCloseTo(-1);
    expect(loopMotionEffect.oscillate(2, 2)).toBeCloseTo(0);
  });

  it("周期 0 を渡しても 0 除算にならない", () => {
    expect(Number.isFinite(loopMotionEffect.oscillate(1, 0))).toBe(true);
  });
});

describe("loopMotionEffect.spinAngleDeg", () => {
  it("1周にかける秒数の半分で 180 度回る", () => {
    expect(loopMotionEffect.spinAngleDeg(1, 2)).toBe(180);
  });

  it("向きに -1 を渡すと逆回りになる", () => {
    expect(loopMotionEffect.spinAngleDeg(1, 2, -1)).toBe(-180);
  });
});
