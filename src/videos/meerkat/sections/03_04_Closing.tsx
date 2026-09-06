import { AbsoluteFill } from "remotion";
import {
  IMAGE_CUT_KINDS,
  ImageCut,
  ImageCuts,
} from "../../../lib/components/cuts/ImageCuts";
import { SimpleBackground } from "../../../lib/components/background/SimpleBackground";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";

/** オチのキャラ。ズームと引きで同じ絵を使い回す */
const CHARA_SRC = "assets/meerkat/images/Char_01_Neck.png";

/**
 * 歌詞に合わせたカットの並び。
 * セクションの頭が「でも ちょっとだけ...」の語頭なので、startSec はそこからの相対時間
 */
const CUTS: ImageCut[] = [
  // でも ちょっとだけ... : 体だけを大きく映して、何が起きたかはまだ見せない
  {
    kind: IMAGE_CUT_KINDS.CUTOUT,
    src: CHARA_SRC,
    startSec: 0,
    // 画面からはみ出すくらい寄る
    heightRatio: 1.74,
    // 画像の真ん中は顔の下あたりなので、体が画面の中央に来るまで持ち上げる
    transform: { translateX: -0.005, translateY: -0.26 },
    // 寄っているあいだにさらに寄って、じりじり近づく溜めを作る
    motion: { from: { scale: 1 }, to: { scale: 1.06 } },
  },
  // 首が こっちゃった : 引いて全身を見せ、曲がった首をオチにする。
  // 見せ切ったあとは、そのままキャラを左右に首振りさせて締める
  {
    kind: IMAGE_CUT_KINDS.CUTOUT,
    src: CHARA_SRC,
    startSec: 3.8,
    // 同じ絵の寄りと引きなので、溶かすと二重写しになる。ぼかしを混ぜて切り替える
    transitionIn: {
      kinds: [TRANSITION_KINDS.BLUR, TRANSITION_KINDS.FADE],
      durationSec: 0.35,
    },
    heightRatio: 0.9,
    transform: {
      translateX: -0.01,
      translateY: 0.01,
    },
    // 弾ませて「バーン」と出す
    pop: true,
    swing: {
      angleDeg: 5,
      periodSec: 2.2,
      // 曲がった首を見せる余韻を取ってから振り始める
      startAfterSec: 1.4,
    },
  },
];

/**
 * 曲の締め。ピンクの回転背景の上で、体の寄りから全身の引きへ切り替え、
 * 最後は全身を左右に首振りさせてオチにする
 */
export const Closing = () => {
  return (
    <AbsoluteFill>
      {/* イントロ・サビ（CharaBackground）と同じシードのピンク背景にして、
          曲の頭とオチをつなげる。飾りだけオチ用の Prop_02 に差し替える */}
      <SimpleBackground
        seed="meerkat-prop"
        propSrc="assets/meerkat/images/Prop_02.png"
        propSizeRatioMin={0.25}
        propSizeRatioMax={0.5}
      />
      <ImageCuts cuts={CUTS} />
    </AbsoluteFill>
  );
};
