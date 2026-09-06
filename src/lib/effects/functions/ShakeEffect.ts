import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";

// ---------------------------------------------------------------------------
// PerlinNoise で「頭で大きく震えて、すぐ収まる」揺れを作る。驚き・衝撃を出すとき使う。
// 1枚絵にもキャラにもテロップにもかけたいので、計算だけをここに置く。
//
// 計算そのものは純粋関数（shakeEffect）に置き、フックはフレームを読んで渡すだけにする。
// こうしておくと、レンダーの外（コールバックの中）からも呼べて、単体テストも書ける。
// ---------------------------------------------------------------------------

/** 揺れの指定 */
export type ShakeOptions = {
  /**
   * 揺れのばらつきの種。要素ごとに変えると揺れ方が変わる。
   * 同じ種なら毎回まったく同じ揺れ方になる（レンダーし直しても再現する）
   */
  seed: string;
  /** 揺れ幅（対象の表示サイズに対する比率） */
  amplitude: number;
  /** ノイズの進む速さ（1秒あたり）。大きいほど細かく速く震える */
  frequency: number;
  /** 効かせる長さ（秒）。頭から */
  durationSec: number;
  /** 回転の揺れ幅（度）。省略時 0 */
  rotateDeg?: number;
};

/** 揺れの結果。translate は足し算、rotate は加算、overscan は掛け算で重ねる */
export type ShakeValue = {
  /** 横のずれ（対象の表示サイズに対する比率） */
  x: number;
  /** 縦のずれ（対象の表示サイズに対する比率） */
  y: number;
  /** 回転（度） */
  rotate: number;
  /** 揺れて端に下地が出ないぶんを広げる倍率。揺れが収まると 1 に戻る */
  overscan: number;
};

/** 揺れないときの値。掛け算で重なる overscan だけ 1 */
const NO_SHAKE: ShakeValue = { x: 0, y: 0, rotate: 0, overscan: 1 };

/**
 * 頭で最大 → すぐ減衰する揺れを、そのフレームぶん計算する。
 * ノイズ座標は「経過秒 × frequency」で進め、x / y / 回転で種を分けて向きがそろわないようにする
 * @param frame 揺れが始まってからのフレーム
 * @param fps 1秒あたりのフレーム数
 * @param options 揺れの指定。省略（undefined）すると揺れない
 */
export const shakeEffect = (
  frame: number,
  fps: number,
  options?: ShakeOptions,
): ShakeValue => {
  if (!options) {
    return NO_SHAKE;
  }

  // 長さ 0 だと補間できないので最低1フレームは確保する
  const durationInFrames = Math.max(1, Math.round(options.durationSec * fps));

  // 減衰は頭で最大にして一気に落とし、あとは長い尾を引く（振動が弱まっていく感じ）。
  // 値 1 → 0 にかけるので out 系イージングで「最初に速く落ちる」形にする
  const decay = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const time = (frame / fps) * options.frequency;
  // 種の文字列はノイズの出方そのものを決めるので、呼び名を shake に変えたあとも
  // "wiggle" のままにしてある（変えると既存の MV の揺れ方が変わってしまう）
  const at = (channel: string, range: number) =>
    noise2D(`${options.seed}:wiggle-${channel}`, time, 0) * range * decay;

  return {
    x: at("x", options.amplitude),
    y: at("y", options.amplitude),
    rotate: at("r", options.rotateDeg ?? 0),
    // 係数 3 と 32 は「この揺れ幅ならこれくらい広げれば隠れる」を目で合わせた値
    overscan:
      1 + (options.amplitude * 3 + (options.rotateDeg ?? 0) / 32) * decay,
  };
};

/**
 * 頭で最大 → すぐ減衰する揺れを、いまのフレームぶん計算する。
 * shakeEffect にいまのフレームを渡すだけの薄いフック
 * @param options 揺れの指定。省略（undefined）すると揺れない
 */
export const useShake = (options?: ShakeOptions): ShakeValue =>
  shakeEffect(useCurrentFrame(), useVideoConfig().fps, options);
