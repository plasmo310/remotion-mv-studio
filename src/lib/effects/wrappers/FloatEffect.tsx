import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loopMotionEffect } from "../functions/LoopMotionEffect";
import {
  dropShadowEffect,
  DropShadowOptions,
} from "../functions/DropShadowEffect";
import { MotionBlurEffect, MotionBlurOptions } from "./MotionBlurEffect";

/** 漂わせ方の上書き。省略した項目は既定値が使われる */
export type FloatOptions = {
  /** 上下に漂う周期（秒）。省略時 2.6 */
  floatSec?: number;
  /** 上下の振れ幅（表示サイズに対する比率）。省略時 0.05 */
  floatRatio?: number;
  /** 左右に傾く周期（秒）。省略時 3.7。上下とずらしてあるので既定のままでよい */
  tiltSec?: number;
  /** 傾きの振れ幅（度）。省略時 3 */
  tiltDeg?: number;
  /** 傾きの中心にする角度（度）。斜めに構えさせたいときに使う。省略時 0 */
  baseTiltDeg?: number;
  /** 追加の拡大率。絵の余白ぶん大きく見せたいときに使う。省略時 1 */
  scale?: number;
  /** 落ち影の強さの上書き。省略時は共通の既定値 */
  shadow?: DropShadowOptions;
  /** 残像の出し方。省略すると残像なし */
  blur?: MotionBlurOptions;
};

type FloatEffectProps = FloatOptions & {
  /** 表示サイズ（px）。漂う振れ幅と落ち影の基準にする */
  sizePx: number;
  /** 漂わせる中身。1辺 sizePx の正方形いっぱいに広がるよう置かれる */
  children: React.ReactNode;
};

// 残像は MotionBlurEffect が中身を過去フレームで描き直して作るので、
// blur は外側（FloatEffect）で処理し、こちらには渡さない
type FloatBoxProps = Omit<FloatEffectProps, "blur">;

/**
 * ふわふわ漂う箱1つ。
 * MotionBlurEffect は「中身を過去フレームで描き直す」ことで残像を出すので、
 * フレームに応じて変わる floatY / tilt の計算はラッパーの外ではなくこの中で行う
 * （外で計算して transform を埋めた要素を渡すと、残像も現在フレームと同じ絵になってしまう）
 */
const FloatBox = ({
  sizePx,
  floatSec = 2.6,
  floatRatio = 0.05,
  tiltSec = 3.7,
  tiltDeg = 3,
  baseTiltDeg = 0,
  scale = 1,
  shadow,
  children,
}: FloatBoxProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsedSec = frame / fps;

  // 上下に漂わせる
  const floatY =
    loopMotionEffect.oscillate(elapsedSec, floatSec) * sizePx * floatRatio;
  // 左右に傾ける。周期を上下とずらして、動きがそろって機械的に見えないようにする
  const tilt =
    loopMotionEffect.oscillate(elapsedSec, tiltSec) * tiltDeg + baseTiltDeg;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: sizePx,
          height: sizePx,
          // 透過 PNG の輪郭に沿う落ち影
          filter: dropShadowEffect(sizePx, shadow),
          transform: `translateY(${floatY}px) rotate(${tilt}deg) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/**
 * 宙に浮いた中身を、ふわふわ漂わせるラッパー。
 * 上下の漂いと左右の傾きを別々の周期で回し、残像で動きの尾を足す
 * @param param0
 * @param param0.sizePx 表示サイズ（px）
 * @param param0.floatSec 上下に漂う周期（秒）
 * @param param0.floatRatio 上下の振れ幅（表示サイズに対する比率）
 * @param param0.tiltSec 左右に傾く周期（秒）
 * @param param0.tiltDeg 傾きの振れ幅（度）
 * @param param0.baseTiltDeg 傾きの中心にする角度（度）
 * @param param0.scale 追加の拡大率
 * @param param0.shadow 落ち影の強さの上書き
 * @param param0.blur 残像の出し方
 * @param param0.children 漂わせる中身
 */
export const FloatEffect = ({ blur, ...box }: FloatEffectProps) => {
  if (!blur) {
    return <FloatBox {...box} />;
  }

  return (
    <MotionBlurEffect {...blur}>
      <FloatBox {...box} />
    </MotionBlurEffect>
  );
};
