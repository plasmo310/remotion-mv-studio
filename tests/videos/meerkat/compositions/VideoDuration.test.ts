import { describe, expect, it } from "vitest";
import {
  EN_LYRICS,
  JA_LYRICS,
} from "../../../../src/videos/meerkat/data/Lyrics";
import { LEAD_IN_SEC } from "../../../../src/videos/meerkat/sections/00_01_Intro";
import {
  INTRO_END_SEC,
  fullDurationInFrames,
} from "../../../../src/videos/meerkat/compositions/MusicVideoFull";
import {
  EN_INTRO_END_SEC,
  EN_LEAD_IN_SEC,
} from "../../../../src/videos/meerkat/compositions/MusicVideoFullEn";
import { shortDurationInFrames } from "../../../../src/videos/meerkat/compositions/MusicVideoShort";

// 動画の長さは「日本語版の出力を1フレームも変えない」という決めごとの土台なので、
// リファクタで式が変わったらここで落ちるようにしておく（docs/videos/meerkat.md 参照）
describe("動画の長さ（フレーム数）", () => {
  it("MV-Meerkats-Full-Ja は 4318 フレーム", () => {
    expect(fullDurationInFrames(JA_LYRICS, LEAD_IN_SEC)).toBe(4318);
  });

  it("MV-Meerkats-Short-Ja は 350 フレーム", () => {
    expect(shortDurationInFrames(INTRO_END_SEC)).toBe(350);
  });

  it("MV-Meerkats-Full-En は 3998 フレーム", () => {
    expect(fullDurationInFrames(EN_LYRICS, EN_LEAD_IN_SEC)).toBe(3998);
  });

  it("MV-Meerkats-Short-En は 386 フレーム", () => {
    expect(shortDurationInFrames(EN_INTRO_END_SEC)).toBe(386);
  });
});
