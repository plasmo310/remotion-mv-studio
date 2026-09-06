import { AbsoluteFill } from "remotion";
import { ImageCut, ImageCuts } from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { BACKGROUND_CUTS, buildCheckCut } from "./01_02_PreChorus";

/**
 * 歌詞に合わせた手前のカットの並び。
 * セクションの頭が「前ヨシッ」の語頭なので、startSec はそこからの相対時間。
 * 「前ヨシッ／後ろヨシッ」までは1番のBメロと同じ見せ方で、そのあとは1枚絵で見せる。
 * 5つのカットの始まる秒だけ引数に取り、寄り方・画像はここに固定する
 * @param starts [前ヨシッ, 後ろヨシッ, いじょうありっ, Art_08, Art_09] の開始秒
 */
const buildCuts = (
  starts: readonly [number, number, number, number, number] = [
    0.2, 0.95, 1.75, 4.9, 11.6,
  ],
): ImageCut[] => [
  // 前ヨシッ : 反転して、右から左へ流しながら寄る
  buildCheckCut(starts[0], -1.35),
  // 後ろヨシッ : 左から右へ流しながら寄る
  buildCheckCut(starts[1], 1.35),
  // いじょうありっ？！ : 1枚絵を勢いよく突きつけて驚きを出す
  {
    src: "assets/meerkat/images/Art_07.png",
    startSec: starts[2],
    // 少し大きい状態から 0.3 秒で等倍へ戻して、画面に突きつける
    motionIn: { from: { scale: 1.08 }, to: { scale: 1 }, durationSec: 0.3 },
    motion: { from: { scale: 1 }, to: { scale: 1.02 } },
    // 異常発見でギョッとした感じの揺れ。突きつけの寄りより少し長く尾を引かせる
    shake: {
      amplitude: 0.012, // 画面サイズの約 1.2%
      frequency: 22, // 1秒あたりのノイズ進行。細かく速い震え
      durationSec: 0.45,
      rotateDeg: 1.6,
    },
  },
  // でも よういは しゅうとうだから 〜
  {
    src: "assets/meerkat/images/Art_08.png",
    startSec: starts[3],
    // 「ヨシッ」の並びはバツン切り替えにしてあり、1枚絵に入るここから溶かし始める
    transitionIn: {
      kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
      durationSec: 0.35,
    },
    // 長く出す1枚絵は、ゆっくり 8% 寄せて止まって見えないようにする
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
  // そっと かくれたら 〜 : サビへつなぐ
  {
    src: "assets/meerkat/images/Art_09.png",
    startSec: starts[4],
    // サビへ渡すので、ひとつ前より長めに溶かす
    transitionIn: {
      kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
      durationSec: 0.5,
    },
    motion: { from: { scale: 1 }, to: { scale: 1.03 } },
  },
];

type PreChorus2Props = {
  /**
   * 手前のカット5つの開始秒（セクション頭から）。省略時は日本語版の拍。
   * 英語版は「Front! / Back! / Not clear?! / But we're ready… / Quietly hide away…」の位置を渡す
   */
  cutStartSecs?: readonly [number, number, number, number, number];
};

/**
 * 2番のBメロ。ぼかした下地の上でカットを切り替え、後半は1枚絵を並べてサビへつなぐ
 * @param param0
 * @param param0.cutStartSecs 手前のカット5つの開始秒（セクション頭から）
 */
export const PreChorus2 = ({ cutStartSecs }: PreChorus2Props) => {
  return (
    <AbsoluteFill>
      {/* 下地と手前で blend をそろえる理由は 01_02_PreChorus のコメント参照 */}
      <ImageCuts cuts={BACKGROUND_CUTS} />
      <ImageCuts cuts={buildCuts(cutStartSecs)} />
    </AbsoluteFill>
  );
};
