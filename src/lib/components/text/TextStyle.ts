import { CSSProperties } from "react";
import {
  fontFamily as roundedFontFamily,
  loadFont,
} from "@remotion/google-fonts/MPLUSRounded1c";
import { DropShadowOptions } from "../../effects/functions/DropShadowEffect";

// ---------------------------------------------------------------------------
// 画面に出す文字（字幕・テロップ）の共通の見た目。
// 字幕とテロップは「同じ作品の文字」として見せるのが設計意図なので、
// 書体・縁取り・落ち影は必ず一致していなければならない。値をコピーせずここから引く。
// ---------------------------------------------------------------------------

// Rounded M+ 1c（Google Fonts の M PLUS Rounded 1c）。
// このファイルを import した時点で読み込みが走る。
// loadFont は同じ指定なら中で1回にまとめられるので、複数の側から import しても二重には読まない
loadFont("normal", {
  weights: ["700"],
  subsets: ["japanese", "latin"],
  // 日本語サブセットは文字コード範囲ごとに分割配信されるためリクエスト数が多くなる
  ignoreTooManyRequestsWarning: true,
});

/** 既定の書体。読めない字を欧文フォントに落とさないよう、丸ゴシックで受ける */
export const ROUNDED_FONT_FAMILY = `${roundedFontFamily}, "Hiragino Maru Gothic ProN", "Meiryo", sans-serif`;

/** 文字向けの落ち影。切り抜き（CutoutStage）よりも近く・やわらかく落とす */
export const TEXT_SHADOW: DropShadowOptions = {
  offsetRatio: 0.08,
  blurRatio: 0.1,
  alpha: 0.35,
};

/**
 * 文字の縁取り。
 * 縁は文字の輪郭を中心に描かれ、内側半分は塗りで隠れるため、見た目の太さは指定値のおよそ半分になる
 * @param fontSize 文字サイズ（px）
 * @param widthRatio 文字サイズに対する縁の太さの比率。0 以下で縁取りなし
 * @param color 縁の色
 */
export const textOutlineStyle = (
  fontSize: number,
  widthRatio: number,
  color: string,
): CSSProperties =>
  widthRatio > 0
    ? {
        WebkitTextStroke: `${fontSize * widthRatio}px ${color}`,
        // 縁を先に描いて塗りを上に重ねる。これがないと縁が文字を細らせる
        paintOrder: "stroke fill",
      }
    : {};
