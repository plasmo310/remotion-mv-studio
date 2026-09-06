import {
  dropShadowEffect,
  DropShadowOptions,
} from "../../effects/functions/DropShadowEffect";
import {
  ROUNDED_FONT_FAMILY,
  TEXT_SHADOW,
  textOutlineStyle,
} from "./TextStyle";

/**
 * 折り返し方。
 * WRAP: 画面幅に収まらないとき空白の位置で折り返す（語の途中では切らない）
 * NOWRAP: 折り返さず1行のまま
 */
export const TELOP_WRAPS = {
  WRAP: "wrap",
  NOWRAP: "nowrap",
} as const;

export type TelopWrap = (typeof TELOP_WRAPS)[keyof typeof TELOP_WRAPS];

export type TelopProps = {
  /** 表示する文言 */
  text: string;
  /** 文字サイズ（px）。画面サイズからどう決めるかは呼び出し側の都合 */
  fontSize: number;
  /** 文字色。省略時 白 */
  color?: string;
  /** 縁取りの色。省略時 黒 */
  strokeColor?: string;
  /**
   * 文字サイズに対する縁の太さの比率。0 で縁取りなし。省略時 0.2。
   * 縁は文字の輪郭を中心に描かれ、内側半分は塗りで隠れるため、
   * 見た目の太さは指定値のおよそ半分になる
   */
  strokeWidthRatio?: number;
  /** 落ち影の強さの上書き。省略時は文字向けの既定（少し下に、やわらかく） */
  shadow?: DropShadowOptions;
  /** 折り返し方。省略時 WRAP */
  wrap?: TelopWrap;
  /** 書体。省略時 ROUNDED_FONT_FAMILY（字幕と同じ丸ゴシック） */
  fontFamily?: string;
  /** 置き場所・登場の動きなど、呼び出し側の事情で足すスタイル */
  style?: React.CSSProperties;
};

/**
 * 画面に出す短い文言（テロップ）。
 * 縁取り・落ち影・折り返しの作法だけを持ち、どこに置くか・どう出すかは style で受ける
 * @param param0
 * @param param0.text 表示する文言
 * @param param0.fontSize 文字サイズ（px）
 * @param param0.color 文字色
 * @param param0.strokeColor 縁取りの色
 * @param param0.strokeWidthRatio 文字サイズに対する縁の太さの比率
 * @param param0.shadow 落ち影の強さの上書き
 * @param param0.wrap 折り返し方
 * @param param0.fontFamily 書体
 * @param param0.style 置き場所・登場の動きなど、呼び出し側の事情で足すスタイル
 */
export const Telop = ({
  text,
  fontSize,
  color = "#ffffff",
  strokeColor = "#000000",
  strokeWidthRatio = 0.2,
  shadow,
  wrap = TELOP_WRAPS.WRAP,
  fontFamily = ROUNDED_FONT_FAMILY,
  style,
}: TelopProps) => {
  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        color,
        ...textOutlineStyle(fontSize, strokeWidthRatio, strokeColor),
        ...(wrap === TELOP_WRAPS.WRAP
          ? {
              // 画面幅に収まらないときは、語の途中ではなく空白の位置で改行する。
              // keep-all がないと、日本語は文字と文字の間ならどこでも改行されてしまう
              whiteSpace: "pre-wrap",
              wordBreak: "keep-all",
            }
          : { whiteSpace: "pre" }),
        filter: dropShadowEffect(fontSize, { ...TEXT_SHADOW, ...shadow }),
        ...style,
      }}
    >
      {text}
    </div>
  );
};
