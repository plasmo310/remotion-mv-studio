// ---------------------------------------------------------------------------
// サイン波を土台にしたモーションの共通計算。
// 回り続ける・揺れ続ける（spinAngleDeg / oscillate）ものと、
// 一度だけ山を描いて戻る（bump）ものを、同じ式で書けるようにここへまとめる
// （見た目のパラメータは呼び出し側）。
// ---------------------------------------------------------------------------

/** 0 除算を避けるための最小周期（秒） */
const MIN_PERIOD_SEC = 0.0001;

/**
 * サイン波を土台にしたモーションの共通計算。
 * 個別 export ではなく1つのオブジェクトにまとめ、呼び出し側から
 * loopMotionEffect.oscillate(...) のように名前空間つきで使う
 */
export const loopMotionEffect = {
  /**
   * 一定周期でぐるぐる回り続ける角度（度）を返す。
   * elapsedSec に負の値を渡すと戻り角も負になるので、回し始めのタイミングは呼び出し側で調整する
   * @param elapsedSec 経過秒
   * @param rotationSec 1周にかける秒数
   * @param direction 回る向き。+1 で時計回り、-1 で反時計回り。省略時 +1
   */
  spinAngleDeg: (
    elapsedSec: number,
    rotationSec: number,
    direction: number = 1,
  ): number =>
    (elapsedSec / Math.max(rotationSec, MIN_PERIOD_SEC)) * 360 * direction,

  /**
   * 一定周期で -1 〜 1 を往復するサイン波（位相はゼロ始まり）。
   * ふわふわ浮かせる・ゆっくり傾ける、といったループ演出の土台に使う
   * @param elapsedSec 経過秒
   * @param periodSec 1往復にかける秒数
   */
  oscillate: (elapsedSec: number, periodSec: number): number =>
    Math.sin((elapsedSec / Math.max(periodSec, MIN_PERIOD_SEC)) * Math.PI * 2),

  /**
   * 0 → 1 → 0 と一度だけ山を描く半サイン波（progress 0.5 で頂点）。
   * 跳ねる・弾むといった一過性の動きに使う。
   * 山の外（0 以下・1 以上）はぴったり 0 を返すので、
   * 山を越えたあと動きっぱなしにならない
   * @param progress 進み具合（0 → 1）
   */
  bump: (progress: number): number =>
    progress > 0 && progress < 1 ? Math.sin(progress * Math.PI) : 0,
} as const;
