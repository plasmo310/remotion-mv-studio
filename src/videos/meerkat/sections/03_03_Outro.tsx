import { AbsoluteFill } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { ENDING_ART } from "../settings/Assets";
import { FADE_BASE_COLOR } from "../settings/Theme";

/**
 * カット。startSec はセクションの頭（「どんな きけんが きたってさ」の語頭）からの相対時間。
 * 1枚を長く出すので、どちらもゆっくり 8% 寄せて止まって見えないようにする
 */
const CUTS: ImageCut[] = [
  // どんな きけんが きたってさ 〜 みんな いっしょなら こわくないよ
  {
    src: "assets/meerkat/images/Art_20.png",
    startSec: 0,
    motion: {
      from: { translateY: 0.02, scale: 1.05 },
      to: { translateY: 0.06, scale: 1.13 },
    },
  },
  // どんなに 首が つかれても 〜 みんなのために みわたすよ
  {
    src: ENDING_ART,
    startSec: 6.35,
    // Art_20 → Art_21 : オチの前にひと呼吸置くので短めのクロスフェード
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.4 },
    // この1枚だけ他より縦長で、中央（0.5）を残して切ると頭が欠ける。上寄りで切る
    focusRatio: 0.15,
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
];

/**
 * アウトロ。最後のフレーズを1枚絵2枚で見せて、オチ（03_04_Closing）へ渡す
 */
export const Outro = () => {
  return (
    // 背景色は、フェード中に下地が透けるため置いておく
    <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
      <ImageCuts cuts={CUTS} />
    </AbsoluteFill>
  );
};
