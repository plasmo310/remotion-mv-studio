import {
  Subtitle,
  SubtitleMode,
  LyricsData,
  SUBTITLE_FONT_SIZE_RATIO,
} from "../../../../lib/components/text/Subtitle";
import { useShortSideScale } from "../../../../lib/units/ShortSideScale";
import { JA_LYRICS } from "../../data/Lyrics";
import { OUTLINE_BROWN } from "../../settings/Theme";

// 汎用 Subtitle のレイアウト比率をそのまま使う。
// Thanks のテロップが字幕と同じ位置・大きさに揃えるために参照する
export {
  SUBTITLE_MODES,
  SUBTITLE_FONT_SIZE_RATIO,
  SUBTITLE_BOTTOM_RATIO,
} from "../../../../lib/components/text/Subtitle";

type MeerkatSubtitleProps = {
  /** 表示モード */
  mode?: SubtitleMode;
  /** 歌詞データ。省略時はこのMVの日本語版歌詞。英語版は英語の歌詞データを渡す */
  lyrics?: LyricsData;
  /** 歌詞全体のタイミング補正（秒） */
  offsetInSeconds?: number;
  /** 画面高さに対する下端からの余白の比率。省略時 SUBTITLE_BOTTOM_RATIO */
  bottomRatio?: number;
  /** 文字サイズに対するアウトラインの太さの比率。0 で縁取りなし */
  strokeWidthRatio?: number;
};

/**
 * このMV（ミーアキャット）の歌詞データと配色を固定した字幕。
 * タイミングやレイアウトの調整値は汎用 Subtitle の既定値をそのまま使う
 * @param param0
 * @param param0.mode 表示モード
 * @param param0.lyrics 歌詞データ（省略時はこのMVの日本語版歌詞）
 * @param param0.offsetInSeconds 歌詞全体のタイミング補正（秒）
 * @param param0.bottomRatio 画面高さに対する下端からの余白の比率
 * @param param0.strokeWidthRatio 文字サイズに対するアウトラインの太さの比率
 */
export const MeerkatSubtitle = ({
  mode,
  lyrics,
  offsetInSeconds,
  bottomRatio,
  strokeWidthRatio,
}: MeerkatSubtitleProps) => {
  // 文字サイズは画面高さ基準なので、縦動画ではそのままだと1行に2〜3文字しか入らない。
  // 短辺基準に読み替えて、横動画と同じ「画面幅に対する大きさ」で出す
  const shortSideScale = useShortSideScale();

  return (
    <Subtitle
      lyrics={lyrics ?? JA_LYRICS}
      mode={mode}
      offsetInSeconds={offsetInSeconds}
      fontSizeRatio={SUBTITLE_FONT_SIZE_RATIO * shortSideScale}
      bottomRatio={bottomRatio}
      strokeWidthRatio={strokeWidthRatio}
      // 白い文字を黄色で塗っていき、縁取りはキャラの茶色に寄せる
      baseColor="#ffffff"
      sungColor="#ffd45e"
      strokeColor={OUTLINE_BROWN}
    />
  );
};
