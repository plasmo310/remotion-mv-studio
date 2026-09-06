// ---------------------------------------------------------------------------
// コマが切り替わった瞬間に1回だけ跳ねる変形。
// FrameAnimation の motion に渡して使う。
// 「コマを切り替える」仕組みと「切り替わりをどう見せるか」は別ものなので、
// 跳ねさせるかどうか・どれくらい跳ねるかは呼び出し側（MV 側）が決める。
// ---------------------------------------------------------------------------

import { loopMotionEffect } from "./LoopMotionEffect";

/** 跳ね方の上書き。省略した項目は既定値が使われる */
export type BounceOptions = {
  /** 持ち上げる量（絵の表示サイズに対する比率）。省略時 0.04 */
  liftRatio?: number;
  /** 縦に伸ばす量（比率）。省略時 0.03。伸ばした分だけ横を縮める */
  stretchRatio?: number;
};

/**
 * 跳ねる変形の transform 文字列を作る。
 * 0 → 1 → 0 の山を描くので、跳ね上がってから元の形へ戻る
 * @param progress コマが切り替わってからの進み具合（0 で切り替わった瞬間、1 で跳ね終わり）
 * @param sizePx 跳ねる絵の表示サイズ（px）
 * @param options 跳ね方の上書き
 */
export const bounceEffect = (
  progress: number,
  sizePx: number,
  options: BounceOptions = {},
): string => {
  const liftRatio = options.liftRatio ?? 0.04;
  const stretchRatio = options.stretchRatio ?? 0.03;

  // 跳ね終わったあとは bump が 0 を返すので、コマが長く居座っても動きっぱなしにならない
  const bounce = loopMotionEffect.bump(progress);

  return `translateY(${-bounce * sizePx * liftRatio}px) scale(${
    1 - bounce * stretchRatio
  }, ${1 + bounce * stretchRatio})`;
};
