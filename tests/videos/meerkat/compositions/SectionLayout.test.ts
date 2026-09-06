import { describe, expect, it } from "vitest";
import {
  buildTransitionRunSlots,
  TRANSITION_BLENDS,
} from "../../../../src/lib/components/transition/TransitionRun";
import { JA_LYRICS } from "../../../../src/videos/meerkat/data/Lyrics";
import { LEAD_IN_SEC } from "../../../../src/videos/meerkat/sections/00_01_Intro";
import {
  END_PAD_SEC,
  fullDurationInFrames,
  FULL_VIDEO_FPS,
  SECTIONS,
} from "../../../../src/videos/meerkat/compositions/MusicVideoFull";

// セクションの置き場所は「日本語版の出力を1フレームも変えない」という決めごとの土台。
// TransitionRun への共通化の前に、旧実装の式から出した値をここに固定してある
// （from = round((startSec + leadIn) * fps)、
//   長さ = round((次の startSec + leadIn) * fps) - from + round(次の入り方の秒 * fps)）。
// リファクタで並べ方が変わったらここで落ちる（docs/videos/meerkat.md 参照）
const EXPECTED: [name: string, from: number, durationInFrames: number][] = [
  ["00_01_Intro", 0, 390],
  ["01_01_Verse", 372, 380],
  ["01_02_PreChorus", 737, 478],
  ["01_03_Chorus", 1200, 331],
  ["02_01_Verse", 1513, 387],
  ["02_02_PreChorus", 1885, 470],
  ["02_03_Chorus", 2340, 348],
  ["03_01_Solo", 2673, 380],
  ["03_02_Chorus", 3045, 350],
  ["03_03_Outro", 3380, 397],
  ["03_04_Closing", 3762, 338],
  ["04_01_Thanks", 4100, 218],
];

/** 本編と同じ条件でセクションを並べる（MusicVideoFull が TransitionRun に渡しているものと同じ） */
const buildSlots = () => {
  const toFrame = (sec: number) =>
    Math.round((sec + LEAD_IN_SEC) * FULL_VIDEO_FPS);

  return buildTransitionRunSlots(SECTIONS, {
    toFrame,
    fps: FULL_VIDEO_FPS,
    endFrame: toFrame(JA_LYRICS.duration + END_PAD_SEC),
    blend: TRANSITION_BLENDS.CROSS_DISSOLVE,
  });
};

describe("日本語版本編のセクションの置き場所", () => {
  it("各セクションの頭出しと長さが変わっていない", () => {
    const slots = buildSlots();

    expect(
      SECTIONS.map((section, index) => [
        section.name,
        slots[index]?.from,
        slots[index]?.durationInFrames,
      ]),
    ).toEqual(EXPECTED);
  });

  it("最後のセクションが動画の終わりにぴったり着地する", () => {
    const slots = buildSlots();
    const last = slots[slots.length - 1];

    expect((last?.from ?? 0) + (last?.durationInFrames ?? 0)).toBe(
      fullDurationInFrames(JA_LYRICS, LEAD_IN_SEC),
    );
  });

  it("セクションの境目は隙間なく重なる（前が次の入り方のぶんだけ後ろへ伸びる）", () => {
    const slots = buildSlots();

    SECTIONS.forEach((_, index) => {
      if (index === SECTIONS.length - 1) {
        return;
      }

      const slot = slots[index];
      const next = slots[index + 1];
      // 前のセクションの終わり = 次のセクションの頭 + 重なりぶん
      expect((slot?.from ?? 0) + (slot?.durationInFrames ?? 0)).toBe(
        (next?.from ?? 0) + (slot?.exitOverlapFrames ?? 0),
      );
    });
  });
});
