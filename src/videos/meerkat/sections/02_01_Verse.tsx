import { AbsoluteFill } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { FADE_BASE_COLOR } from "../settings/Theme";

/**
 * カット。
 * 1番のAメロと同じ節回しなので、startSec も動きも 01_01_Verse に合わせて絵だけ差し替える
 */
const CUTS: ImageCut[] = [
  {
    src: "assets/meerkat/images/BG_06.png",
    startSec: 0,
    transform: {
      translateY: -0.1,
      scale: 1.2,
    },
    // ゆっくり引く
    motion: { from: { scale: 1.05 }, to: { scale: 1.02 } },
  },
  {
    src: "assets/meerkat/images/Art_02.png",
    startSec: 2.5,
    // BG_06 → Art_02 : クロスフェード
    transitionIn: { kinds: [TRANSITION_KINDS.FADE], durationSec: 0.4 },
    transform: {
      translateY: -0.1,
      scale: 1.2,
    },
    // 勢いよく
    motionIn: {
      from: { scale: 1.1 },
      to: { scale: 1.5, translateX: -0.35, translateY: 0.05 },
      durationSec: 0.35,
    },
    motion: { from: { translateX: -0.002 }, to: { translateX: 0.002 } },
  },
  {
    src: "assets/meerkat/images/Art_06.png",
    startSec: 6,
    // Art_02 → Art_06 : ぼかして切り替え
    transitionIn: { kinds: [TRANSITION_KINDS.BLUR], durationSec: 0.6 },
    // ゆっくり引く
    motion: { from: { scale: 1.05 }, to: { scale: 1 } },
  },
];

/**
 * 2番 Aメロ
 * 1番と同じく止め絵を順番に見せる
 */
export const Verse2 = () => {
  return (
    // 背景色は、フェード中に下地が透けるため置いておく
    <AbsoluteFill style={{ backgroundColor: FADE_BASE_COLOR }}>
      <ImageCuts cuts={CUTS} />
    </AbsoluteFill>
  );
};
