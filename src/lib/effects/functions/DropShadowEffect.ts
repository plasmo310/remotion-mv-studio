// ---------------------------------------------------------------------------
// 切り抜き（透過 PNG）を背景から手前へ浮かせる落ち影。
// box-shadow ではなく drop-shadow を使い、絵の輪郭に沿って影を落とす。
// オフセット・ぼかしは絵の表示サイズに比例させ、大きさが変わっても
// 影の見た目の比率をそろえる（Closing の切り抜き、Dance/Hover のキャラで共用）。
// 強さを変えたいカットは第2引数で個別に上書きする。
// ---------------------------------------------------------------------------

/** 落ち影の強さの上書き。省略した項目は既定値が使われる */
export type DropShadowOptions = {
  /** 縦オフセット（絵の表示サイズに対する比率）。省略時 0.015。大きいほど浮いて見える */
  offsetRatio?: number;
  /** ぼかし（絵の表示サイズに対する比率）。省略時 0.03。大きいほど柔らかい影 */
  blurRatio?: number;
  /** 濃さ（0〜1）。省略時 0.35。大きいほど濃い影 */
  alpha?: number;
};

/**
 * 落ち影の drop-shadow filter 文字列を作る。
 * @param sizePx 影を落とす絵の表示サイズ（px）。ふつうは高さを渡す
 * @param options 強さの上書き（カットごとに濃さ・ぼかしを変えたいとき）
 */
export const dropShadowEffect = (
  sizePx: number,
  options: DropShadowOptions = {},
): string => {
  const offsetRatio = options.offsetRatio ?? 0.015;
  const blurRatio = options.blurRatio ?? 0.03;
  const alpha = options.alpha ?? 0.35;

  return `drop-shadow(0 ${sizePx * offsetRatio}px ${
    sizePx * blurRatio
  }px rgba(0, 0, 0, ${alpha}))`;
};
