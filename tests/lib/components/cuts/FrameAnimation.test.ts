import { describe, expect, it } from "vitest";
import {
  toAnimationPoses,
  toBeatAnimationPoses,
} from "../../../../src/lib/components/cuts/FrameAnimation";

describe("toAnimationPoses", () => {
  it("ひとつ前からの間隔を足し合わせて、頭からの秒に直す", () => {
    const poses = toAnimationPoses([
      { offsetSec: 0, src: "a.png" },
      { offsetSec: 0.4, src: "b.png", flipped: true },
      { offsetSec: 0.4, src: "c.png", withEffect: true },
    ]);

    expect(poses).toEqual([
      { src: "a.png", startSec: 0 },
      { src: "b.png", flipped: true, startSec: 0.4 },
      { src: "c.png", withEffect: true, startSec: 0.8 },
    ]);
  });

  it("先頭の offsetSec は頭からの待ち時間として扱う", () => {
    const poses = toAnimationPoses([{ offsetSec: 1.2, src: "a.png" }]);

    expect(poses[0].startSec).toBe(1.2);
  });
});

describe("toBeatAnimationPoses", () => {
  it("拍で書いた間隔を BPM で秒に直してから足し合わせる", () => {
    // 120 BPM なので1拍 0.5 秒
    const poses = toBeatAnimationPoses(
      [
        { offsetBeats: 0, src: "a.png" },
        { offsetBeats: 1, src: "b.png", flipped: true },
        { offsetBeats: 0.5, src: "c.png", withEffect: true },
      ],
      120,
    );

    expect(poses[0].startSec).toBeCloseTo(0);
    expect(poses[1].startSec).toBeCloseTo(0.5);
    expect(poses[2].startSec).toBeCloseTo(0.75);
    expect(poses[1].flipped).toBe(true);
    expect(poses[2].withEffect).toBe(true);
  });

  it("BPM を上げると全体がそのぶん詰まる", () => {
    const cues = [
      { offsetBeats: 0, src: "a.png" },
      { offsetBeats: 4, src: "b.png" },
    ];

    expect(toBeatAnimationPoses(cues, 240)[1].startSec).toBeCloseTo(
      toBeatAnimationPoses(cues, 120)[1].startSec / 2,
    );
  });
});
