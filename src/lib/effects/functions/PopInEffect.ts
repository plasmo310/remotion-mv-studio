import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// ---------------------------------------------------------------------------
// 「行き過ぎてから戻る」バネで出てくる、登場の進み具合。
// 動かし方（下から生える・上から下りる・弾む）は呼び出し側が transform で決め、
// ここは秒で指定したバネの進みだけを返す。
//
// 計算そのものは純粋関数（popInEffect）に置き、フックはフレームを読んで渡すだけにする。
// こうしておくと、レンダーの外（コールバックの中）からも呼べて、単体テストも書ける。
// ---------------------------------------------------------------------------

/** バネの指定。省略した項目は既定値が使われる */
export type PopInOptions = {
  /** 出きるまでの秒数。省略時 0.5 */
  durationSec?: number;
  /** バネの硬さ。小さいほど大きく行き過ぎて揺れる。省略時 12 */
  damping?: number;
  /** バネの重さ。大きいほどゆっくり効く。省略時 0.7 */
  mass?: number;
};

/**
 * そのフレームの登場の進み具合（0 → 1）を返す。
 * バネなので途中で 1 を行き過ぎる。行き過ぎぶんも動きに効かせたいときは clamp せずに使う
 * @param frame 登場が始まってからのフレーム
 * @param fps 1秒あたりのフレーム数
 * @param options バネの指定
 */
export const popInEffect = (
  frame: number,
  fps: number,
  options: PopInOptions = {},
): number => {
  const durationSec = options.durationSec ?? 0.5;
  const damping = options.damping ?? 12;
  const mass = options.mass ?? 0.7;

  return spring({
    frame,
    fps,
    config: { damping, mass },
    durationInFrames: Math.round(durationSec * fps),
  });
};

/**
 * いまのフレームの登場の進み具合（0 → 1）を返す。
 * popInEffect にいまのフレームを渡すだけの薄いフック
 * @param options バネの指定
 */
export const usePopIn = (options?: PopInOptions): number =>
  popInEffect(useCurrentFrame(), useVideoConfig().fps, options);
