import { Telop, TelopProps } from "../../../../lib/components/text/Telop";
import { OUTLINE_BROWN } from "../../settings/Theme";

/**
 * この作品のテロップ。
 * 白文字＋キャラの茶色の縁取りに固定して、歌詞（字幕）・ロゴと同じ文字として見せる
 * @param props 文言・大きさ・置き場所（縁の色以外は汎用の Telop と同じ）
 */
export const MeerkatTelop = (props: Omit<TelopProps, "strokeColor">) => {
  return <Telop {...props} strokeColor={OUTLINE_BROWN} />;
};
