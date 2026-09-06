import { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loopMotionEffect } from "../../effects/functions/LoopMotionEffect";

// ---------------------------------------------------------------------------
// 飾りの配置
// ---------------------------------------------------------------------------

/**
 * 飾りの配置に使うグリッドの分割数。
 * 完全なランダムだと固まったり偏ったりするため、
 * いったん格子状に置いてからセル内でずらす
 */
const PROP_COLUMNS = 5;
const PROP_ROWS = 4;
/** セルの中でずらす量（セルサイズに対する比率）。格子っぽさを消すため */
const JITTER_RATIO = -0.35;
/** 画面の外へはみ出させる比率。端まで飾りが続いているように見せる */
const SCATTER_MARGIN_RATIO = 0.12;

/** ばらまく飾り1つ分の情報 */
type ScatteredProp = {
  /** 画面幅・画面高さに対する中心位置の比率 */
  x: number;
  y: number;
  /** 画面高さに対する大きさの比率 */
  sizeRatio: number;
  /** 1周にかかる秒数 */
  rotationSec: number;
  /** 回転の向き。+1 で時計回り、-1 で反時計回り */
  direction: number;
  /** 初期角度（度）。そろって同じ向きから回り始めないようにする */
  angle: number;
};

/** buildProps に渡す、個体ごとにばらつかせる値の範囲 */
type BuildPropsRange = {
  sizeRatioMin: number;
  sizeRatioMax: number;
  rotationSecMin: number;
  rotationSecMax: number;
};

const mix = (from: number, to: number, ratio: number) =>
  from + (to - from) * ratio;

const buildProps = (seed: string, range: BuildPropsRange): ScatteredProp[] => {
  const props: ScatteredProp[] = [];

  for (let row = 0; row < PROP_ROWS; row++) {
    for (let column = 0; column < PROP_COLUMNS; column++) {
      const cellSeed = `${seed}-${row}-${column}`;
      const jitterX = (random(`${cellSeed}-jx`) - 0.5) * JITTER_RATIO;
      const jitterY = (random(`${cellSeed}-jy`) - 0.5) * JITTER_RATIO;

      // 0〜1 のセル座標を、画面の外側まで少し広げた範囲に写す
      const cellX = (column + 0.5 + jitterX) / PROP_COLUMNS;
      const cellY = (row + 0.5 + jitterY) / PROP_ROWS;
      const spread = 1 + SCATTER_MARGIN_RATIO * 2;

      props.push({
        x: cellX * spread - SCATTER_MARGIN_RATIO,
        y: cellY * spread - SCATTER_MARGIN_RATIO,
        sizeRatio: mix(
          range.sizeRatioMin,
          range.sizeRatioMax,
          random(`${cellSeed}-size`),
        ),
        rotationSec: mix(
          range.rotationSecMin,
          range.rotationSecMax,
          random(`${cellSeed}-speed`),
        ),
        direction: random(`${cellSeed}-dir`) < 0.5 ? -1 : 1,
        angle: random(`${cellSeed}-angle`) * 360,
      });
    }
  }

  return props;
};

// ---------------------------------------------------------------------------
// 表示
// ---------------------------------------------------------------------------

type SimpleBackgroundProps = {
  /** 背景のベタ塗り色。省略時 "#FD94AC"（ピンク） */
  backgroundColor?: string;
  /**
   * ばらまく飾りの画像（public からの相対パス）。
   * 画像は MV ごとに `assets/<MV名>/...` の下にあるので、汎用側で既定値は持たない
   */
  propSrc: string;
  /**
   * 飾りの配置に使う乱数のシード。
   * Remotion の random() は同じシードなら毎フレーム同じ値を返すので、
   * ここを変えるとばらまき方だけを差し替えられる
   */
  seed?: string;
  /** 飾りの大きさ（画面高さに対する比率）の範囲。省略時 0.15〜0.25 */
  propSizeRatioMin?: number;
  propSizeRatioMax?: number;
  /**
   * 飾りが1周するのにかける秒数の範囲。省略時 8〜22 秒。
   * 個体ごとにばらつかせて回転をそろえない
   */
  rotationSecMin?: number;
  rotationSecMax?: number;
  /** 飾りの不透明度。背景になじませて、手前のキャラより目立たせない */
  propOpacity?: number;
};

/**
 * ベタ塗りの背景の上に飾りをばらまき、それぞれをゆっくり回転させる背景。
 * 色・回転速度などは Props で差し替えられる（飾り画像 propSrc だけは必須）
 * @param param0
 * @param param0.backgroundColor 背景のベタ塗り色
 * @param param0.propSrc ばらまく飾りの画像（public からの相対パス）
 * @param param0.seed 飾りの配置に使う乱数のシード
 * @param param0.propSizeRatioMin 飾りの大きさ（画面高さに対する比率）の下限
 * @param param0.propSizeRatioMax 飾りの大きさ（画面高さに対する比率）の上限
 * @param param0.rotationSecMin 飾りが1周する秒数の下限
 * @param param0.rotationSecMax 飾りが1周する秒数の上限
 * @param param0.propOpacity 飾りの不透明度
 */
export const SimpleBackground = ({
  backgroundColor = "#FD94AC",
  propSrc,
  seed = "simple-background-prop",
  propSizeRatioMin = 0.15,
  propSizeRatioMax = 0.25,
  rotationSecMin = 8,
  rotationSecMax = 22,
  propOpacity = 0.95,
}: SimpleBackgroundProps) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const props = useMemo(
    () =>
      buildProps(seed, {
        sizeRatioMin: propSizeRatioMin,
        sizeRatioMax: propSizeRatioMax,
        rotationSecMin,
        rotationSecMax,
      }),
    [seed, propSizeRatioMin, propSizeRatioMax, rotationSecMin, rotationSecMax],
  );

  const elapsedSec = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {props.map((prop, index) => {
        const size = height * prop.sizeRatio;
        const rotation =
          prop.angle +
          loopMotionEffect.spinAngleDeg(
            elapsedSec,
            prop.rotationSec,
            prop.direction,
          );

        return (
          <Img
            key={index}
            src={staticFile(propSrc)}
            style={{
              position: "absolute",
              left: `${prop.x * 100}%`,
              top: `${prop.y * 100}%`,
              width: size,
              height: size,
              // left / top で指定した点を画像の中心に合わせてから回す
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              opacity: propOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
