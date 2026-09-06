import { random, useCurrentFrame } from "remotion";

/** 乱れ方の上書き。省略した項目は既定値が使われる */
export type GlitchOptions = {
  /** 画像を切る横帯の数。省略時 7 */
  slices?: number;
  /** 色ずれの量（表示サイズに対する比率）。省略時 0.018 */
  chromaticRatio?: number;
  /** 色ずれの複製の濃さ（0〜1）。省略時 0.5 */
  chromaticOpacity?: number;
  /** 横帯を左右にずらす量の幅（表示サイズに対する比率、±）。省略時 0.05 */
  sliceShiftRatio?: number;
  /**
   * 揺れのばらつきの種。省略時 "glitch"。
   * 1画面に2つ置くときは別の値を渡す（同じ種だとまったく同じ揺れ方になる）
   */
  seed?: string;
};

type GlitchEffectProps = GlitchOptions & {
  /** 乱す中身。複製を重ねるので、同じ内容が何度もレンダリングされる */
  children: React.ReactNode;
};

/**
 * 横帯をずらして色をずらす、映像が乱れたようなエフェクト。
 * 中身をそのまま出したうえに、色をずらした複製と横帯をずらした複製を重ねる。
 * ずらし量は px ではなく自分の幅に対する % で持つので、中身の大きさを知らなくてよい
 * （**位置の基準になる position: relative な箱の中に置くこと**）
 * @param param0
 * @param param0.slices 画像を切る横帯の数
 * @param param0.chromaticRatio 色ずれの量（表示サイズに対する比率）
 * @param param0.chromaticOpacity 色ずれの複製の濃さ
 * @param param0.sliceShiftRatio 横帯を左右にずらす量の幅（表示サイズに対する比率、±）
 * @param param0.seed 揺れのばらつきの種
 * @param param0.children 乱す中身
 */
export const GlitchEffect = ({
  slices = 7,
  chromaticRatio = 0.018,
  chromaticOpacity = 0.5,
  sliceShiftRatio = 0.05,
  seed = "glitch",
  children,
}: GlitchEffectProps) => {
  const frame = useCurrentFrame();

  const layerStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  };

  return (
    <>
      {/* 乱していない元の中身。この上へ複製を重ねる */}
      {children}
      {/* 色ずれ。左右にずらした複製を薄く重ねる */}
      <div
        style={{
          ...layerStyle,
          transform: `translateX(${-chromaticRatio * 100}%)`,
          filter: "sepia(1) saturate(6) hue-rotate(-50deg)",
          opacity: chromaticOpacity,
        }}
      >
        {children}
      </div>
      <div
        style={{
          ...layerStyle,
          transform: `translateX(${chromaticRatio * 100}%)`,
          filter: "sepia(1) saturate(6) hue-rotate(140deg)",
          opacity: chromaticOpacity,
        }}
      >
        {children}
      </div>
      {/* 横帯。フレームごとにずらす量を変えて、走査線が飛んだように見せる */}
      {new Array(slices).fill(true).map((_, index) => {
        const top = (index / slices) * 100;
        const bottom = 100 - ((index + 1) / slices) * 100;
        // random() は同じ引数なら同じ値を返すので、フレーム番号を混ぜて毎フレーム引き直す。
        // 種に seed を含めるのは、同じ画面に2つ置いたとき同じ揺れ方にならないようにするため
        const shiftRatio =
          (random(`${seed}-${frame}-${index}`) - 0.5) * 2 * sliceShiftRatio;

        return (
          <div
            key={index}
            style={{
              ...layerStyle,
              clipPath: `inset(${top}% 0% ${bottom}% 0%)`,
              transform: `translateX(${shiftRatio * 100}%)`,
            }}
          >
            {children}
          </div>
        );
      })}
    </>
  );
};
