import { describe, expect, it } from "vitest";
import { fadeOutVolume } from "../../../../src/lib/effects/functions/AudioFadeEffect";

describe("fadeOutVolume", () => {
  it("絞りにかかるまでは音量を下げない", () => {
    expect(fadeOutVolume(0, 100, 10)).toBe(1);
    expect(fadeOutVolume(90, 100, 10)).toBe(1);
  });

  it("絞りの真ん中で半分になり、終わりで 0 になる", () => {
    expect(fadeOutVolume(95, 100, 10)).toBeCloseTo(0.5);
    expect(fadeOutVolume(100, 100, 10)).toBe(0);
  });

  it("尺を過ぎても 0 のまま（clamp する）", () => {
    expect(fadeOutVolume(200, 100, 10)).toBe(0);
  });
});
