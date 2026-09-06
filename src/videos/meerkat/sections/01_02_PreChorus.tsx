import { AbsoluteFill } from "remotion";
import {
  IMAGE_CUT_KINDS,
  ImageCut,
  ImageCuts,
} from "../../../lib/components/cuts/ImageCuts";
import { TRANSITION_KINDS } from "../../../lib/components/transition/Transition";
import { BACKGROUND_ART } from "../settings/Assets";

/**
 * ずっと敷きっぱなしにする、ぼかした下地。
 * 1番・2番のBメロで同じものを使うので、2番（02_02_PreChorus）からも読む
 */
export const BACKGROUND_CUTS: ImageCut[] = [
  {
    src: BACKGROUND_ART,
    startSec: 0,
    blurPx: 8,
    motion: { from: { scale: 1.12 } },
  },
];

/**
 * 「ヨシッ」の寄りカットを1つ作る。
 * 1番・2番のBメロで同じ見せ方を使い回すので、変わるところ
 * （始まる時刻と流れる向き）だけ引数で受け取り、寄り方・揺れはここに固定する
 * @param startSec 表示を始める秒。セクションの頭からの相対時間
 * @param moveDirection 横に流す向きと距離。正で左から右へ、負で右から左へ流す
 *   （絶対値が流す距離の倍率。負のときは絵も左右反転して、体の向きを流れる向きにそろえる）
 */
export const buildCheckCut = (
  startSec: number,
  moveDirection: number,
): ImageCut => ({
  kind: IMAGE_CUT_KINDS.CUTOUT,
  src: "assets/meerkat/images/Char_01_Check_01.png",
  startSec,
  // 流れる向きと体の向きをそろえる
  flipped: moveDirection < 0,
  // 上半身だけが画面に収まるくらいまで寄る
  heightRatio: 1.74,
  // Char_01_Check_01 は頭が絵の上のほうにあるので、下げて頭〜上半身を画面に入れる
  transform: { translateY: 0.37 },
  // 頭の 0.36 秒だけで、奥（0.28倍）から定位置へ「ズバッ」と一気に寄せる
  motionIn: {
    from: { scale: 0.28, translateX: -0.16 * moveDirection },
    to: { scale: 1, translateX: 0.16 * moveDirection },
    durationSec: 0.325,
  },
  // 寄りついた瞬間に足す小さな揺れ。着地の勢いを出す
  shake: { amplitude: 0.016, frequency: 20, durationSec: 0.34, rotateDeg: 2 },
});

/**
 * 歌詞に合わせた手前のカットの並び。
 * セクションの頭が「右ヨシッ」の語頭なので、startSec はそこからの相対時間。
 * 4つのカットの始まる秒だけ引数に取り、寄り方・画像・向きはここに固定する
 * （英語版など、同じ流れで拍の位置だけ違う曲から秒を差し替えて使う）
 * @param starts [右ヨシッ, 左ヨシッ, いじょうなし, 1枚絵] の開始秒（セクション頭から）
 */
export const buildPreChorusCuts = (
  starts: readonly [number, number, number, number] = [0.15, 0.95, 1.96, 5.35],
): ImageCut[] => [
  // 右ヨシッ : 反転して、右から左へ流しながら寄る
  buildCheckCut(starts[0], -1.35),
  // 左ヨシッ : 左から右へ流しながら寄る
  buildCheckCut(starts[1], 1.35),
  // いじょうなし / 何も きけんはないさ : 真ん中に弾ませて出し、そのまま止める
  {
    kind: IMAGE_CUT_KINDS.CUTOUT,
    src: "assets/meerkat/images/Char_01_Check_04.png",
    startSec: starts[2],
    pop: true,
    // 少しだけ寄せた状態で止める（pop のスプリングはこの拡大率に掛かる）
    motion: { from: { translateY: 0.05, scale: 1.25 } },
  },
  // だけど ゆだんは きんもつだから 〜 : 1枚絵で覆ってサビへつなぐ
  {
    src: "assets/meerkat/images/Art_04.png",
    startSec: starts[3],
    // 「ヨシッ」の並びは歌詞のテンポでバツンと切り替えたいので演出なしにしてあり、
    // 1枚絵に入るここだけ、ぼかしながら溶かす
    transitionIn: {
      kinds: [TRANSITION_KINDS.FADE, TRANSITION_KINDS.BLUR],
      durationSec: 0.35,
    },
    // 長く出すので、ゆっくり寄せて止まって見えないようにする
    motion: { from: { scale: 1 }, to: { scale: 1.08 } },
  },
];

type PreChorusProps = {
  /**
   * 手前のカット4つの開始秒（セクション頭から）。省略時は日本語版の拍。
   * 英語版は「Right! / Left! / All clear! / But we can't…」の位置を渡す
   */
  cutStartSecs?: readonly [number, number, number, number];
};

/**
 * 1番のBメロ。ぼかした下地の上でカットを切り替え、最後は1枚絵でサビへつなぐ
 * @param param0
 * @param param0.cutStartSecs 手前のカット4つの開始秒（セクション頭から）
 */
export const PreChorus = ({ cutStartSecs }: PreChorusProps) => {
  return (
    <AbsoluteFill>
      {/* 下地と手前は blend をそろえること（どちらも既定の LINEAR_OVER_UNDER）。
          リニア合成の器の有無で絵の明るさが変わるので、片方だけ変えると2枚が食い違う */}
      <ImageCuts cuts={BACKGROUND_CUTS} />
      <ImageCuts cuts={buildPreChorusCuts(cutStartSecs)} />
    </AbsoluteFill>
  );
};
