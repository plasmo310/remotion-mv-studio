import { AbsoluteFill } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { BACKGROUND_ART } from "../settings/Assets";
import { FADE_BASE_COLOR } from "../settings/Theme";

/**
 * カットの並び。Art_01（頭ぴょこっ）の開始秒だけ引数に取り、
 * 日本語版はセクション頭（11.4）から 2.5 秒後 = 「ぴょこっ」の語頭（13.88）に合わせている。
 * 英語版は歌の譜割りが違うので "little hole" の "hole" に合わせて秒を差し替える
 * @param artCutStartSec Art_01 を出して寄り始める秒（セクション頭から）
 */
const buildCuts = (artCutStartSec = 2.5): ImageCut[] => [
  {
    src: BACKGROUND_ART,
    startSec: 0,
    transform: {
      translateY: -0.1,
      scale: 1.2,
    },
    // ゆっくり引く
    motion: { from: { scale: 1.05 }, to: { scale: 1.02 } },
  },
  {
    src: "assets/meerkat/images/Art_01.png",
    startSec: artCutStartSec,
    // BG_05 → Art_01 : クロスフェード
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.4 },
    transform: {
      translateY: -0.1,
      scale: 1.2,
    },
    // 勢いよく
    motionIn: {
      from: { scale: 1.05 },
      to: { scale: 1.25, translateX: -0.035, translateY: -0.075 },
      durationSec: 0.35,
    },
    motion: { from: { translateX: -0.002 }, to: { translateX: 0.002 } },
  },
  {
    src: "assets/meerkat/images/Art_03.png",
    startSec: 6,
    // Art_01 → Art_03 : ぼかして切り替え
    transitionIn: { kinds: [TRANSITION_KINDS.BLUR], durationSec: 0.6 },
    // ゆっくり引く
    motion: { from: { scale: 1.05 }, to: { scale: 1 } },
  },
];

type VerseProps = {
  /**
   * Art_01（頭ぴょこっ）を出して寄り始める秒（セクション頭から）。省略時は日本語版の 2.5。
   * 英語版は "Poppin' up from a little hole" の "hole" に合わせて渡す
   */
  artCutStartSec?: number;
};

/**
 * 1番 Aメロ
 * 止め絵を順番に見せる
 * @param param0
 * @param param0.artCutStartSec Art_01 を出して寄り始める秒（セクション頭から）
 */
export const Verse = ({ artCutStartSec }: VerseProps) => {
  return (
    // 背景色は、フェード中に下地が透けるため置いておく
    <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
      <ImageCuts cuts={buildCuts(artCutStartSec)} />
    </AbsoluteFill>
  );
};
