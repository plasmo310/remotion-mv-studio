import { AbsoluteFill } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { FADE_BASE_COLOR } from "../settings/Theme";

/**
 * カット。間奏なので歌詞の切れ目がなく、3枚をほぼ均等に割り振っている。
 * 歌がない区間なので、どの絵も 10% ぶんの寄り・引きだけで間を持たせる
 */
const CUTS: ImageCut[] = [
  // ゆっくり寄る
  {
    src: "assets/meerkat/images/Art_10.png",
    startSec: 0,
    motion: { from: { scale: 1 }, to: { scale: 1.05 } },
  },
  // ゆっくり引く。寄り・引きを交互にして、3枚が同じ動きに見えないようにする
  {
    src: "assets/meerkat/images/Art_11.png",
    startSec: 3.2,
    // 歌でテンポを刻めない区間なので、Aメロより長めに溶かしてゆったり見せる
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
    motion: { from: { scale: 1.1 }, to: { scale: 1.05 } },
  },
  // ゆっくり寄りながらサビへ渡す
  {
    src: "assets/meerkat/images/Art_22.png",
    startSec: 6.2,
    // ひとつ前と同じ長さで溶かして、3枚の間合いをそろえる
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.6 },
    motion: {
      from: { translateY: 0.025, scale: 1.05 },
      to: { translateY: 0.05, scale: 1.1 },
    },
  },
];

/**
 * 間奏。歌のない区間を止め絵3枚でつなぐ
 */
export const Solo = () => {
  return (
    // 背景色は、フェード中に下地が透けるため置いておく
    <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
      <ImageCuts cuts={CUTS} />
    </AbsoluteFill>
  );
};
