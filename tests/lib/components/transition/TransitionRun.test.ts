import { describe, expect, it } from "vitest";
import {
  TRANSITION_KINDS,
  Transition,
} from "../../../../src/lib/components/transition/Transition";
import {
  buildTransitionRunSlots,
  TRANSITION_BLENDS,
} from "../../../../src/lib/components/transition/TransitionRun";

const FPS = 30;

/** 本番と同じ丸め方（useSecToFrame と同じ式） */
const toFrame = (sec: number) => Math.round(sec * FPS);

const FADE: Transition = { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 };
const SLIDE: Transition = {
  kinds: [TRANSITION_KINDS.SLIDE_LEFT],
  durationSec: 0.5,
};

const build = (
  items: readonly { startSec: number; transitionIn?: Transition | null }[],
  options: {
    endFrame: number;
    blend?: (typeof TRANSITION_BLENDS)[keyof typeof TRANSITION_BLENDS];
    endTransition?: Transition | null;
  },
) =>
  buildTransitionRunSlots(items, {
    toFrame,
    fps: FPS,
    endFrame: options.endFrame,
    endTransition: options.endTransition,
    blend: options.blend ?? TRANSITION_BLENDS.CROSS_DISSOLVE,
  });

describe("buildTransitionRunSlots", () => {
  it("長さは両端をそれぞれ丸めてから差を取る（長さを先に丸めた値とは食い違う）", () => {
    // 1.01 秒 → 30.3 → 30 フレーム、2.02 秒 → 60.6 → 61 フレーム。
    // 長さを先に丸めると round((2.02 - 1.01) * 30) = 30 になり、1フレームずれる
    const slots = build(
      [{ startSec: 0 }, { startSec: 1.01 }, { startSec: 2.02 }],
      {
        endFrame: 90,
      },
    );

    expect(slots.map((slot) => slot?.from)).toEqual([0, 30, 61]);
    expect(slots.map((slot) => slot?.durationInFrames)).toEqual([30, 31, 29]);
  });

  it("次の項目の入り方のぶんだけ後ろに伸びて重なる", () => {
    const slots = build(
      [{ startSec: 0 }, { startSec: 2, transitionIn: FADE }],
      {
        endFrame: 120,
      },
    );

    // 0.6 秒 = 18 フレームぶん、1つ目が後ろへ伸びる
    expect(slots[0]?.exitOverlapFrames).toBe(18);
    expect(slots[0]?.durationInFrames).toBe(60 + 18);
    // 入ってくる側は伸びない
    expect(slots[1]?.exitOverlapFrames).toBe(0);
    expect(slots[1]?.durationInFrames).toBe(120 - 60);
  });

  it("CROSS_DISSOLVE は前後どちらにも演出をそのまま渡す", () => {
    const slots = build(
      [{ startSec: 0 }, { startSec: 2, transitionIn: FADE }],
      {
        endFrame: 120,
      },
    );

    expect(slots[0]?.enter).toBeNull();
    expect(slots[0]?.exit).toBe(FADE);
    expect(slots[1]?.enter).toBe(FADE);
    expect(slots[1]?.exit).toBeNull();
  });

  it("LINEAR_OVER_UNDER は入る側に FADE を足し、出る側から FADE を抜く", () => {
    const slots = build(
      [{ startSec: 0 }, { startSec: 2, transitionIn: SLIDE }],
      {
        endFrame: 120,
        blend: TRANSITION_BLENDS.LINEAR_OVER_UNDER,
      },
    );

    // 入る側 : 書かれていない FADE が先頭に足される
    expect(slots[1]?.enter?.kinds).toEqual([
      TRANSITION_KINDS.FADE,
      TRANSITION_KINDS.SLIDE_LEFT,
    ]);
    // 出る側 : FADE 成分は抜かれる（SLIDE は残る）
    expect(slots[0]?.exit?.kinds).toEqual([TRANSITION_KINDS.SLIDE_LEFT]);
  });

  it("LINEAR_OVER_UNDER で FADE だけの境目でも重なりは残る（抜いた結果から計算しない）", () => {
    const slots = build(
      [{ startSec: 0 }, { startSec: 2, transitionIn: FADE }],
      {
        endFrame: 120,
        blend: TRANSITION_BLENDS.LINEAR_OVER_UNDER,
      },
    );

    // FADE を抜くと何も残らないので exit は null になるが…
    expect(slots[0]?.exit).toBeNull();
    // …重なりは抜く前の 0.6 秒から出すので 18 フレームのまま。
    // ここが 0 になると、次のカットが入りきる前にこちらが消えて画が飛ぶ
    expect(slots[0]?.exitOverlapFrames).toBe(18);
    expect(slots[0]?.durationInFrames).toBe(60 + 18);
  });

  it("最後の項目は endFrame まで。endTransition を渡すとそのぶん伸びる", () => {
    const withoutEnd = build([{ startSec: 0 }], { endFrame: 90 });
    expect(withoutEnd[0]?.durationInFrames).toBe(90);
    expect(withoutEnd[0]?.exit).toBeNull();

    const withEnd = build([{ startSec: 0 }], {
      endFrame: 90,
      endTransition: FADE,
    });
    expect(withEnd[0]?.durationInFrames).toBe(90 + 18);
    expect(withEnd[0]?.exit).toBe(FADE);
  });

  it("長さ 0 以下になる項目は null（描かない）", () => {
    // 2つ目と3つ目が同じ秒 = 2つ目の長さが 0
    const slots = build([{ startSec: 0 }, { startSec: 2 }, { startSec: 2 }], {
      endFrame: 120,
    });

    expect(slots[0]).not.toBeNull();
    expect(slots[1]).toBeNull();
    expect(slots[2]).not.toBeNull();
  });
});
