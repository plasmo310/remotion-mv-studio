import { interpolate } from "remotion";

// ---------------------------------------------------------------------------
// 曲を途中で切るときの音量。ぶつ切りだと聴いていて痛いので、終わりだけ絞る。
// Html5Audio / Audio の volume コールバックから呼ぶ。
// ---------------------------------------------------------------------------

/**
 * 終わりぎわだけ 1 → 0 に絞った、そのフレームの音量を返す。
 * @param frame 音を載せた Sequence の頭からのフレーム
 * @param totalFrames 鳴らす長さ（フレーム）
 * @param fadeOutFrames 絞りにかける長さ（フレーム）
 */
export const fadeOutVolume = (
  frame: number,
  totalFrames: number,
  fadeOutFrames: number,
): number =>
  interpolate(frame, [totalFrames - fadeOutFrames, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
