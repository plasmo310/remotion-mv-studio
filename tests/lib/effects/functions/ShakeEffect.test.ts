import { describe, expect, it } from "vitest";
import {
  shakeEffect,
  ShakeOptions,
} from "../../../../src/lib/effects/functions/ShakeEffect";

const FPS = 30;
const OPTIONS: ShakeOptions = {
  seed: "test",
  amplitude: 0.05,
  frequency: 12,
  durationSec: 1,
  rotateDeg: 4,
};

describe("shakeEffect", () => {
  it("options を省略すると揺れない（overscan だけ 1）", () => {
    expect(shakeEffect(3, FPS)).toEqual({ x: 0, y: 0, rotate: 0, overscan: 1 });
  });

  it("同じ種・同じフレームなら毎回まったく同じ揺れ方になる", () => {
    expect(shakeEffect(7, FPS, OPTIONS)).toEqual(shakeEffect(7, FPS, OPTIONS));
  });

  it("種が違えば揺れ方も変わる（1画面に2つ置いてもそろわない）", () => {
    const other = shakeEffect(7, FPS, { ...OPTIONS, seed: "other" });

    expect(other.x).not.toBe(shakeEffect(7, FPS, OPTIONS).x);
  });

  it("x / y / 回転は種を分けてあるので向きがそろわない", () => {
    const shake = shakeEffect(7, FPS, OPTIONS);

    expect(shake.x).not.toBe(shake.y);
  });

  it("durationSec を過ぎると揺れが収まり、広げるぶんも 1 に戻る", () => {
    const shake = shakeEffect(FPS * 2, FPS, OPTIONS);

    // 減衰が 0 になったぶんを掛けた結果なので、符号つきゼロ（-0）になりうる
    expect(shake.x).toBeCloseTo(0);
    expect(shake.y).toBeCloseTo(0);
    expect(shake.rotate).toBeCloseTo(0);
    expect(shake.overscan).toBe(1);
  });

  it("揺れているあいだは端に下地が出ないよう 1 より広げる", () => {
    expect(shakeEffect(3, FPS, OPTIONS).overscan).toBeGreaterThan(1);
  });

  it("揺れ幅は amplitude を超えない", () => {
    const shake = shakeEffect(3, FPS, OPTIONS);

    expect(Math.abs(shake.x)).toBeLessThanOrEqual(OPTIONS.amplitude);
  });
});
