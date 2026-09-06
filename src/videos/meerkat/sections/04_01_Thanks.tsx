import { AbsoluteFill, useVideoConfig } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { MeerkatTelop } from "../components/text/MeerkatTelop";
import { TRANSITION_BLENDS } from "../../../lib/components/transition/TransitionRun";
import {
  SUBTITLE_BOTTOM_RATIO,
  SUBTITLE_FONT_SIZE_RATIO,
} from "../components/text/MeerkatSubtitle";
import { ENDING_ART } from "../settings/Assets";
import { FADE_BASE_COLOR } from "../settings/Theme";

/** 背景に敷く1枚絵。オチと同じ絵をもう一度出して締めにする */
const CUTS: ImageCut[] = [
  {
    src: ENDING_ART,
    startSec: 0,
    // 他の絵より縦長で、中央を残して切ると頭が欠ける。上寄りで切る
    focusRatio: 0.15,
    // ゆっくり寄せて、止め絵のまま終わらないようにする
    motion: { from: { scale: 1 }, to: { scale: 1.06 } },
  },
];

type ThanksProps = {
  /** 画面に出すお礼の文言。省略時は日本語版の文言 */
  text?: string;
};

/**
 * 曲が終わったあとの締め。1枚絵の上にお礼のテロップを出す。
 * テロップは大きさ・位置・書体を歌詞（字幕）にそろえて、字幕の続きとして見せる
 * @param param0
 * @param param0.text 画面に出すお礼の文言
 */
export const Thanks = ({ text = "みてくれてありがとう!!" }: ThanksProps) => {
  const { height } = useVideoConfig();

  const fontSize = height * SUBTITLE_FONT_SIZE_RATIO;

  return (
    // 背景色は、フェード中に下地が透けるため置いておく
    <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
      {/* カットが1枚だけなので境目はない。
          既定（LINEAR_OVER_UNDER）はリニア合成の器を挟み、その往復が絵の明るさを
          わずかに変えてしまう。ここは器を通さない CROSS_DISSOLVE を明示する */}
      <ImageCuts cuts={CUTS} blend={TRANSITION_BLENDS.CROSS_DISSOLVE} />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          // 歌詞とまったく同じ位置に出したいので、字幕の余白をそのまま使う
          paddingBottom: height * SUBTITLE_BOTTOM_RATIO,
        }}
      >
        <MeerkatTelop text={text} fontSize={fontSize} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
