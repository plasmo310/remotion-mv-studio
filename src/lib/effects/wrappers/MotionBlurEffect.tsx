import { AbsoluteFill, Sequence } from "remotion";

/**
 * 尾の出し方。ImageCuts のようにカットのデータ側から指定できるよう、
 * ラッパーの Props から見た目のパラメータだけを切り出してある
 */
export type MotionBlurOptions = {
  /** 残像の枚数。省略時 3。増やすほど尾が長くなるが、そのぶん中身を何度も描くことになる */
  layers?: number;
  /** 残像 1 枚ぶんの時間差（フレーム）。省略時 1。動きがゆっくりなほど大きくしないと尾が見えない */
  frameOffset?: number;
  /** 一番手前（直前フレーム）の残像の濃さ（0〜1）。省略時 0.2。奥の残像はここから薄くなっていく */
  opacity?: number;
};

type MotionBlurEffectProps = MotionBlurOptions & {
  /**
   * ラッパー（AbsoluteFill）に足すスタイル。
   * 残像は同じ位置に重ねて描くので、中身の位置決めはここか children 側で行う
   */
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * 中身の過去フレームを薄く重ねて、動いている方向へ尾を引かせるモーションブラー。
 * ぼかしフィルタではなく実際に過去フレームを描くので、上下移動と回転が混ざった動きでも
 * それぞれの軌跡どおりに尾が出る（children は同じ内容が複数回レンダリングされる）。
 *
 * 注意: 残像は children を過去フレームで描き直すことで作るので、
 * 動きの計算（useCurrentFrame を見る部分）は必ず children のコンポーネントの中で行うこと。
 * 呼び出し側で計算した transform を埋めた要素を渡すと、
 * 残像も現在フレームと同じ絵になって完全に重なり、何も起きていないように見える。
 * @param param0
 * @param param0.layers 残像の枚数
 * @param param0.frameOffset 残像 1 枚ぶんの時間差（フレーム）
 * @param param0.opacity 一番手前の残像の濃さ（0〜1）
 * @param param0.style ラッパーに足すスタイル
 * @param param0.children 尾を引かせる中身
 */
export const MotionBlurEffect = ({
  layers = 3,
  frameOffset = 1,
  opacity = 0.2,
  style,
  children,
}: MotionBlurEffectProps) => {
  return (
    <AbsoluteFill style={style}>
      {/* 奥（古いフレーム）から手前へ順に描き、最後に現在のフレームを重ねる */}
      {Array.from({ length: layers }, (_, index) => {
        const stepsBack = layers - index;

        return (
          <Sequence
            key={stepsBack}
            // Sequence の from は中身の時計を遅らせるので、そのぶん過去のフレームが描かれる
            from={stepsBack * frameOffset}
            layout="none"
            showInTimeline={false}
          >
            <AbsoluteFill style={{ opacity: (opacity * (index + 1)) / layers }}>
              {children}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
