import { describe, expect, it } from "vitest";
import { beatTempoToSec, secPerBeat } from "../../../src/lib/units/BeatTiming";

describe("secPerBeat", () => {
  it("BPM を1拍の秒に直す", () => {
    expect(secPerBeat(120)).toBeCloseTo(0.5);
    expect(secPerBeat(150)).toBeCloseTo(0.4);
  });

  it("0 以下の BPM でも 0 除算にならない", () => {
    expect(Number.isFinite(secPerBeat(0))).toBe(true);
    expect(secPerBeat(-120)).toBeGreaterThan(0);
  });
});

describe("beatTempoToSec", () => {
  it("beats を省略すると1拍ぶんになる", () => {
    expect(beatTempoToSec({ bpm: 120 })).toBeCloseTo(0.5);
  });

  it("beats のぶんだけ長くなる（0.5 で裏拍、2 で2拍ぶん）", () => {
    expect(beatTempoToSec({ bpm: 120, beats: 0.5 })).toBeCloseTo(0.25);
    expect(beatTempoToSec({ bpm: 120, beats: 2 })).toBeCloseTo(1);
  });
});
